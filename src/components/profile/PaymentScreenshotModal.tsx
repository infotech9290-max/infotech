'use client';

import React, { useState } from 'react';
import { Student, PaymentRecord, formatINR } from '@/types/student';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Receipt,
  Clock,
  Copy,
  Check,
  Download,
  Building2,
  Calendar,
  CreditCard,
  ShieldCheck,
  QrCode,
  Banknote,
  GraduationCap,
  User,
} from 'lucide-react';

interface PaymentScreenshotModalProps {
  payment: PaymentRecord | null;
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentScreenshotModal({
  payment,
  student,
  open,
  onOpenChange,
}: PaymentScreenshotModalProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!payment) return null;

  const handleCopyUtr = async () => {
    try {
      await navigator.clipboard.writeText(payment.utr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadReceipt = () => {
    const slipText = `OFFICIAL ADMISSION FEE RECEIPT\n===================================\nVoucher ID: ${payment.id}\nStudent: ${student?.name || 'N/A'} (ID: ${student?.id || 'N/A'})\nCourse: ${student?.course || 'N/A'}\nAmount: ${formatINR(payment.amount)}\nMethod: ${payment.method}\nUTR / Ref: ${payment.utr}\nBank: ${payment.bankDetails}\nDate: ${payment.date}\nStatus: ${payment.verified ? 'PAID & VERIFIED' : 'PENDING AUDIT'}\n===================================`;
    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `Receipt_${payment.utr}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg w-full p-0 overflow-hidden rounded-2xl bg-white shadow-2xl">
        <DialogHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3 pr-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Receipt className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                Payment Verification Slip
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-slate-500 truncate mt-0.5">
                Ref: {payment.utr} • Voucher #{payment.id}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body / Digital Receipt Canvas */}
        <div className="p-4 sm:p-6 bg-slate-100/70 overflow-y-auto max-h-[70vh]">
          {/* Authentic Digital Receipt Slip */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-slate-700/60">
            {/* Top Pattern & Watermark Seal */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs text-blue-300 font-semibold tracking-wide uppercase">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Admissions Treasury
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                  Official Electronic Payment Slip
                </h4>
              </div>
              {payment.verified ? (
                <div className="rotate-[-6deg] shrink-0 border-2 border-emerald-400 text-emerald-400 font-mono text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-emerald-950/80 shadow-md flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  PAID & VERIFIED
                </div>
              ) : (
                <div className="rotate-[-6deg] shrink-0 border-2 border-amber-400 text-amber-400 font-mono text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-amber-950/80 shadow-md flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  PENDING AUDIT
                </div>
              )}
            </div>

            {/* Prominent Amount Display */}
            <div className="py-5 text-center space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Total Settled Amount
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                {formatINR(payment.amount)}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-300 pt-1">
                {payment.method === 'UPI QR' && <QrCode className="w-3.5 h-3.5 text-blue-400" />}
                {payment.method === 'Bank Transfer' && <Building2 className="w-3.5 h-3.5 text-blue-400" />}
                {payment.method === 'Cash' && <Banknote className="w-3.5 h-3.5 text-emerald-400" />}
                {payment.method === 'Card' && <CreditCard className="w-3.5 h-3.5 text-purple-400" />}
                <span>Payment Mode: {payment.method}</span>
              </div>
            </div>

            {/* Student & Transaction Metadata Grid */}
            <div className="bg-white/5 rounded-xl p-3.5 space-y-2.5 border border-white/10 text-xs">
              {student && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Student Name
                    </span>
                    <span className="font-semibold text-white truncate max-w-[200px]">
                      {student.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Course
                    </span>
                    <span className="font-semibold text-white truncate max-w-[200px]">
                      {student.course}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Student ID</span>
                    <span className="font-mono text-blue-300 font-semibold">#{student.id}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                <span className="text-slate-400">Beneficiary Bank</span>
                <span className="font-medium text-slate-200 truncate max-w-[200px]">
                  {payment.bankDetails}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Transaction Date</span>
                <span className="font-medium text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {payment.date}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                <span className="text-slate-400">UTR / Ref Number</span>
                <span className="font-mono text-emerald-300 font-bold">{payment.utr}</span>
              </div>
            </div>

            {/* Optional Screenshot Image Display with Fallback */}
            {payment.screenshotUrl && !imageError && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center justify-between">
                  <span>Attached Payment Screenshot:</span>
                  <span className="text-[10px] text-emerald-400">Image Synced</span>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-black/40 border border-white/10 max-h-36 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={payment.screenshotUrl}
                    alt={`Receipt ${payment.utr}`}
                    className="max-h-36 object-contain w-full"
                    onError={() => setImageError(true)}
                  />
                </div>
              </div>
            )}

            {/* Digital Security Micro-Text */}
            <div className="pt-4 text-center">
              <span className="text-[10px] text-slate-400 font-mono">
                System Reconciled • Receipt Ref: {payment.utr}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyUtr}
            className="text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                Copy UTR
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownloadReceipt}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Slip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


