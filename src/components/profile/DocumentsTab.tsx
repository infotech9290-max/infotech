'use client';

import React, { useState } from 'react';
import { Student, DocumentRecord } from '@/types/student';
import {
  FileText,
  Eye,
  Download,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  GraduationCap,
  Award,
  User,
  Files,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface DocumentsTabProps {
  student: Student;
}

export function DocumentsTab({ student }: DocumentsTabProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [photoError, setPhotoError] = useState(false);

  const mainDossier: DocumentRecord = student.documents[0] || {
    id: `DOC-${student.id}-001`,
    title: 'Consolidated Admission Dossier (PDF)',
    fileName: `${student.name.replace(/\s+/g, '_')}_Admission_Dossier.pdf`,
    fileSize: '3.4 MB',
    uploadDate: student.date.split(',')[0],
    url: '#',
    type: 'PDF',
    verified: true,
  };

  const additionalDocs = student.documents.slice(1);

  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const checklist = mainDossier.checklistItems || [
    `Class 10 Marksheet & Passing Certificate (${student.marks.tenth})`,
    `Class 12 Marksheet & Passing Certificate (${student.marks.twelfth})`,
    'Government Identity Proof (Aadhaar / Passport Verified)',
    'Transfer Certificate & Character Certificate',
    'Passport Size Color Photographs (Attested)',
  ];

  const handleOpenPreview = (doc: DocumentRecord) => {
    setSelectedDoc(doc);
    setPreviewOpen(true);
  };

  const handleDownload = (doc: DocumentRecord) => {
    const blobContent = `APEX UNIVERSITY ARCHIVES\nDocument: ${doc.title}\nStudent: ${student.name} (#${student.id})\nCourse: ${student.course}\nStatus: Verified\nDate: ${doc.uploadDate}`;
    const blob = new Blob([blobContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = doc.fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Student Identity & Academic Profile Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          {/* Photo or Initials Fallback Avatar */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-lg sm:text-xl flex items-center justify-center border-2 border-white shadow-md shrink-0 overflow-hidden">
            {student.photoUrl && !photoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-full h-full object-cover"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {student.name}
              </h3>
              <span className="font-mono text-xs text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md font-semibold">
                #{student.id}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                {student.course}
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <User className="w-3 h-3 text-slate-400 shrink-0" />
                Officer: {student.workerName}
              </span>
            </div>
          </div>
        </div>

        {/* Qualification Pills */}
        <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>10th: {student.marks.tenth}</span>
            <span className="text-slate-400 text-[10px]">({student.academic.tenthYear})</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>12th: {student.marks.twelfth}</span>
            <span className="text-slate-400 text-[10px]">({student.academic.twelfthYear})</span>
          </div>
        </div>
      </div>

      {/* Featured Single PDF Admission Dossier Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Files className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Consolidated Admission Record
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            Verified Single PDF Dossier
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-slate-50 border border-blue-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                {mainDossier.title}
              </h4>
              <p className="font-mono text-xs text-slate-600 truncate max-w-xs sm:max-w-md">
                {mainDossier.fileName}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 text-[11px] font-semibold">
                  {mainDossier.fileSize}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Uploaded on {mainDossier.uploadDate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenPreview(mainDossier)}
              className="flex-1 sm:flex-initial h-9 px-3.5 text-xs font-semibold gap-1.5 border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              Preview Dossier
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleDownload(mainDossier)}
              className="flex-1 sm:flex-initial h-9 px-3.5 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Verified Credentials Checklist */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Credentials & Eligibility Checklist
            </h4>
            <p className="text-xs text-slate-500">
              Individual academic marksheets and identity proofs bundled within the admission dossier.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
            {checklist.length} / {checklist.length} Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {checklist.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-slate-800 block leading-tight">{item}</span>
                <span className="text-[10px] text-emerald-700 font-medium mt-0.5 inline-block">
                  Verified & Archived
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Documents Archive (if multiple files present) */}
      {additionalDocs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Supplementary Attached Files ({additionalDocs.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {additionalDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-slate-900 text-xs truncate">{doc.title}</h5>
                    <p className="font-mono text-[11px] text-slate-500 truncate">
                      {doc.fileName} • {doc.fileSize}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer"
                    onClick={() => handleOpenPreview(doc)}
                    title="Preview file"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer"
                    onClick={() => handleDownload(doc)}
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Preview Integration */}
      <DocumentPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        student={student}
        document={selectedDoc}
      />
    </div>
  );
}


