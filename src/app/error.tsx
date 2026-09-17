'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') console.error('[App Error]', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-red-500/10 p-4 rounded-full">
            <AlertTriangle className="text-red-400 w-10 h-10" />
          </div>
        </div>
        <h1 className="text-white text-2xl font-bold mb-2">Something went wrong!</h1>
        <p className="text-slate-400 text-sm mb-8">
          {process.env.NODE_ENV === 'development'
            ? error.message
            : 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 mx-auto bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
