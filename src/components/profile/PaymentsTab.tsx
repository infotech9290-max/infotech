'use client';

import React, { useState } from 'react';
import { Student, PaymentRecord, formatINR } from '@/types/student';
import {
  Receipt,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Building2,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  ExternalLink,
  DollarSign,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentScreenshotModal } from './PaymentScreenshotModal';

interface PaymentsTabProps {
  student: Student;
  onOpenScreenshot?: (payment: PaymentRecord) => void;
}

export function PaymentsTab({ student, onOpenScreenshot }: PaymentsTabProps) {
  const { payments } = student;
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [activePaymentForModal, setActivePaymentForModal] = useState<PaymentRecord | null>(null);

  const copyUtr = async (utr: string) => {
    try {
      await navigator.clipboard.writeText(utr);
      setCopiedUtr(utr);
      setTimeout(() => setCopiedUtr(null), 2000);
    } catch {
      setCopiedUtr(utr);
      setTimeout(() => setCopiedUtr(null), 2000);
    }
  };

  const handleOpenScreenshot = (payment: PaymentRecord) => {
    setActivePaymentForModal(payment);
    if (onOpenScreenshot) {
      onOpenScreenshot(payment);
    }
  };

  const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const verifiedCount = payments.filter((p) => p.verified).length;

  return (
    <div className="space-y-6">
      {/* Transaction Summary Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Payment Transaction Ledger
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Itemized electronic banking transactions, UTR receipts, and Treasury audit states.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs">
            <span className="text-slate-400">Total: </span>
            <span className="font-bold text-emerald-700">{formatINR(totalPaid)}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            {verifiedCount}/{payments.length} Verified
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {payments.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center bg-slate-50/50 space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <DollarSign className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Transactions Recorded</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No payments have been logged for this student yet. When a payment is made, itemized
              bank vouchers and UTR details will appear here.
            </p>
          </div>
        ) : (
          payments.map((pmt) => {
            const isCopied = copiedUtr === pmt.utr;

            return (
              <div
                key={pmt.id}
                className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Top Row: Amount & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {formatINR(pmt.amount)}
                    </div>
                    {/* Payment Method Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold">
                      {pmt.method === 'UPI QR' && (
                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      {pmt.method === 'UPI' && (
                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      {pmt.method === 'Bank Transfer' && (
                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                      )}
                      {pmt.method === 'Cash' && (
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      {pmt.method === 'Card' && (
                        <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>{pmt.method}</span>
                    </div>
                  </div>

                  {/* Verification Status Badge */}
                  <div>
                    {pmt.verified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Verified Settlement
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Pending Accounts Audit
                      </span>
                    )}
                  </div>
                </div>

                {/* Key-Value Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* UTR Reference with 1-Click Copy */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        UTR / Transaction Reference
                      </span>
                      <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 truncate block mt-0.5">
                        {pmt.utr}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyUtr(pmt.utr)}
                      className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all shrink-0 cursor-pointer shadow-2xs"
                      title="Copy UTR Reference"
                    >
                      {isCopied ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Receiving Bank Account */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-100/80 text-blue-700 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Receiving Bank Account
                      </span>
                      <span className="font-semibold text-slate-800 text-xs truncate block mt-0.5">
                        {pmt.bankDetails}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Timestamp and Screenshot Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {pmt.date}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      Voucher #{pmt.id}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenScreenshot(pmt)}
                    className="h-9 px-3.5 text-xs font-semibold gap-2 border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-900 rounded-xl cursor-pointer w-full sm:w-auto"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    View Payment Screenshot
                    <ExternalLink className="w-3 h-3 text-blue-400 ml-0.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Screenshot Modal Lightbox */}
      <PaymentScreenshotModal
        payment={activePaymentForModal}
        student={student}
        open={Boolean(activePaymentForModal)}
        onOpenChange={(open) => {
          if (!open) setActivePaymentForModal(null);
        }}
      />
    </div>
  );
}


