'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdmissionRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/worker/my-dashboard?view=admission');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
      <p className="text-sm font-semibold text-slate-500">Loading Admission Wizard...</p>
    </div>
  );
}
