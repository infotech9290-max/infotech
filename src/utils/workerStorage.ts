import fs from 'fs';
import path from 'path';

const LOCAL_WORKERS_FILE = path.join(process.cwd(), 'data', 'workers.json');

export interface LocalWorker {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  phone?: string;
  designation?: string;
  created_at: string;
  status: string;
}

export function readLocalWorkers(): LocalWorker[] {
  try {
    if (fs.existsSync(LOCAL_WORKERS_FILE)) {
      const content = fs.readFileSync(LOCAL_WORKERS_FILE, 'utf-8');
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.error('Error reading local workers file:', err);
  }
  return [];
}

export function writeLocalWorkers(workers: LocalWorker[]) {
  try {
    const dir = path.dirname(LOCAL_WORKERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_WORKERS_FILE, JSON.stringify(workers, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local workers file:', err);
  }
}
