'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, Activity, Loader2, CheckCircle2 } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  device_info?: string;
  ip_address?: string;
  created_at: string;
}

export default function FootprintsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/audit-logs', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setLogs(json.data as AuditLog[]);
      } else {
        setLogs([]);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Failed to load audit logs:', err);
      setErrorMsg('Unable to retrieve audit telemetry. Ensure database is set up.');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Header with Live Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            Audit Footprints
          </h1>
          <p className="text-sm text-slate-500 mt-1">Live tracking of administrative actions, status verifications, and staff access.</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
        >
          {isLoading ? 'Syncing...' : '↻ Refresh Logs'}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{errorMsg}</p>
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-500">Querying cloud audit telemetry...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <Activity className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Audit Incidents Recorded</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            All future actions (such as admissions, approvals, deletions, and settings changes) will be automatically audited and timestamped here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden divide-y divide-slate-100">
          {logs.map((log) => {
            const isDelete = log.action.toLowerCase().includes('remove') || log.action.toLowerCase().includes('reject');
            const isSuccess = log.action.toLowerCase().includes('registered') || log.action.toLowerCase().includes('enrolled');
            return (
              <div key={log.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isDelete ? 'bg-rose-50 text-rose-600' : isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                      {log.ip_address ? `IP: ${log.ip_address} • ` : ''}{log.device_info || 'System Activity'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
