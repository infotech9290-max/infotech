import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ADMISSIONS_FILE = path.join(DATA_DIR, 'admissions.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');

async function ensureDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

/**
 * Reads all admissions from local resilient storage
 */
export async function getLocalAdmissions(workerId?: string | null): Promise<any[]> {
  await ensureDirectory();
  try {
    const raw = await fs.readFile(ADMISSIONS_FILE, 'utf-8');
    let records = JSON.parse(raw);
    if (!Array.isArray(records)) records = [];

    if (workerId && workerId.trim()) {
      const filterStr = workerId.trim().toLowerCase();
      return records.filter((r: any) => {
        const rWorkerId = String(r.worker_id || '').toLowerCase();
        const rWorkerName = String(r.worker_name || '').toLowerCase();
        return rWorkerId.includes(filterStr) || rWorkerName.includes(filterStr);
      });
    }

    return records;
  } catch {
    return [];
  }
}

/**
 * Appends or updates an admission record in local resilient storage
 */
export async function saveLocalAdmission(record: any): Promise<any> {
  await ensureDirectory();
  try {
    let records = await getLocalAdmissions();
    const existingIndex = records.findIndex(
      (r: any) => r.unique_id === record.unique_id || (record.id && r.id === record.id)
    );

    const fullRecord = {
      ...record,
      updated_at: new Date().toISOString(),
      created_at: record.created_at || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      records[existingIndex] = { ...records[existingIndex], ...fullRecord };
    } else {
      records.unshift(fullRecord);
    }

    await fs.writeFile(ADMISSIONS_FILE, JSON.stringify(records, null, 2), 'utf-8');
    return fullRecord;
  } catch (err) {
    console.error('Failed to save to local admission storage:', err);
    return record;
  }
}

/**
 * Updates status and balance_due of a student in local resilient storage
 */
export async function updateLocalAdmissionStatus(
  uniqueId: string,
  status: string,
  balanceDue?: number
): Promise<any | null> {
  await ensureDirectory();
  try {
    let records = await getLocalAdmissions();
    const cleanId = uniqueId.trim();
    const index = records.findIndex(
      (r: any) => String(r.unique_id).trim() === cleanId || String(r.id).trim() === cleanId
    );

    if (index >= 0) {
      records[index].status = status;
      if (balanceDue !== undefined && !isNaN(balanceDue)) {
        records[index].balance_due = balanceDue;
      }
      records[index].updated_at = new Date().toISOString();
      await fs.writeFile(ADMISSIONS_FILE, JSON.stringify(records, null, 2), 'utf-8');
      return records[index];
    }
    return null;
  } catch (err) {
    console.error('Failed to update student status in local storage:', err);
    return null;
  }
}

/**
 * Reads settings from local resilient storage
 */
export async function getLocalSettings(): Promise<any> {
  await ensureDirectory();
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      id: 1,
      upi_id: 'infotech@icici',
      bank_name: 'INFO TECH PVT LTD',
      bank_account: '31245678901',
      bank_ifsc: 'SBIN0001234',
      qr_image_url: '/receipt-qr.png',
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Saves settings to local resilient storage
 */
export async function saveLocalSettings(settings: any): Promise<any> {
  await ensureDirectory();
  try {
    const current = await getLocalSettings();
    const updated = {
      ...current,
      ...settings,
      id: 1,
      updated_at: new Date().toISOString(),
    };
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (err) {
    console.error('Failed to save settings locally:', err);
    return settings;
  }
}

/**
 * Reads audit logs from local resilient storage
 */
export async function getLocalAuditLogs(): Promise<any[]> {
  await ensureDirectory();
  try {
    const raw = await fs.readFile(AUDIT_LOGS_FILE, 'utf-8');
    const records = JSON.parse(raw);
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

/**
 * Appends an audit log event
 */
export async function logLocalAuditEvent(
  action: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<any> {
  await ensureDirectory();
  try {
    const logs = await getLocalAuditLogs();
    const newLog = {
      id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      action,
      device_info: (deviceInfo || 'System Session').slice(0, 150),
      ip_address: ipAddress || '127.0.0.1',
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep max 500 audit entries
    const trimmed = logs.slice(0, 500);
    await fs.writeFile(AUDIT_LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
    return newLog;
  } catch (err) {
    console.warn('Failed to write local audit log:', err);
    return null;
  }
}
