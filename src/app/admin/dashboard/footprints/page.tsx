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

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/audit-logs');
        if (!res.ok) {
          throw new Error(`Failed to load audit logs: ${res.status}`);
        }
        const json = await res.json();
        if (json.data) {
          setLogs(json.data as AuditLog[]);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
          Audit Footprints
        </h1>
        <p className="text-sm text-slate-500 mt-1">Live tracking of all administrative actions, status verifications, and access attempts.</p>
      </div>

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
            All future admin actions (such as student enrollment approvals, rejections, and setting updates) will be automatically audited and timestamped here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{log.action}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                    {log.device_info || 'System Activity'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(log.created_at).toLocaleString('en-GB')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
