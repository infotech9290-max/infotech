'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdmissionLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={false}>
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    </ProtectedRoute>
  );
}


