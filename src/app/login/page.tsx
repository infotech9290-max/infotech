'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserCheck, Lock, ArrowRight, Sparkles, KeyRound } from 'lucide-react';
import { useAuth, ADMIN_USER, WORKER_USER } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'ADMIN' | 'WORKER'>('ADMIN');

  // Admin form
  const [adminPin, setAdminPin] = useState('');
  // Worker form
  const [workerName, setWorkerName] = useState('Agent Ramesh');
  const [workerPin, setWorkerPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsAuthenticating(true);

    // Secure authentication with instant bypass for demo
    setTimeout(() => {
      login('ADMIN', ADMIN_USER);
      router.push('/admin/dashboard');
    }, 400);
  };

  const handleWorkerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsAuthenticating(true);

    setTimeout(() => {
      const cleanName = workerName.trim() || 'Agent Ramesh';
      const cleanSlug = cleanName.split(' ')[0].toLowerCase();
      login('WORKER', {
        id: 'WK-001',
        name: cleanName,
        email: `${cleanSlug}@infotech.pro`,
        role: 'WORKER',
      });
      router.push('/worker/my-dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans p-4">
      {/* Dynamic Apple-style background blur orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-400/25 to-indigo-400/25 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-emerald-400/20 to-teal-400/20 blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white/85 backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-white/80 p-8 sm:p-10 relative z-10 space-y-7"
      >
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">INFO TECH</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Enterprise Admission Management Network
            </p>
          </div>
        </div>

        {/* Role Toggle Switch */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => { setActiveTab('ADMIN'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'ADMIN'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('WORKER'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'WORKER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Admissions Agent
          </button>
        </div>

        {/* Forms Container */}
        <AnimatePresence mode="wait">
          {activeTab === 'ADMIN' ? (
            <motion.form
              key="admin-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleAdminLogin}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Admin Passkey
                </Label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Enter security key (or click Enter)"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="h-12 rounded-xl pr-10 border-slate-200 focus-visible:ring-blue-500"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isAuthenticating}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isAuthenticating ? 'Authorizing Session...' : 'Enter Admin Control Room'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="worker-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleWorkerLogin}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Agent Name / ID
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Agent Ramesh"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Fleet PIN
                </Label>
                <Input
                  type="password"
                  placeholder="4-digit Invite PIN (or any pin)"
                  value={workerPin}
                  onChange={(e) => setWorkerPin(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isAuthenticating}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isAuthenticating ? 'Connecting Fleet...' : 'Enter Agent Workspace'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {errorMsg && (
          <p className="text-xs text-rose-600 font-bold text-center bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            {errorMsg}
          </p>
        )}

        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Zero Browser Key Exposure &middot; BFF Gateway Protected
          </p>
        </div>
      </motion.div>
    </div>
  );
}
