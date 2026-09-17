'use client';

import React, { useState } from 'react';
import { ShieldCheck, Database, CheckCircle2, Loader2, AlertTriangle, KeyRound, ExternalLink } from 'lucide-react';

export default function SetupPage() {
  const [pat, setPat] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pat.trim()) return;
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pat: pat.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage('✅ Database initialized! All tables created. You can now login.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Setup failed. Please check your PAT token.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Make sure the app is running.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      {/* Background blur orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-lg space-y-6 z-10">

        {/* Header Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">One-Click Database Setup</h1>
          <p className="text-slate-400 text-sm mt-2">
            Automatically creates all required tables in your Supabase database. <br />
            Run this once — and add <code className="text-blue-400 bg-slate-700 px-1.5 py-0.5 rounded text-xs">SUPABASE_PAT</code> to Vercel for fully automatic future deployments.
          </p>
        </div>

        {/* How to get PAT */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-400" />
            How to get your Personal Access Token (PAT)
          </h2>
          <ol className="space-y-1.5 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
              Go to <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noreferrer" className="text-blue-400 underline flex items-center gap-1">supabase.com/dashboard/account/tokens <ExternalLink className="w-3 h-3" /></a>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
              Click <strong className="text-white">"Generate new token"</strong> → give it any name like "Portal Setup"
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
              Copy the token (starts with <code className="text-blue-300 bg-slate-700 px-1 rounded">sbp_</code>) and paste below
            </li>
          </ol>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSetup} className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700 p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Supabase Personal Access Token
            </label>
            <input
              type="password"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="sbp_xxxxxxxxxxxxxxxxxxxx"
              required
              className="w-full h-12 rounded-xl bg-slate-900/60 border border-slate-600 text-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600 font-mono"
            />
            <p className="text-[11px] text-slate-500">
              This token is used only for the one-time database migration. It is never stored anywhere.
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${
              status === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {status === 'success'
                ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || !pat.trim()}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Initializing Database...</>
            ) : status === 'success' ? (
              <><CheckCircle2 className="w-4 h-4" /> Setup Complete!</>
            ) : (
              <><Database className="w-4 h-4" /> Initialize Database Now</>
            )}
          </button>

          {status === 'success' && (
            <a
              href="/login"
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Go to Login → Email: infotech9290@gmail.com / Password: admin
            </a>
          )}
        </form>

        {/* Vercel auto-setup tip */}
        <div className="bg-blue-600/10 rounded-2xl border border-blue-500/20 p-5">
          <h3 className="text-sm font-bold text-blue-400 mb-2">🚀 For Fully Automatic Future Deployments:</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Add <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded">SUPABASE_PAT</code> as an Environment Variable in your Vercel project settings. After that, every deployment will automatically migrate the database — no manual steps ever!
          </p>
          <div className="mt-3 text-xs text-slate-500 space-y-1">
            <p>Vercel: Project → Settings → Environment Variables → Add:</p>
            <code className="block bg-slate-800 rounded p-2 text-slate-300">SUPABASE_PAT = sbp_your_token_here</code>
          </div>
        </div>
      </div>
    </div>
  );
}
