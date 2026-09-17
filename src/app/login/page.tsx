'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Sparkles, KeyRound, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false); // Toggle for OTP recovery UI

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsAuthenticating(true);

    try {
      if (!email.includes('@')) {
        setErrorMsg('Invalid email format');
        setIsAuthenticating(false);
        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        login(data.user.role, data.user);
      } else {
        setErrorMsg(data.error || 'Invalid credentials');
        setIsAuthenticating(false);
      }
    } catch (err) {
      setErrorMsg('An error occurred during login. Please try again.');
      setIsAuthenticating(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden font-sans p-4">
      {/* Dynamic background blur orbs for stealthy high-tech look */}
      <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-slate-800/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700 p-8 sm:p-10 relative z-10"
      >
        {/* Stealth Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-600">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">SYSTEM LOGIN</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Secure Authentication Gateway
            </p>
          </div>
        </div>

        {/* Forms Container */}
        <AnimatePresence mode="wait">
          {!isForgotPassword ? (
            <motion.form
              key="login-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLogin}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-slate-900/50 border-slate-600 text-white pl-10 focus-visible:ring-blue-500 rounded-xl"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Password
                  </Label>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Enter your security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-slate-900/50 border-slate-600 text-white pl-10 focus-visible:ring-blue-500 rounded-xl"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isAuthenticating}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isAuthenticating ? 'Authenticating...' : 'Secure Login'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="forgot-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-700/60 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Password Recovery</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  For security reasons, worker credentials are managed directly by the Super Administrator. Please contact your admin to reset your credentials.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all cursor-pointer"
              >
                Return to Login
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-bold text-center bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 mt-5">
            {errorMsg}
          </p>
        )}

        <div className="pt-6 mt-6 border-t border-slate-700 text-center">
          <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            End-to-End Encrypted Gateway
          </p>
        </div>
      </motion.div>
    </div>
  );
}
