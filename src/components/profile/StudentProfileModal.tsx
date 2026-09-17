'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Student, formatINR } from '@/types/student';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FeesTab } from './FeesTab';
import { DocumentsTab } from './DocumentsTab';
import { PaymentsTab } from './PaymentsTab';
import {
  GraduationCap,
  Mail,
  Phone,
  User,
  CreditCard,
  FileText,
  Receipt,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Printer,
  MessageSquare,
} from 'lucide-react';

interface StudentProfileModalProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated?: (updatedStudent: Student) => void;
}

export function StudentProfileModal({
  student,
  open,
  onOpenChange,
  onStatusUpdated,
}: StudentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'fees' | 'documents' | 'payments'>('fees');
  const { role } = useAuth();
  // Only show Admin Actions if the user is an Admin AND they are currently inside the Admin Panel
  const isAdmin = role === 'ADMIN';
  const [isSaving, setIsSaving] = useState(false);

  const [copiedId, setCopiedId] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  if (!student) return null;

  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(student.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handlePrintReceipt = () => {
    const printWin = window.open('', '_blank', 'width=850,height=950');
    if (!printWin) return;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Institute Admission Slip - ${student.name}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .brand { font-size: 26px; font-weight: 900; letter-spacing: 1.5px; color: #0f172a; }
          .brand span { color: #2563eb; }
          .badge { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; }
          .card-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .card-val { font-size: 15px; font-weight: 700; color: #0f172a; }
          .card-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f1f5f9; padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
          td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .total-row { font-weight: 900; font-size: 15px; background: #f8fafc; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
          .stamp { border: 2px dashed #94a3b8; border-radius: 8px; width: 180px; height: 75px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Admissions <span>Portal</span></div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Official Provisional Admission Confirmation Slip</div>
          </div>
          <div style="text-align: right;">
            <span class="badge">${student.status}</span>
            <div style="font-family: monospace; font-size: 12px; margin-top: 5px; color: #475569;">Ref: #${student.id}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Candidate Particulars</div>
            <div class="card-val">${student.name}</div>
            <div class="card-sub">Phone: ${student.phone} | Email: ${student.email}</div>
            <div class="card-sub">Father's Name: ${student.fatherName || 'N/A'}</div>
          </div>
          <div class="card">
            <div class="card-label">Program & Counselor</div>
            <div class="card-val">${student.course} (${student.academic.graduationSession || '2026-2029'})</div>
            <div class="card-sub">Counselor: ${student.workerName}</div>
            <div class="card-sub">Reg. Date: ${student.registrationDate ? new Date(student.registrationDate).toLocaleDateString('en-GB') : student.date}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fee Breakdown & Ledger</th>
              <th style="text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Course Tuition Fee</td>
              <td style="text-align: right;">₹${student.fees.totalFee.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Institutional Scholarship / Concession</td>
              <td style="text-align: right; color: #16a34a;">- ₹${(student.fees.scholarship ?? student.fees.discount ?? 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="font-weight: bold;">
              <td>Net Applicable Course Fee</td>
              <td style="text-align: right;">₹${student.fees.netFee.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Amount Paid / Settled (${student.payments?.[0]?.paymentMethod || student.payments?.[0]?.method || 'UPI'})</td>
              <td style="text-align: right; font-weight: bold; color: #2563eb;">₹${student.fees.paidAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr class="total-row">
              <td>Balance Due / Outstanding</td>
              <td style="text-align: right; color: ${student.fees.balanceDue > 0 ? '#b45309' : '#16a34a'};">₹${student.fees.balanceDue.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size: 11px; color: #64748b; line-height: 1.6; margin-top: 15px;">
          <strong>Payment Verification:</strong> UTR #${student.payments?.[0]?.utr || 'Verified'} &bull; Payment Method: ${student.payments?.[0]?.paymentMethod || student.payments?.[0]?.method || 'UPI QR'}<br/>
          <em>This is a computer-verified provisional admission voucher issued by the Admissions Management System.</em>
        </div>

        <div class="footer">
          <div>
            <div style="font-size: 12px; color: #334155; font-weight: bold;">Admissions Central Office</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Attributed to Counselor: ${student.workerName}</div>
          </div>
          <div class="stamp">
            Authorized Signatory & Seal
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    printWin.document.write(html);
    printWin.document.close();
  };

  const handleWhatsApp = () => {
    const cleanPhone = (student.phone || '').replace(/[^0-9]/g, '');
    const due = student.fees.balanceDue;
    const msg = due > 0
      ? `Dear ${student.name}, this is a gentle reminder from our Admissions Office regarding your pending admission balance of ₹${due.toLocaleString('en-IN')} for ${student.course}. Please complete the payment or contact your counselor ${student.workerName}.`
      : `Hello ${student.name}! Congratulations on your successful admission (ID: #${student.id}) for ${student.course}. We are delighted to welcome you!`;
    window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ width: 'min(95vw, 1140px)', maxWidth: '1140px' }}
        className="w-[95vw] max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200"
      >
        {/* Hero Header */}
        <DialogHeader className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-6">
            <div className="flex items-center gap-3.5">
              {/* Avatar Photo or Initials */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-lg sm:text-xl flex items-center justify-center border-2 border-white shadow-md shrink-0 overflow-hidden">
                {student.photoUrl && !avatarError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
                    {student.name}
                  </DialogTitle>
                  <StatusBadge status={student.status} />
                </div>

                <DialogDescription className="text-xs font-mono text-slate-500 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    ID: #{student.id}
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                      title="Copy Student ID"
                    >
                      {copiedId ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Registered {student.date}
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Worker Attribution Badge */}
            <div className="self-start sm:self-center">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs shadow-2xs flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Assigned Worker
                  </div>
                  <div className="font-bold text-slate-800 truncate">
                    {student.workerName}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact and Course Banner */}
          <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{student.course}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <a href={`mailto:${student.email}`} className="hover:text-blue-600 hover:underline transition-colors">
                {student.email}
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <a href={`tel:${student.phone}`} className="hover:text-blue-600 hover:underline font-medium transition-colors">
                {student.phone}
              </a>
            </div>
          </div>
        </DialogHeader>

        {/* Admin Status & Quick Payment Action Bar */}
        {isAdmin && (
          <div className="px-4 sm:px-6 py-3 bg-amber-50/90 border-b border-amber-200/80 shrink-0 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider mr-1">Admin Status:</span>
              {(['Action Needed', 'In Process', 'Enrolled', 'Rejected', 'Cancelled'] as const).map((s) => {
                const colors: Record<string, string> = {
                  'Action Needed': 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300',
                  'In Process':    'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200',
                  'Enrolled':      'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200',
                  'Rejected':      'bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200',
                  'Cancelled':     'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
                };
                const isActive = student.status === s;
                return (
                  <button
                    key={s}
                    disabled={isSaving || isActive}
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        const res = await fetch('/api/admin/update-status', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            uniqueId: student.id,
                            status: s,
                            balanceDue: student.fees?.balanceDue,
                          }),
                        });
                        if (!res.ok) throw new Error('Status update failed');
                        if (onStatusUpdated) {
                          onStatusUpdated({ ...student, status: s });
                        }
                        onOpenChange(false);
                      } catch (err) {
                        console.error('Failed to update student status:', err);
                        alert('Failed to update status. Please try again.');
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className={[
                      'px-3 py-1 rounded-full text-xs font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                      isActive ? 'ring-2 ring-offset-1 ring-current opacity-70 cursor-default' : 'cursor-pointer',
                      colors[s],
                    ].join(' ')}
                  >
                    {isActive ? '✓ ' : ''}{s}
                  </button>
                );
              })}
              {isSaving && <span className="text-xs text-amber-700 font-semibold ml-2 animate-pulse">Updating...</span>}
            </div>

            {/* Quick Settle Balance Due Button */}
            {student.fees.balanceDue > 0 && (
              <button
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  if (!confirm(`Collect full balance (₹${student.fees.balanceDue.toLocaleString('en-IN')}) and mark student as Enrolled?`)) return;
                  setIsSaving(true);
                  try {
                    const res = await fetch('/api/admin/update-status', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        uniqueId: student.id,
                        status: 'Enrolled',
                        balanceDue: 0,
                        paidAmount: student.fees.netFee,
                      }),
                    });
                    if (!res.ok) throw new Error('Payment collection failed');
                    if (onStatusUpdated) {
                      onStatusUpdated({
                        ...student,
                        status: 'Enrolled',
                        fees: {
                          ...student.fees,
                          balanceDue: 0,
                          paidAmount: student.fees.netFee,
                        },
                      });
                    }
                    onOpenChange(false);
                  } catch (err) {
                    console.error('Failed to settle balance:', err);
                    alert('Failed to update payment. Please try again.');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                title="Settle full balance and enroll"
              >
                <span>✓ Settle Balance (₹{student.fees.balanceDue.toLocaleString('en-IN')})</span>
              </button>
            )}
          </div>
        )}

        {/* Tabbed Interface Specifically for Fees | Documents | Payments */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'fees' | 'documents' | 'payments')}
          className="flex-1 flex flex-col min-h-0"
        >
          {/* Tabs Navigation Bar */}
          <div className="px-6 py-2.5 bg-white border-b border-slate-200/80 shrink-0">
            <TabsList className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap gap-2 w-full sm:w-auto">
              <TabsTrigger
                value="fees"
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Fees & Financial Ledger</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    student.fees.balanceDue > 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {student.fees.balanceDue > 0
                    ? `${formatINR(student.fees.balanceDue)} Due`
                    : 'Settled'}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="documents"
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Academic Dossier</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                  {student.documents.length} Files
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="payments"
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Transaction Receipts</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                  {student.payments.length} Txn
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Tab Panels */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40">
            <TabsContent value="fees" className="mt-0 focus-visible:outline-none">
              <FeesTab student={student} />
            </TabsContent>

            <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
              <DocumentsTab student={student} />
            </TabsContent>

            <TabsContent value="payments" className="mt-0 focus-visible:outline-none">
              <PaymentsTab student={student} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Dialog Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 hidden sm:flex">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="flex items-center gap-1.5 font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Official Student Profile Dossier
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Send notification / fee reminder via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Student</span>
            </button>

            <button
              type="button"
              onClick={handlePrintReceipt}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-slate-900/20"
              title="Print official admission confirmation & fee slip"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print Official Slip</span>
            </button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs cursor-pointer font-semibold rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Close Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


