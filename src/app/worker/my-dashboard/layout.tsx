'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function MyDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={false}>
      {children}
    </ProtectedRoute>
  );
}


