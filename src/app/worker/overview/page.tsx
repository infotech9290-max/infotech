'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkerOverviewPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/worker/my-dashboard');
  }, [router]);
  return null;
}
