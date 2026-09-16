'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface FormErrorAlertProps {
  errors: string[];
  onDismiss?: () => void;
  title?: string;
}

export function FormErrorAlert({
  errors,
  onDismiss,
  title = 'Please correct the following before continuing:',
}: FormErrorAlertProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      role="alert"
      className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-900 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-1 rounded-full bg-red-100 text-red-600 shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-red-800">
              {title}
            </h4>
            <ul className="mt-1.5 space-y-1 text-xs text-red-700 list-disc list-inside">
              {errors.map((error, idx) => (
                <li key={idx} className="leading-snug">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss errors"
            className="p-1 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-100/70 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}


