'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  User,
  GraduationCap,
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Camera,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { compressImage } from '@/utils/compressImage';

// COURSES array removed completely

export interface StepStudentDetailsData {
  name: string;
  email: string;
  phone: string;
  guardianName: string;
  dob?: string;
  gender?: string;
  address?: string;

  tenthSchool?: string;
  tenthBoard?: string;
  tenthYear: string;
  tenthMarks: string;
  twelfthSchool?: string;
  twelfthBoard?: string;
  twelfthStream?: string;
  twelfthYear?: string;
  twelfthMarks: string;

  course: string;
  session: string;
  batch?: string;

  photo: File | null;
  photoPreview?: string;
  pdfDossier: File | null;
  pdfFileName?: string;
  pdfFileSize?: string;
  tenthMarksheet: File | null;
  tenthMarksheetPreview?: string;
  twelfthMarksheet: File | null;
  twelfthMarksheetPreview?: string;

  totalFee?: number;
  minDownpayment?: number;
  maxInstallments?: number;
  inst1?: number;
  inst2?: number;
  inst3?: number;
  inst4?: number;
  inst1Months?: number;
  inst2Months?: number;
  inst3Months?: number;
  inst4Months?: number;
}

interface StepStudentDetailsProps {
  data: StepStudentDetailsData;
  onChange: (updates: Partial<StepStudentDetailsData>) => void;
  onNext: () => void;
  errorFields: Record<string, string>;
}

