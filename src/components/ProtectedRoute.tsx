'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

export function ProtectedRoute({ 
  children, 
  requireAdmin = false 
}: { 
  children: React.ReactNode, 
  requireAdmin?: boolean 
}) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (requireAdmin && role !== 'ADMIN') {
        router.replace('/worker/my-dashboard');
      }
    }
  }, [user, role, isLoading, requireAdmin, router]);

  // Guard: NEVER render protected content if loading or unauthenticated
  if (isLoading || !user || (requireAdmin && role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 animate-pulse">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-white">PORTAL SECURITY</h1>
            <p className="text-xs text-slate-400 mt-1">Verifying Access Credentials...</p>
          </div>
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
