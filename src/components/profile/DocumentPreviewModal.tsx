'use client';

import React from 'react';
import { Student, DocumentRecord } from '@/types/student';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  GraduationCap,
} from 'lucide-react';

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  document?: DocumentRecord | null;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  student,
  document,
}: DocumentPreviewModalProps) {
  if (!student) return null;

  const activeDoc = document || student.documents[0] || null;
  const fileName = activeDoc?.fileName || `${student.name.replace(/\s+/g, '_')}_Admission_Dossier.pdf`;
  const fileSize = activeDoc?.fileSize || '3.4 MB';
  const uploadDate = activeDoc?.uploadDate || student.date.split(',')[0];

  const checklist = activeDoc?.checklistItems || [
    `Class 10 Marksheet & Certificate (${student.marks.tenth})`,
    `Class 12 Marksheet & Certificate (${student.marks.twelfth})`,
    'Government Identity Proof (Aadhaar / Passport)',
    'Transfer & Migration Certificate (Verified)',
    'Passport Size Color Photographs (Attested)',
  ];

  const handleDownload = () => {
    // Create a simulated text/pdf blob download for authentic user interaction
    const blobContent = `APEX UNIVERSITY ADMISSIONS ARCHIVE\nStudent: ${student.name} (${student.id})\nCourse: ${student.course}\nStatus: ${student.status}\nFile: ${fileName}\nVerified: Yes`;
    const blob = new Blob([blobContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        <DialogHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3 pr-6">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {activeDoc?.title || 'Consolidated Admission Dossier'}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                <span>{fileName}</span>
                <span>•</span>
                <span>{fileSize}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {uploadDate}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Document Canvas Viewer */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          <div className="max-w-xl mx-auto bg-white border border-slate-200/90 rounded-xl shadow-md p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Watermark Seal */}
            <div className="absolute right-4 top-4 rotate-[-12deg] pointer-events-none opacity-80">
              <div className="border-2 border-emerald-600 text-emerald-700 px-3 py-1 rounded-md text-[10px] font-mono font-black uppercase tracking-widest flex items-center gap-1 shadow-2xs bg-emerald-50/90">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                VERIFIED ARCHIVAL COPY
              </div>
            </div>

            {/* Institution Header */}
            <div className="border-b border-slate-200 pb-4 text-center space-y-1">
              <div className="inline-flex items-center gap-2 text-slate-800 font-bold text-sm tracking-wide uppercase">
                <Building2 className="w-4 h-4 text-blue-600" />
                Apex Institute of Higher Learning
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Consolidated Admission & Academic Dossier
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                System Reference: DOS-{student.id}-{uploadDate.replace(/\s+/g, '')}
              </p>
            </div>

            {/* Student Bio Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidate Name</span>
                <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  {student.name}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Application ID</span>
                <span className="font-mono font-bold text-slate-900 mt-0.5 block">#{student.id}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Enrolled Course</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  {student.course}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admission Officer</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{student.workerName}</span>
              </div>
            </div>

            {/* Verified Credentials Checklist */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Included Credentials & Certificates
                </h4>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  All Items Verified
                </span>
              </div>
              <div className="space-y-1.5">
                {checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/90 border border-slate-200/60 text-xs text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Signature Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
              <span>Page 1 of 3 (Archived PDF)</span>
              <span className="font-mono text-[10px]">SHA256: 7f8c9b2...verified</span>
            </div>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 hidden sm:block">
            Signed & audited via Central Admissions Registrar
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


