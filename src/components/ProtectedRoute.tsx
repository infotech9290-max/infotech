'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
        // Not logged in -> Go to login
        router.replace('/login');
      } else if (requireAdmin && role !== 'ADMIN') {
        // Worker trying to access Admin Panel -> Redirect to worker dashboard
        router.replace('/worker/my-dashboard');
      }
    }
  }, [user, role, isLoading, requireAdmin, router]);

  return <>{children}</>;
}


