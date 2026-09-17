'use client';

import React, { useRef, useState, useEffect } from 'react';
import { compressImage } from '@/utils/compressImage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  UploadCloud,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Info,
  Lock as LockIcon,
  AlertTriangle,
} from 'lucide-react';

export type PaymentMethodOption = 'UPI QR' | 'Bank Transfer' | 'Cash' | 'UPI';

export interface StepFeeDetailsData {
  totalFee: number;
  discount: number;
  netFee: number;
  downPayment: number;
  balanceDue: number;
  paymentMethod: PaymentMethodOption;
  paymentPlan?: string;
  utr: string;
  paymentScreenshot: File | null;
  paymentScreenshotPreview?: string;
}

interface StepFeeDetailsProps {
  data: StepFeeDetailsData;
  onChange: (updates: Partial<StepFeeDetailsData>) => void;
  onBack: () => void;
  onNext: () => void;
  errorFields: Record<string, string>;
  minDownpayment?: number;
  maxInstallments?: number;
  predefinedInstalls?: number[];
  predefinedMonths?: number[];
}

export function StepFeeDetails({
  data,
  onChange,
  onBack,
  onNext,
  errorFields,
  minDownpayment = 0,
  maxInstallments = 2,
  predefinedInstalls = [],
  predefinedMonths = [],
}: StepFeeDetailsProps) {
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [screenshotUploadError, setScreenshotUploadError] = useState<string | null>(null);
  const [bankSettings, setBankSettings] = useState({
    upiId: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifsc: '',
  });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setBankSettings({
            upiId: json.data.upi_id || '',
            bankName: json.data.bank_name || '',
            accountName: json.data.account_name || '',
            accountNumber: json.data.bank_account || '',
            ifsc: json.data.bank_ifsc || '',
          });
        }
      })
      .catch((err) => console.warn('Could not load dynamic settings:', err));
  }, []);

  // Auto-calculated fields
  const calculatedNetFee = Math.max(0, (data.totalFee || 0) - (data.discount || 0));
  const calculatedBalanceDue = Math.max(0, calculatedNetFee - (data.downPayment || 0));

  const handleTotalFeeChange = (val: number) => {
    const newTotal = isNaN(val) ? 0 : val;
    const net = Math.max(0, newTotal - (data.discount || 0));
    const bal = Math.max(0, net - (data.downPayment || 0));
    onChange({
      totalFee: newTotal,
      netFee: net,
      balanceDue: bal,
    });
  };

  const handleDiscountChange = (val: number) => {
    // We allow typing, but we show error if it exceeds max discount
    const newDiscount = isNaN(val) ? 0 : val;
    const net = Math.max(0, (data.totalFee || 0) - newDiscount);
    const bal = Math.max(0, net - (data.downPayment || 0));
    onChange({
      discount: newDiscount,
      netFee: net,
      balanceDue: bal,
    });
  };

  const handleDownPaymentChange = (val: number) => {
    const newDown = isNaN(val) ? 0 : val;
    const net = Math.max(0, (data.totalFee || 0) - (data.discount || 0));
    const bal = Math.max(0, net - newDown);
    onChange({
      downPayment: newDown,
      netFee: net,
      balanceDue: bal,
    });
  };

  const [isCompressingScreenshot, setIsCompressingScreenshot] = useState(false);
  const [screenshotCompressedSize, setScreenshotCompressedSize] = useState<string | null>(null);

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setScreenshotUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size === 0) {
        setScreenshotUploadError('Selected receipt screenshot is empty (0 bytes).');
        if (screenshotInputRef.current) screenshotInputRef.current.value = '';
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // Increase base limit since we auto-compress anyway
        setScreenshotUploadError('Receipt screenshot exceeds 10 MB limit. Please select a smaller image.');
        if (screenshotInputRef.current) screenshotInputRef.current.value = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const hasAllowedExt = /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!allowedTypes.includes(file.type) || !hasAllowedExt) {
        setScreenshotUploadError('Invalid file type: Only JPG, PNG, and WebP images are permitted (SVG and non-image files are blocked).');
        if (screenshotInputRef.current) screenshotInputRef.current.value = '';
        return;
      }

      setIsCompressingScreenshot(true);
      try {
        const compressed = await compressImage(file);
        
        if (data.paymentScreenshotPreview && data.paymentScreenshotPreview.startsWith('blob:')) {
          URL.revokeObjectURL(data.paymentScreenshotPreview);
        }

        const previewUrl = URL.createObjectURL(compressed);
        const sizeKB = (compressed.size / 1024).toFixed(1);
        setScreenshotCompressedSize(`${sizeKB} KB`);
        
        onChange({
          paymentScreenshot: compressed,
          paymentScreenshotPreview: previewUrl,
        });
      } catch (err) {
        console.warn('Screenshot compression fallback:', err);
        if (data.paymentScreenshotPreview && data.paymentScreenshotPreview.startsWith('blob:')) {
          URL.revokeObjectURL(data.paymentScreenshotPreview);
        }
        const previewUrl = URL.createObjectURL(file);
        setScreenshotCompressedSize(`${(file.size / 1024).toFixed(1)} KB (original)`);
        onChange({
          paymentScreenshot: file,
          paymentScreenshotPreview: previewUrl,
        });
      } finally {
        setIsCompressingScreenshot(false);
      }
    }
  };

  const handleRemoveScreenshot = () => {
    if (data.paymentScreenshotPreview && data.paymentScreenshotPreview.startsWith('blob:')) {
      URL.revokeObjectURL(data.paymentScreenshotPreview);
    }
    onChange({
      paymentScreenshot: null,
      paymentScreenshotPreview: undefined,
    });
    setScreenshotUploadError(null);
    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
  };

  const isOnlinePayment =
    data.paymentMethod === 'UPI QR' ||
    data.paymentMethod === 'Bank Transfer' ||
    data.paymentMethod === 'UPI';

  return (
    <div className="space-y-8">
      {/* 1. Fee Calculation & Summary Cards */}
      <section className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Fee Structure & Net Payable
              </h3>
              <p className="text-xs text-slate-500">
                Configure total tuition, applied concessions, and down payment.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            Real-time Calculation
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Course Fee */}
          <div className="space-y-1.5">
            <Label htmlFor="totalFee" className="text-xs font-semibold text-slate-700">
              Total Course Fee (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="totalFee"
                type="number"
                min="0"
                step="1000"
              placeholder="120000"
              value={data.totalFee || ''}
              onChange={(e) => handleTotalFeeChange(parseFloat(e.target.value))}
              className={`h-9 text-sm font-semibold text-slate-900 ${
                  errorFields.totalFee ? 'border-red-500' : 'bg-white'
                }`}
              />
            </div>
            {errorFields.totalFee && (
              <p className="text-[11px] text-red-600 font-medium">
                {errorFields.totalFee}
              </p>
            )}
          </div>

          {/* Discount / Scholarship */}
          <div className="space-y-1.5">
            <Label htmlFor="discount" className="text-xs font-semibold text-slate-700">
              Scholarship / Concession (₹)
            </Label>
            <Input id="discount" type="number" min="0" step="500" placeholder="0" value={data.discount || ""} onChange={(e) => handleDiscountChange(parseFloat(e.target.value))} className={`h-9 text-sm text-emerald-700 font-medium ${errorFields.discount ? "border-red-500" : ""}`} />
            {errorFields.discount ? (
              <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" /> {errorFields.discount}
              </p>
            ) : data.discount > 10000 ? (
              <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" /> Worker limit is ₹10,000 (Admin approval required)
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">
                Merit or quota concession
              </p>
            )}
          </div>

          {/* Down Payment / Paid Today */}
          <div className="space-y-1.5">
            <Label
              htmlFor="downPayment"
              className="text-xs font-semibold text-slate-700"
            >
              Down Payment / Paid Now (₹) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="downPayment"
              type="number"
              min="0"
              step="1000"
              placeholder="30000"
              value={data.downPayment || ''}
              onChange={(e) => handleDownPaymentChange(parseFloat(e.target.value))}
              className={`h-9 text-sm font-semibold ${
                errorFields.downPayment ? 'border-red-500' : ''
              }`}
            />
            {errorFields.downPayment ? (
              <p className="text-[11px] text-red-600 font-medium">
                {errorFields.downPayment}
              </p>
            ) : minDownpayment > 0 ? (
              <p className="text-[10px] text-slate-400 mt-1">
                Min required: ₹{minDownpayment.toLocaleString('en-IN')}
              </p>
            ) : null}
          </div>
        </div>

        {/* Real-time Calculated Financial Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Total Fee Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Gross Fee
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              ₹{(data.totalFee || 0).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Net Fee Card */}
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-center">
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              Net Payable
            </div>
            <div className="text-base sm:text-lg font-bold text-blue-950 mt-1">
              ₹{calculatedNetFee.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-blue-600 mt-0.5">
              (Total - Discount)
            </div>
          </div>

          {/* Down Payment Card */}
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-center">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Paid at Admission
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-700 mt-1">
              ₹{(data.downPayment || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              {calculatedNetFee > 0
                ? `${Math.round(
                    ((data.downPayment || 0) / calculatedNetFee) * 100
                  )}% of net fee`
                : '100%'}
            </div>
          </div>

          {/* Balance Due Card */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-center">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Balance Due
            </div>
            <div className="text-base sm:text-lg font-bold text-amber-900 mt-1">
              ₹{calculatedBalanceDue.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">
              To be scheduled
            </div>
          </div>
        </div>

        {/* Installment Plan Selection */}
        {calculatedBalanceDue > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="text-xs text-slate-700">
                Remaining balance of{' '}
                <strong className="font-semibold text-slate-900">
                  ₹{calculatedBalanceDue.toLocaleString('en-IN')}
                </strong>{' '}
                will be scheduled into installments.
              </div>
            </div>
            <select
              value={data.paymentPlan || '1 Installment'}
              onChange={(e) => onChange({ paymentPlan: e.target.value })}
              className="h-8 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-800 shrink-0"
            >
              {Array.from({ length: maxInstallments }).map((_, i) => (
                <option key={i + 1} value={`${i + 1} Installment${i + 1 > 1 ? 's' : ''}`}>
                  {i + 1} Installment{i + 1 > 1 ? 's' : ''} {i === 0 ? '(30d)' : i === 1 ? '(60d, 120d)' : i === 2 ? '(45d, 90d, 135d)' : '(Quarterly)'}
                </option>
              ))}
            </select>
            
          </div>
        )}

        {calculatedBalanceDue > 0 && data.paymentPlan && data.paymentPlan.includes('Installment') && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white">
            <h4 className="text-xs font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">
              EMI / Installment Schedule Planner
            </h4>
            <div className="space-y-2">
              {(() => {
                const numInstalls = Math.min(parseInt(data.paymentPlan.charAt(0)) || 1, maxInstallments);
                let runningTotal = 0;
                
                return [...Array(numInstalls)].map((_, i) => {
                  let emiAmount = 0;
                  if (i === numInstalls - 1) {
                    // Last installment takes whatever is left
                    emiAmount = Math.max(0, calculatedBalanceDue - runningTotal);
                  } else {
                    // Use predefined if available and valid, otherwise equal split
                    emiAmount = predefinedInstalls[i] > 0 
                      ? predefinedInstalls[i] 
                      : Math.round(calculatedBalanceDue / numInstalls);
                    runningTotal += emiAmount;
                  }

                  const date = new Date();
                  const monthGap = predefinedMonths[i] > 0 ? predefinedMonths[i] : (i + 1);
                  date.setDate(date.getDate() + (monthGap * 30));
                  
                  return (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="font-semibold text-slate-700">Installment {i + 1}</div>
                      <div className="text-slate-500">Due: {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="font-bold text-blue-700">₹{emiAmount.toLocaleString('en-IN')}</div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

      </section>

      {/* 2. Payment Method & Dynamic Receptor */}
      <section className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Payment Method & Official Receptor
            </h3>
            <p className="text-xs text-slate-500">
              Select student payment channel and verify merchant details.
            </p>
          </div>
        </div>

        {/* Payment Method Selector Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* UPI QR Option */}
          <button
            type="button"
            onClick={() => onChange({ paymentMethod: 'UPI QR' })}
            className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
              data.paymentMethod === 'UPI QR'
                ? 'border-blue-600 bg-blue-50/50 text-blue-950 shadow-xs ring-2 ring-blue-100'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                data.paymentMethod === 'UPI QR'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold">UPI QR Code</div>
              <div className="text-[11px] text-slate-500">
                GPay, PhonePe, Paytm
              </div>
            </div>
          </button>

          {/* Bank Transfer Option */}
          <button
            type="button"
            onClick={() => onChange({ paymentMethod: 'Bank Transfer' })}
            className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
              data.paymentMethod === 'Bank Transfer'
                ? 'border-blue-600 bg-blue-50/50 text-blue-950 shadow-xs ring-2 ring-blue-100'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                data.paymentMethod === 'Bank Transfer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold">Bank Transfer</div>
              <div className="text-[11px] text-slate-500">
                NEFT / RTGS / IMPS
              </div>
            </div>
          </button>

          {/* Cash Option */}
          <button
            type="button"
            onClick={() => onChange({ paymentMethod: 'Cash' })}
            className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
              data.paymentMethod === 'Cash'
                ? 'border-blue-600 bg-blue-50/50 text-blue-950 shadow-xs ring-2 ring-blue-100'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                data.paymentMethod === 'Cash'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold">Cash Counter</div>
              <div className="text-[11px] text-slate-500">
                Physical Cash Desk
              </div>
            </div>
          </button>
        </div>

        {/* Dynamic Receptor Details View */}
        {data.paymentMethod === 'UPI QR' && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col sm:flex-row items-center gap-5">
            {/* Visual QR Code Display */}
            <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center shrink-0">
              <div className="w-full h-full border border-slate-100 rounded-lg flex flex-col items-center justify-center bg-white overflow-hidden relative">
                {bankSettings.upiId ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      `upi://pay?pa=${bankSettings.upiId}&pn=${bankSettings.accountName || ''}`
                    )}`}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <>
                    <QrCode className="w-10 h-10 text-slate-300 mb-1" />
                    <span className="text-[10px] text-slate-400">Loading...</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Official Verified QR
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Scan Official Admission UPI QR
              </h4>
              <p className="text-xs text-slate-600">
                UPI ID:{' '}
                <code className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-blue-700">
                  {bankSettings.upiId}
                </code>
              </p>
              <p className="text-[11px] text-slate-500">
                Please instruct student to enter their full name in transaction remarks, then provide the 12-digit UTR reference below.
              </p>
            </div>
          </div>
        )}

        {data.paymentMethod === 'Bank Transfer' && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Official Bank Coordinates
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Bank Name:</span>
                <span className="font-bold text-slate-800 text-sm">{bankSettings.bankName}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Beneficiary Name:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {bankSettings.accountName}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Account Number:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {bankSettings.accountNumber}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block">IFSC Code:</span>
                <span className="font-mono font-bold text-blue-700 text-sm">
                  {bankSettings.ifsc}
                </span>
              </div>
            </div>
          </div>
        )}

        {data.paymentMethod === 'Cash' && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-xs text-amber-900 space-y-1.5">
            <p className="font-bold">Physical Cash Receipt Protocol</p>
            <p className="text-slate-600">
              Collect the cash at the front admissions counter and hand over manual voucher receipt. UTR may be left as &quot;CASH-OFFICE&quot; or manual serial number.
            </p>
          </div>
        )}
      </section>

      {/* 3. Transaction Proof & UTR Verification */}
      <section className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Payment Proof & Verification
            </h3>
            <p className="text-xs text-slate-500">
              Record the bank transaction reference and receipt screenshot.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* UTR Reference Input */}
          <div className="space-y-1.5">
            <Label htmlFor="utr" className="text-xs font-semibold text-slate-700">
              Payment UTR / Transaction Reference Number{' '}
              {isOnlinePayment && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="utr"
              placeholder={
                data.paymentMethod === 'Cash'
                  ? 'e.g. CASH-RCP-1049'
                  : 'e.g. 312345678901 or UPI-938201'
              }
              value={data.utr}
              onChange={(e) => onChange({ utr: e.target.value })}
              className={`h-9 font-mono text-sm ${
                errorFields.utr ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
            />
            {errorFields.utr ? (
              <p className="text-[11px] text-red-600 font-medium">
                {errorFields.utr}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                12-digit UPI / IMPS UTR number or bank transaction reference ID
              </p>
            )}
          </div>

          {/* Screenshot Upload with Preview */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Payment Screenshot / Receipt{' '}
              {isOnlinePayment && <span className="text-red-500">*</span>}
            </Label>

            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/*"
              onChange={handleScreenshotChange}
              className="hidden"
              id="screenshot-upload"
            />

            {data.paymentScreenshotPreview ? (
              <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.paymentScreenshotPreview}
                    alt="Receipt Preview"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {data.paymentScreenshot?.name || 'Receipt_Screenshot.png'}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      {screenshotCompressedSize ? `Auto-compressed: ${screenshotCompressedSize}` : 'Receipt uploaded'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => screenshotInputRef.current?.click()}
                    disabled={isCompressingScreenshot}
                    className="text-xs h-7 px-2"
                  >
                    {isCompressingScreenshot ? '...' : 'Change'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveScreenshot}
                    className="text-xs h-7 px-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isCompressingScreenshot && screenshotInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                  errorFields.paymentScreenshot
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                <UploadCloud className={`w-6 h-6 text-slate-400 mx-auto mb-1 ${isCompressingScreenshot ? 'animate-bounce text-blue-500' : ''}`} />
                <span className="text-xs font-semibold text-slate-700 block">
                  {isCompressingScreenshot ? 'Compressing Screenshot...' : 'Upload Payment Screenshot'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Screenshot of UPI confirmation or bank deposit slip (PNG/JPG)
                </span>
              </div>
            )}

            {screenshotUploadError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mt-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                <span>{screenshotUploadError}</span>
              </div>
            )}

            {errorFields.paymentScreenshot && (
              <p className="text-[11px] text-red-600 font-medium mt-1">
                {errorFields.paymentScreenshot}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Step 2 Footer Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-10 px-5 text-slate-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Student Details
        </Button>

        <Button
          type="button"
          onClick={onNext}
          className="h-10 px-6 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
        >
          Next: Review & Submit
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}


