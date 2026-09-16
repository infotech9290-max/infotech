'use client';

import React from 'react';
import { Check, User, DollarSign, ShieldCheck } from 'lucide-react';

export interface StepItem {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WIZARD_STEPS: StepItem[] = [
  {
    id: 1,
    title: 'Student Details',
    subtitle: 'Personal, Academic & PDF',
    icon: User,
  },
  {
    id: 2,
    title: 'Fee Details',
    subtitle: 'Tuition, Discount & Payment',
    icon: DollarSign,
  },
  {
    id: 3,
    title: 'Review & Submit',
    subtitle: 'Verification & Finalize',
    icon: ShieldCheck,
  },
];

interface TopProgressBarProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function TopProgressBar({ currentStep, onStepClick }: TopProgressBarProps) {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 mb-6">
      <div className="relative flex items-center justify-between max-w-2xl mx-auto">
        {/* Background connector line */}
        <div
          className="absolute left-8 right-8 top-5 -translate-y-1/2 h-1 bg-slate-200 z-0"
          aria-hidden="true"
        >
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-in-out"
            style={{
              width:
                currentStep === 1
                  ? '0%'
                  : currentStep === 2
                  ? '50%'
                  : '100%',
            }}
          />
        </div>

        {WIZARD_STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isClickable = onStepClick && step.id < currentStep;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center group"
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.id)}
                aria-current={isActive ? 'step' : undefined}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-200 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 cursor-pointer'
                    : isActive
                    ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100 scale-105'
                    : 'bg-slate-100 text-slate-400 border border-slate-300/80'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="sm:hidden">{step.id}</span>
                    <StepIcon className="hidden sm:block w-5 h-5" />
                  </div>
                )}
              </button>

              <div className="mt-2 text-center">
                <span
                  className={`block text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-blue-600'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </span>
                <span className="hidden md:block text-[11px] text-slate-400 mt-0.5">
                  {step.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


