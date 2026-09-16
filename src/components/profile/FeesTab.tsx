'use client';

import React from 'react';
import { Student, formatINR, normalizeInstallmentStatus } from '@/types/student';
import {
  Coins,
  TrendingDown,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  Check,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeesTabProps {
  student: Student;
}

export function FeesTab({ student }: FeesTabProps) {
  const { fees, installments } = student;

  const recoveryPct =
    fees.netFee > 0
      ? Math.min(100, Math.round((fees.paidAmount / fees.netFee) * 100))
      : 100;

  const remainingPct = 100 - recoveryPct;

  return (
    <div className="space-y-6">
      {/* 5-Metric Financial Summary Card */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Financial Structure & Ledger Overview
          </h3>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            INR (₹) Account
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {/* 1. Total Course Fee (Gross) */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/90 text-center flex flex-col justify-between shadow-xs min-w-0">
            <div className="flex items-center justify-center">
              <span className="p-2 rounded-xl bg-slate-200/80 text-slate-700 mb-2">
                <Coins className="w-5 h-5" />
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block truncate">
                Total Course Fee
              </span>
              <div className="text-base sm:text-lg md:text-xl font-black text-slate-900 mt-1 truncate">
                {formatINR(fees.totalFee)}
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-medium truncate">Gross Tuition</span>
          </div>

          {/* 2. Scholarship / Discount */}
          <div className="p-4 sm:p-5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center flex flex-col justify-between shadow-xs min-w-0">
            <div className="flex items-center justify-center">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 mb-2">
                <TrendingDown className="w-5 h-5" />
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider block truncate">
                Scholarship
              </span>
              <div className="text-base sm:text-lg md:text-xl font-black text-emerald-700 mt-1 truncate">
                -₹{fees.discount.toLocaleString('en-IN')}
              </div>
            </div>
            <span className="text-[11px] text-emerald-600/90 mt-2 font-medium truncate">Concession Granted</span>
          </div>

          {/* 3. Net Fee */}
          <div className="p-4 sm:p-5 bg-blue-50/80 rounded-2xl border border-blue-200 text-center flex flex-col justify-between shadow-xs min-w-0">
            <div className="flex items-center justify-center">
              <span className="p-2 rounded-xl bg-blue-100 text-blue-700 mb-2">
                <Calculator className="w-5 h-5" />
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider block truncate">
                Net Fee
              </span>
              <div className="text-base sm:text-lg md:text-xl font-black text-blue-950 mt-1 truncate">
                {formatINR(fees.netFee)}
              </div>
            </div>
            <span className="text-[11px] text-blue-600 mt-2 font-medium truncate">(Total - Concession)</span>
          </div>

          {/* 4. Paid Amount */}
          <div className="p-4 sm:p-5 bg-emerald-50/90 rounded-2xl border border-emerald-200 text-center flex flex-col justify-between shadow-xs min-w-0">
            <div className="flex items-center justify-center">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider block truncate">
                Paid Amount
              </span>
              <div className="text-base sm:text-lg md:text-xl font-black text-emerald-700 mt-1 truncate">
                {formatINR(fees.paidAmount)}
              </div>
            </div>
            <span className="text-[11px] text-emerald-700 mt-2 font-bold truncate">{recoveryPct}% Collected</span>
          </div>

          {/* 5. Balance Due */}
          <div
            className={cn(
              'p-4 sm:p-5 rounded-2xl text-center flex flex-col justify-between col-span-2 sm:col-span-1 shadow-xs transition-all min-w-0',
              fees.balanceDue > 0
                ? 'bg-amber-50 border-2 border-amber-300 text-amber-950'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            )}
          >
            <div className="flex items-center justify-center">
              <span
                className={cn(
                  'p-2 rounded-xl mb-2',
                  fees.balanceDue > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                )}
              >
                {fees.balanceDue > 0 ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </span>
            </div>
            <div className="min-w-0">
              <span
                className={cn(
                  'text-[11px] sm:text-xs font-bold uppercase tracking-wider block truncate',
                  fees.balanceDue > 0 ? 'text-amber-800' : 'text-emerald-800'
                )}
              >
                Balance Due
              </span>
              <div
                className={cn(
                  'text-base sm:text-lg md:text-xl font-black mt-1 truncate',
                  fees.balanceDue > 0 ? 'text-amber-900' : 'text-emerald-700'
                )}
              >
                {formatINR(fees.balanceDue)}
              </div>
            </div>
            <span
              className={cn(
                'text-[11px] mt-2 font-bold truncate',
                fees.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'
              )}
            >
              {fees.balanceDue > 0 ? 'Scheduled in Stages' : 'Fully Settled'}
            </span>
          </div>
        </div>
      </div>

      {/* Settlement Recovery Progress Bar */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Fee Settlement Recovery Progress
          </span>
          <span className="font-bold text-slate-900">{recoveryPct}% Recovered</span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${recoveryPct}%` }}
            title={`Paid: ${recoveryPct}%`}
          />
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${remainingPct}%` }}
            title={`Remaining: ${remainingPct}%`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span className="flex items-center gap-1.5 font-medium text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Paid: {formatINR(fees.paidAmount)}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Outstanding: {formatINR(fees.balanceDue)}
          </span>
        </div>
      </div>

      {/* Connected Vertical Installment Timeline Schedule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Installment Schedule & Due Dates
            </h4>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {installments.length} {installments.length === 1 ? 'Milestone' : 'Milestones'}
          </span>
        </div>

        {installments.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50 space-y-1">
            <Clock className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No Installments Scheduled</p>
            <p className="text-[11px] text-slate-400">
              No active payment milestones recorded for this application profile.
            </p>
          </div>
        ) : (
          <div className="relative pl-2 sm:pl-4 space-y-4">
            {installments.map((inst, index) => {
              const normStatus = normalizeInstallmentStatus(inst.status);
              const isLast = index === installments.length - 1;

              return (
                <div key={inst.id} className="relative pl-8 sm:pl-10 pb-2">
                  {/* Vertical connecting line */}
                  {!isLast && (
                    <div className="absolute left-[11px] sm:left-[15px] top-6 bottom-[-16px] w-0.5 bg-slate-200" />
                  )}

                  {/* Status Node Icon */}
                  <div className="absolute left-0 sm:left-1 top-2">
                    {normStatus === 'PAID' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-emerald-100 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                    {normStatus === 'PENDING' && (
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-amber-500 text-amber-600 flex items-center justify-center ring-4 ring-amber-50 shadow-xs">
                        <Clock className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    )}
                    {normStatus === 'OVERDUE' && (
                      <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center ring-4 ring-rose-100 shadow-xs animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Milestone Card */}
                  <div
                    className={cn(
                      'p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs',
                      normStatus === 'PAID' && 'bg-white border-slate-200/90',
                      normStatus === 'PENDING' && 'bg-amber-50/40 border-amber-200',
                      normStatus === 'OVERDUE' && 'bg-rose-50/50 border-rose-200'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="font-bold text-slate-900 text-sm">{inst.title}</h5>
                        {normStatus === 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <Check className="w-3 h-3" /> Paid
                          </span>
                        )}
                        {normStatus === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        {normStatus === 'OVERDUE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {normStatus === 'PAID'
                            ? `Settled on ${inst.paidDate || inst.dueDate}`
                            : normStatus === 'OVERDUE'
                            ? `Action Required • Overdue since ${inst.dueDate}`
                            : `Due by ${inst.dueDate}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="font-extrabold text-base sm:text-lg text-slate-900">
                        {formatINR(inst.amount)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {normStatus === 'PAID' ? 'Verified Settlement' : 'Stage Allocation'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


