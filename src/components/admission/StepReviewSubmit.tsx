'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  User,
  GraduationCap,
  FileText,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Edit2,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { StepStudentDetailsData } from './StepStudentDetails';
import { StepFeeDetailsData } from './StepFeeDetails';

export interface StepReviewSubmitData {
  declarationConfirmed: boolean;
}

interface StepReviewSubmitProps {
  studentData: StepStudentDetailsData;
  feeData: StepFeeDetailsData;
  reviewData: StepReviewSubmitData;
  onChange: (updates: Partial<StepReviewSubmitData>) => void;
  onGoToStep: (stepNumber: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorFields: Record<string, string>;
}

export function StepReviewSubmit({
  studentData,
  feeData,
  reviewData,
  onChange,
  onGoToStep,
  onSubmit,
  isSubmitting,
  errorFields,
}: StepReviewSubmitProps) {
  const calculatedNetFee = Math.max(
    0,
    (feeData.totalFee || 0) - (feeData.discount || 0)
  );
  const calculatedBalanceDue = Math.max(
    0,
    calculatedNetFee - (feeData.downPayment || 0)
  );

  return (
    <div className="space-y-6">
      {/* Overview Notice */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <p className="font-bold text-sm text-blue-950 mb-0.5">
            Pre-Submission Review & Document Verification
          </p>
          Please review the student details, academic qualifications, and fee receipts carefully before final submission. Click &quot;Edit&quot; on any section to make corrections.
        </div>
      </div>

      {/* Card 1: Student Personal Details & Photo */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Personal Information
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onGoToStep(1)}
            className="text-xs text-blue-600 hover:text-blue-700 h-8 gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Passport Photo */}
          <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
            {studentData.photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={studentData.photoPreview}
                alt={studentData.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No Photo
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 text-xs">
            <div>
              <span className="text-slate-500 block">Full Name:</span>
              <span className="font-bold text-slate-900 text-sm">
                {studentData.name || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Email Address:</span>
              <span className="font-semibold text-slate-800">
                {studentData.email || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Phone Number:</span>
              <span className="font-semibold text-slate-800">
                {studentData.phone || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Father / Guardian:</span>
              <span className="font-semibold text-slate-800">
                {studentData.guardianName || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Gender / DOB:</span>
              <span className="font-semibold text-slate-800">
                {studentData.gender || '—'}{' '}
                {studentData.dob ? `(${studentData.dob})` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Address:</span>
              <span className="font-semibold text-slate-800">
                {studentData.address || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Academic Qualifications & Course */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Academic Qualifications & Program
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onGoToStep(1)}
            className="text-xs text-blue-600 hover:text-blue-700 h-8 gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Course
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {studentData.course || 'Not Selected'}
            </div>
            <div className="text-slate-500">Session: {studentData.session}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              10th Standard (Secondary)
            </div>
            <div className="font-semibold text-slate-900">
              {studentData.tenthMarks} ({studentData.tenthYear})
            </div>
            <div className="text-slate-500 truncate">
              {studentData.tenthSchool || 'School details recorded'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              12th Standard / Diploma
            </div>
            <div className="font-semibold text-slate-900">
              {studentData.twelfthMarks} ({studentData.twelfthStream || 'General'})
            </div>
            <div className="text-slate-500 truncate">
              {studentData.twelfthSchool || 'School details recorded'}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Uploaded Single PDF Dossier */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Academic Dossier (Single PDF)
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onGoToStep(1)}
            className="text-xs text-blue-600 hover:text-blue-700 h-8 gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>
        </div>

        {studentData.pdfDossier ? (
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-800">
                  {studentData.pdfFileName || studentData.pdfDossier.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  Size: {studentData.pdfFileSize} • Ingestion Ready
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Attached
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>No PDF attached. Single PDF upload is required.</span>
          </div>
        )}
      </div>

      {/* Card 4: Fee & Payment Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Fee & Payment Verification
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onGoToStep(2)}
            className="text-xs text-blue-600 hover:text-blue-700 h-8 gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>
        </div>

        {/* 5-Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] text-slate-500 block">Total Fee</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              ₹{(feeData.totalFee || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] text-slate-500 block">Discount</span>
            <span className="font-bold text-emerald-600 text-sm mt-0.5 block">
              -₹{(feeData.discount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100">
            <span className="text-[11px] text-blue-700 block font-medium">
              Net Fee
            </span>
            <span className="font-bold text-blue-950 text-sm mt-0.5 block">
              ₹{calculatedNetFee.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <span className="text-[11px] text-emerald-700 block font-medium">
              Down Payment
            </span>
            <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
              ₹{(feeData.downPayment || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-amber-800 block font-medium">
              Balance Due
            </span>
            <span className="font-bold text-amber-900 text-sm mt-0.5 block">
              ₹{calculatedBalanceDue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Transaction Evidence Card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Method:</span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800">
                {feeData.paymentMethod}
              </span>
            </div>
            <div>
              <span className="text-slate-500">UTR / Reference: </span>
              <span className="font-mono font-bold text-blue-800">
                {feeData.utr || 'N/A'}
              </span>
            </div>
          </div>

          {feeData.paymentScreenshotPreview && (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={feeData.paymentScreenshotPreview}
                alt="Receipt"
                className="w-10 h-10 rounded-lg object-cover border border-slate-300"
              />
              <span className="text-[11px] text-slate-600 font-medium">
                Receipt Attached
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Verification Declaration Checkbox */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          errorFields.declaration
            ? 'border-red-500 bg-red-50/30'
            : 'border-slate-200/80 bg-white'
        }`}
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={reviewData.declarationConfirmed}
            onChange={(e) => onChange({ declarationConfirmed: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-0.5">
              Official Counselor / Worker Verification Declaration
            </span>
            I hereby confirm and declare that all student details, academic credentials, single PDF dossier, and payment UTR proofs have been physically and digitally verified against official university requirements.
          </div>
        </label>
        {errorFields.declaration && (
          <p className="text-[11px] text-red-600 font-medium mt-2 pl-7">
            {errorFields.declaration}
          </p>
        )}
      </div>

      {/* Step 3 Footer Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onGoToStep(2)}
          className="h-10 px-5 text-slate-700"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Fee Details
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="h-10 px-8 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting Admission...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm & Complete Admission
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


