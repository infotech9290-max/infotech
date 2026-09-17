'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Briefcase, TrendingUp, ChevronRight, CheckCircle2, Copy, Check, Trash2, KeyRound } from 'lucide-react';

interface WorkerCard {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INVITED';
  admissions: number;
  successRate: string;
  isBoss?: boolean;
}

export default function WorkersPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Admissions Counselor');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [workers, setWorkers] = useState<WorkerCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitedPin, setInvitedPin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reset password state
  const [resetTarget, setResetTarget] = useState<WorkerCard | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const fetchWorkers = async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch real workers from our new secure JSON database
      const workersRes = await fetch('/api/admin/workers');
      const workersJson = await workersRes.json();
      const realWorkers = workersJson.workers || [];

      // 2. Fetch admissions to calculate real success stats
      const admissionsRes = await fetch('/api/admissions');
      const admissionsJson = await admissionsRes.json();
      const admissionsData = admissionsJson.data || [];

      // Map stats
      const statsMap: Record<string, { total: number; success: number }> = {};
      admissionsData.forEach((row: any) => {
        const email = (row.worker_email || '').toLowerCase();
        if (!statsMap[email]) statsMap[email] = { total: 0, success: 0 };
        statsMap[email].total += 1;
        if ((row.status || '').toUpperCase() === 'ENROLLED') {
          statsMap[email].success += 1;
        }
      });

      // Format workers with stats
      const formattedWorkers: WorkerCard[] = realWorkers.map((w: any) => {
        const stats = statsMap[w.email.toLowerCase()] || { total: 0, success: 0 };
        const rate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;
        return {
          id: w.id,
          name: w.name,
          email: w.email,
          status: 'ACTIVE',
          admissions: stats.total,
          successRate: `${rate}%`
        };
      });

      // Boss Card (Fixed Top) — always real data from DB
      const bossStats = statsMap['info@admin.com'] || { total: 0, success: 0 };
      const bossRate = bossStats.total > 0 ? Math.round((bossStats.success / bossStats.total) * 100) : 0;
      
      const bossCard: WorkerCard = {
        id: 'ADM-01',
        name: 'Super Admin (Director & Counselor)',
        email: 'info@admin.com',
        status: 'ACTIVE',
        isBoss: true,
        admissions: bossStats.total,
        successRate: `${bossRate}%`,
      };

      setWorkers([bossCard, ...formattedWorkers]);
    } catch (err) {
      console.error('Failed to load workers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    // Generate a secure 6-digit PIN instead of 4 for better security
    const securePin = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim(), 
          password: securePin,
          phone: phone.trim(),
          designation: designation.trim() || 'Admissions Counselor'
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Failed to create worker');
        return;
      }

      setWorkers((prev) => (prev.length > 0 ? [prev[0], data.worker, ...prev.slice(1)] : [data.worker]));
      setInvitedPin(securePin); // Show PIN in UI for admin to share
    } catch {
      alert('Error creating worker');
    }
  };

  const closeDialog = () => {
    setIsInviteOpen(false);
    setInvitedPin(null);
    setName('');
    setEmail('');
    setPhone('');
    setDesignation('Admissions Counselor');
  };

  const copyPin = () => {
    if (invitedPin) {
      navigator.clipboard.writeText(invitedPin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async (workerId: string) => {
    if (!confirm('Are you sure you want to remove this worker? This cannot be undone.')) return;
    setDeletingId(workerId);
    try {
      const res = await fetch(`/api/admin/workers/${workerId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setWorkers((prev) => prev.filter((w) => w.id !== workerId));
      } else {
        alert(data.error || 'Failed to delete worker');
      }
    } catch {
      alert('Error deleting worker');
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || !resetNewPassword || resetNewPassword.length < 6) return;
    setIsResetting(true);
    setResetMsg(null);
    try {
      const res = await fetch(`/api/admin/workers/${resetTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetNewPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetMsg(`✅ Password for ${resetTarget.name} reset successfully!`);
        setResetNewPassword('');
      } else {
        setResetMsg(`❌ ${data.error || 'Failed to reset password'}`);
      }
    } catch {
      setResetMsg('❌ Error resetting password');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Workers</h1>
          <p className="text-sm text-slate-500 mt-1">Admissions counseling staff directory, active conversion ratios, and team management.</p>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsInviteOpen(true); }}>
          <DialogTrigger className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md gap-2 h-11 px-6 flex items-center justify-center font-bold text-sm cursor-pointer transition-all active:scale-95">
            <UserPlus className="w-4 h-4" />
            + Invite New Worker
          </DialogTrigger>
          <DialogContent className="w-[90vw] sm:max-w-lg p-6 bg-white border border-slate-200 shadow-2xl rounded-3xl sm:rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {invitedPin ? 'Worker Invited Successfully!' : 'Invite New Worker'}
              </DialogTitle>
              <p className="text-sm text-slate-500">
                {invitedPin
                  ? 'Share the credentials below with the new admissions agent.'
                  : 'Assign portal credentials and invite PIN for secure onboarding.'}
              </p>
            </DialogHeader>

            {invitedPin ? (
              <div className="space-y-5 pt-4">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                    One-Time Security PIN
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-mono font-black text-emerald-700 tracking-widest">
                      {invitedPin}
                    </span>
                    <button
                      onClick={copyPin}
                      className="p-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                      title="Copy PIN"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-emerald-600">
                    Agent {name} can now sign into the Admissions Portal.
                  </p>
                </div>
                <Button onClick={closeDialog} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer">
                  Done & Close
                </Button>
              </div>
            ) : (
              <form className="space-y-4 pt-4" onSubmit={handleInvite}>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name *</Label>
                  <Input
                    className="h-11 rounded-xl"
                    placeholder="e.g. Vikas Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Email *</Label>
                  <Input
                    className="h-11 rounded-xl"
                    placeholder="worker@yourdomain.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mobile Phone (Optional)</Label>
                    <Input
                      className="h-11 rounded-xl"
                      placeholder="e.g. 9876543210"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Designation / Role</Label>
                    <Input
                      className="h-11 rounded-xl"
                      placeholder="e.g. Admissions Counselor"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer mt-2">
                  Generate Invite & PIN
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-3xl" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <p className="text-slate-500 font-medium">No workers active in the fleet yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((worker, i) => (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-3xl border shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group",
                worker.isBoss
                  ? "bg-gradient-to-br from-amber-50/80 via-white to-purple-50/40 border-amber-300 ring-2 ring-amber-400/20"
                  : "bg-white border-slate-200/60"
              )}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center font-black",
                      worker.isBoss
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/25 text-2xl"
                        : "bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 border border-blue-100 text-xl"
                    )}>
                      {worker.isBoss ? '👑' : (worker.name || 'W').split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900 leading-tight">{worker.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{worker.id}</p>
                    </div>
                  </div>
                  {worker.isBoss ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-[10px] font-black text-amber-900 uppercase tracking-wider border border-amber-300">
                      👑 Director
                    </span>
                  ) : worker.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase tracking-wider border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[10px] font-bold text-amber-600 uppercase tracking-wider border border-amber-200">
                      Invited
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase">Assigned</span>
                    </div>
                    <p className="text-xl font-black text-slate-900">{worker.admissions}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase">Success</span>
                    </div>
                    <p className="text-xl font-black text-emerald-600">{worker.successRate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/admin/dashboard/workers/${encodeURIComponent(worker.id)}`} className="flex-1">
                    <Button variant="outline" className={cn(
                      "w-full h-10 rounded-xl font-bold transition-all cursor-pointer text-sm",
                      worker.isBoss
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                        : "bg-white border-slate-200 hover:bg-slate-50 hover:text-blue-600"
                    )}>
                      View <ChevronRight className="w-4 h-4 ml-1 opacity-50" />
                    </Button>
                  </Link>
                  {!worker.isBoss && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Reset Password"
                        onClick={() => { setResetTarget(worker); setResetMsg(null); setResetNewPassword(''); }}
                        className="h-10 w-10 rounded-xl border-slate-200 text-blue-600 hover:bg-blue-50 cursor-pointer p-0 flex items-center justify-center"
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Delete Worker"
                        disabled={deletingId === worker.id}
                        onClick={() => handleDelete(worker.id)}
                        className="h-10 w-10 rounded-xl border-red-200 text-red-500 hover:bg-red-50 cursor-pointer p-0 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) { setResetTarget(null); setResetMsg(null); setResetNewPassword(''); } }}>
        <DialogContent className="w-[90vw] sm:max-w-md p-6 bg-white border border-slate-200 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              Reset Password — {resetTarget?.name}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Set a new password for this worker. Share it with them directly.</p>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">New Password (min 6 chars)</Label>
              <Input
                className="h-12 rounded-xl"
                type="text"
                placeholder="Enter new password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {resetMsg && (
              <p className={`text-sm font-medium p-3 rounded-xl ${resetMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {resetMsg}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setResetTarget(null)} className="flex-1 h-11 rounded-xl cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={isResetting} className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">
                {isResetting ? 'Saving...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