export function StepStudentDetails({
  data,
  onChange,
  onNext,
  errorFields,
}: StepStudentDetailsProps) {
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [photoCompressedSize, setPhotoCompressedSize] = useState<string | null>(
    null
  );
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);

  const [coursesList, setCoursesList] = useState<any[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        const parsed = json.data?.courses;
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          const enhanced = parsed.map((c: any) => ({
             name: c.name,
             code: c.name?.split(' ')[0] || c.name,
             defaultFee: parseFloat(c.fee) || 120000,
             minDownpayment: parseFloat(c.minDownpayment) || 0,
             defaultSession: c.name?.toLowerCase().includes('master') || c.name?.toLowerCase().includes('mba') || c.name?.toLowerCase().includes('mca') ? '2026-2028' : '2026-2029',
             maxInstallments: parseInt(c.maxInstallments) || 2,
             inst1: parseFloat(c.inst1) || 0,
             inst2: parseFloat(c.inst2) || 0,
             inst3: parseFloat(c.inst3) || 0,
             inst4: parseFloat(c.inst4) || 0,
             inst1Months: parseInt(c.inst1Months) || 1,
             inst2Months: parseInt(c.inst2Months) || 2,
             inst3Months: parseInt(c.inst3Months) || 3,
             inst4Months: parseInt(c.inst4Months) || 4,
          }));
          setCoursesList(enhanced);
        }
      } catch (e) {
        console.warn('Could not load custom courses', e);
      }
    };
    fetchCourses();
  }, []);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Photo Upload Handler with Compression & Strict File Validation
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoUploadError(null);
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // Security Check 1: Non-zero size
    if (file.size === 0) {
      setPhotoUploadError('Selected image file is empty (0 bytes).');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    // Security Check 2: Max 10 MB pre-compression size limit
    if (file.size > 10 * 1024 * 1024) {
      setPhotoUploadError('Photo file size exceeds 10 MB limit. Please select a smaller photo.');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    // Security Check 3: Strict MIME type & Extension check (Disallow SVG, scripts, executables)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const hasAllowedExt = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) || !hasAllowedExt) {
      setPhotoUploadError('Invalid image format: Only JPG, PNG, and WebP images are allowed (SVG and other file types are blocked for security).');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    setIsCompressingPhoto(true);
    try {
      const compressed = await compressImage(file);
      if (data.photoPreview && data.photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(data.photoPreview);
      }
      const previewUrl = URL.createObjectURL(compressed);
      const sizeKB = (compressed.size / 1024).toFixed(1);
      setPhotoCompressedSize(`${sizeKB} KB`);
      onChange({
        photo: compressed,
        photoPreview: previewUrl,
      });
    } catch (err) {
      console.warn('Image compression fallback:', err);
      if (data.photoPreview && data.photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(data.photoPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      onChange({
        photo: file,
        photoPreview: previewUrl,
      });
      setPhotoCompressedSize(`${(file.size / 1024).toFixed(1)} KB (original)`);
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    if (data.photoPreview && data.photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(data.photoPreview);
    }
    onChange({
      photo: null,
      photoPreview: undefined,
    });
    setPhotoCompressedSize(null);
    setPhotoUploadError(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const tenthInputRef = useRef<HTMLInputElement>(null);
  const handleTenthSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    try {
      const compressed = await compressImage(file);
      onChange({
        tenthMarksheet: compressed,
        tenthMarksheetPreview: URL.createObjectURL(compressed),
      });
    } catch {
      onChange({ tenthMarksheet: file, tenthMarksheetPreview: URL.createObjectURL(file) });
    }
  };

  const twelfthInputRef = useRef<HTMLInputElement>(null);
  const handleTwelfthSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    try {
      const compressed = await compressImage(file);
      onChange({
        twelfthMarksheet: compressed,
        twelfthMarksheetPreview: URL.createObjectURL(compressed),
      });
    } catch {
      onChange({ twelfthMarksheet: file, twelfthMarksheetPreview: URL.createObjectURL(file) });
    }
  };

  // Single PDF Upload Handler with Strict File Validation
  const handleProcessPdf = (file: File) => {
    setPdfUploadError(null);

    // Security Check 1: Non-zero size
    if (file.size === 0) {
      setPdfUploadError('The selected PDF file is empty (0 bytes).');
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      return;
    }

    // Security Check 2: Require both .pdf extension and valid application/pdf MIME type
    const hasPdfExt = file.name.toLowerCase().endsWith('.pdf');
    const hasPdfMime = !file.type || file.type === 'application/pdf';
    if (!hasPdfExt || !hasPdfMime) {
      setPdfUploadError('Invalid format: Only official PDF documents (.pdf) are accepted.');
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      return;
    }

    // Security Check 3: Max 5 MB size limit
    if (file.size > 5 * 1024 * 1024) {
      setPdfUploadError('File size exceeds 5 MB limit. Please optimize the PDF.');
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      return;
    }

    const sanitizedFileName = file.name.replace(/[^\w\s.-]/gi, '_');

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

    onChange({
      pdfDossier: file,
      pdfFileName: sanitizedFileName,
      pdfFileSize: formattedSize,
    });
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessPdf(e.target.files[0]);
    }
  };

  const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPdf(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessPdf(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePdf = () => {
    onChange({
      pdfDossier: null,
      pdfFileName: undefined,
      pdfFileSize: undefined,
    });
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  // Course selection auto-fills default fee if totalFee is not already customized
  const handleCourseChange = (selectedCode: string) => {
    const courseObj = coursesList.find((c) => c.code === selectedCode);
    if (courseObj) {
      onChange({
        course: courseObj.code,
        session: courseObj.defaultSession,
        totalFee: courseObj.defaultFee,
        minDownpayment: (courseObj as any).minDownpayment || 0,
        maxInstallments: (courseObj as any).maxInstallments || 2,
        inst1: (courseObj as any).inst1 || 0,
        inst2: (courseObj as any).inst2 || 0,
        inst3: (courseObj as any).inst3 || 0,
        inst4: (courseObj as any).inst4 || 0,
        inst1Months: (courseObj as any).inst1Months || 1,
        inst2Months: (courseObj as any).inst2Months || 2,
        inst3Months: (courseObj as any).inst3Months || 3,
        inst4Months: (courseObj as any).inst4Months || 4,
      });
    } else {
      onChange({ course: selectedCode });
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Personal Details Section */}
      <section className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Personal Information
            </h3>
            <p className="text-xs text-slate-500">
              Enter official identification and contact details.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Rahul Sharma"
              value={data.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className={`h-9 text-sm ${
                errorFields.name
                  ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/20'
                  : ''
              }`}
            />
            {errorFields.name && (
              <p className="text-[11px] text-red-600 font-medium">
                {errorFields.name}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className={`h-9 text-sm ${
                errorFields.email
                  ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/20'
                  : ''
              }`}
            />
            {errorFields.email && (
              <p className="text-[11px] text-red-600 font-medium">
                {errorFields.email}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
              Phone / WhatsApp Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="+91 98765 43210"
              value={data.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              className={`h-9 text-sm ${
                errorFields.phone
                  ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/20'
                  : ''
              }`}
            />
            {errorFields.phone && (
              <p className="text-[11px] text-red-600 font-medium">
                {errorFields.phone}
              </p>
            )}
          </div>

          {/* Guardian Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="guardianName"
              className="text-xs font-semibold text-slate-700"
            >
              Father / Guardian Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="guardianName"
              placeholder="e.g. Rameshwar Sharma"
              value={data.guardianName}
              onChange={(e) => onChange({ guardianName: e.target.value })}
              className={`h-9 text-sm ${
                errorFields.guardianName
                  ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/20'
                  : ''
              }`}
            />
            {errorFields.guardianName && (
              <p className="text-[11px] text-red-600 font-medium">
                {errorFields.guardianName}
              </p>
            )}
          </div>

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs font-semibold text-slate-700">
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={data.dob || ''}
                onChange={(e) => onChange({ dob: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="gender"
                className="text-xs font-semibold text-slate-700"
              >
                Gender
              </Label>
              <select
                id="gender"
                value={data.gender || ''}
                onChange={(e) => onChange({ gender: e.target.value })}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Residential Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
              Current Address
            </Label>
            <Input
              id="address"
              placeholder="City, State, Pincode"
              value={data.address || ''}
              onChange={(e) => onChange({ address: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Passport Photo Upload with Compression */}
        <div className="pt-3 border-t border-slate-100">
          <Label className="text-xs font-semibold text-slate-700 block mb-2">
            Student Passport Photo <span className="text-red-500">*</span>
          </Label>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {data.photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.photoPreview}
                  alt="Student Passport Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-slate-300" />
              )}
              
            </div>

            <div className="space-y-2 flex-1">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                id="photo-upload"
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isCompressingPhoto}
                  className="text-xs h-8"
                >
                  <Camera className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  {isCompressingPhoto ? 'Compressing...' : data.photo ? 'Change Photo' : 'Upload Student Photo'}
                </Button>

                {data.photo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>

              {photoCompressedSize && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Auto-compressed: {photoCompressedSize}
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Supports JPG, PNG. Automatic client-side compression reduces file size.
              </p>

              {photoUploadError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                  <span>{photoUploadError}</span>
                </div>
              )}

              {errorFields.photo && (
                <p className="text-[11px] text-red-600 font-medium">
                  {errorFields.photo}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Academic Qualifications Section */}
      <section className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Academic Qualifications
            </h3>
            <p className="text-xs text-slate-500">
              Enter secondary (10th) and senior secondary (12th) records.
            </p>
          </div>
        </div>

        {/* 10th Standard */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            10th Standard (Secondary)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600">
                School / Board Name
              </Label>
              <Input
                placeholder="e.g. St. Xavier's (CBSE)"
                value={data.tenthSchool || ''}
                onChange={(e) => onChange({ tenthSchool: e.target.value })}
                className="h-8 text-xs bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600">
                Passing Year <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. 2020"
                value={data.tenthYear}
                onChange={(e) => onChange({ tenthYear: e.target.value })}
                className={`h-8 text-xs bg-white ${
                  errorFields.tenthYear ? 'border-red-500' : ''
                }`}
              />
              {errorFields.tenthYear && (
                <p className="text-[10px] text-red-600">
                  {errorFields.tenthYear}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600">
                Marks / Percentage (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. 86.4%"
                value={data.tenthMarks}
                onChange={(e) => onChange({ tenthMarks: e.target.value })}
                className={`h-8 text-xs bg-white ${
                  errorFields.tenthMarks ? 'border-red-500' : ''
                }`}
              />
              {errorFields.tenthMarks && (
                <p className="text-[10px] text-red-600">
                  {errorFields.tenthMarks}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600 block">
                10th Marksheet Image
              </Label>
              <input ref={tenthInputRef} type="file" accept="image/*" onChange={handleTenthSelect} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => tenthInputRef.current?.click()} className="h-8 text-xs w-full text-blue-600">
                {data.tenthMarksheet ? 'Change Image' : 'Upload Marksheet'}
              </Button>
              {data.tenthMarksheetPreview && (
                <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Attached</p>
              )}
            </div>
          </div>
        </div>

        {/* 12th Standard */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            12th Standard / Senior Secondary / Diploma
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600">
                College / Institution Name
              </Label>
              <Input
                placeholder="e.g. Govt. Senior Secondary School"
                value={data.twelfthSchool || ''}
                onChange={(e) => onChange({ twelfthSchool: e.target.value })}
                className="h-8 text-xs bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600">
                Stream / Branch
              </Label>
              <select
                value={data.twelfthStream || ''}
                onChange={(e) => onChange({ twelfthStream: e.target.value })}
                className="w-full h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              >
                <option value="">Select Stream</option>
                <option value="Science (PCM)">Science (PCM)</option>
                <option value="Science (PCB)">Science (PCB)</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts / Humanities">Arts / Humanities</option>
                <option value="Vocational / Diploma">Vocational / Diploma</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600">
                Passing Year <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. 2022"
                value={data.twelfthYear || ''}
                onChange={(e) => onChange({ twelfthYear: e.target.value })}
                className={`h-8 text-xs bg-white ${
                  errorFields.twelfthYear ? 'border-red-500' : ''
                }`}
              />
              {errorFields.twelfthYear && (
                <p className="text-[10px] text-red-600">
                  {errorFields.twelfthYear}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600">
                Marks / Percentage (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. 78.5%"
                value={data.twelfthMarks}
                onChange={(e) => onChange({ twelfthMarks: e.target.value })}
                className={`h-8 text-xs bg-white ${
                  errorFields.twelfthMarks ? 'border-red-500' : ''
                }`}
              />
              {errorFields.twelfthMarks && (
                <p className="text-[10px] text-red-600">
                  {errorFields.twelfthMarks}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-600 block">
                12th Marksheet Image
              </Label>
              <input ref={twelfthInputRef} type="file" accept="image/*" onChange={handleTwelfthSelect} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => twelfthInputRef.current?.click()} className="h-8 text-xs w-full text-blue-600">
                {data.twelfthMarksheet ? 'Change Image' : 'Upload Marksheet'}
              </Button>
              {data.twelfthMarksheetPreview && (
                <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Attached</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Course Selection Section */}
      <section className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Course & Academic Session
            </h3>
            <p className="text-xs text-slate-500">
              Select program of study and academic batch.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Target Course Dropdown */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="course" className="text-xs font-semibold text-slate-700">
              Target Course <span className="text-red-500">*</span>
            </Label>
            <select
              id="course"
              value={data.course}
              onChange={(e) => handleCourseChange(e.target.value)}
              className={`w-full h-9 rounded-md border bg-white px-3 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                errorFields.course
                  ? 'border-red-500 focus:ring-red-500 bg-red-50/20'
                  : 'border-slate-200'
              }`}
            >
              <option value="">-- Select Course --</option>
              {coursesList.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            {errorFields.course && (
              <p className="text-[11px] text-red-600 font-medium">
                {errorFields.course}
              </p>
            )}
          </div>

          {/* Academic Session */}
          <div className="space-y-1.5">
            <Label htmlFor="session" className="text-xs font-semibold text-slate-700">
              Academic Session <span className="text-red-500">*</span>
            </Label>
            <Input id="session" placeholder="e.g. 2026-2029" value={data.session} onChange={(e) => onChange({ session: e.target.value })} className={`h-9 text-sm ${errorFields.session ? "border-red-500" : ""}`} />
          </div>
        </div>
      </section>

      {/* 4. Single PDF Dossier Upload Section */}
      <section className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Consolidated Student Academic Dossier (Single PDF)
              </h3>
              <p className="text-xs text-slate-500">
                Upload a single PDF containing 10th, 12th marksheet & Govt ID.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-red-500">
            Required *
          </span>
        </div>

        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handlePdfChange}
          className="hidden"
          id="pdf-upload"
        />

        {data.pdfDossier ? (
          /* Selected PDF File Card */
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {data.pdfFileName || data.pdfDossier.name}
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    PDF Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Size: {data.pdfFileSize} • Type: application/pdf
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => pdfInputRef.current?.click()}
                className="text-xs h-8"
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemovePdf}
                className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* PDF Drag and Drop Area */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingPdf(true);
            }}
            onDragLeave={() => setIsDraggingPdf(false)}
            onDrop={handlePdfDrop}
            onClick={() => pdfInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDraggingPdf
                ? 'border-blue-500 bg-blue-50/50'
                : errorFields.pdfDossier
                ? 'border-red-400 bg-red-50/20'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Click to select or drag and drop single PDF dossier
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Combines 10th marksheet, 12th marksheet, and Aadhaar/Govt ID into a single .pdf file (Max: 20 MB).
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
              <FileText className="w-3.5 h-3.5 text-red-500" />
              Only PDF format accepted
            </div>
          </div>
        )}

        {pdfUploadError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{pdfUploadError}</span>
          </div>
        )}

        {errorFields.pdfDossier && (
          <p className="text-xs text-red-600 font-medium">
            {errorFields.pdfDossier}
          </p>
        )}
      </section>

      {/* Step 1 Footer Action */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto px-6 h-10 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
        >
          Next: Fee & Payment Details
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}


