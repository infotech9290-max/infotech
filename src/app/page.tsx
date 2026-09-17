'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user && role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (user && role === 'WORKER') {
        router.replace('/worker/my-dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, role, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 animate-pulse">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-white">Admission Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Connecting to Secure Admission Network...</p>
        </div>
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin mt-2" />
      </div>
    </div>
  );
}
