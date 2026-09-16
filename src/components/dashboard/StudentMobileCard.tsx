'use client';

import React from 'react';
import { Student } from '@/types/student';
import { StatusBadge } from './StatusBadge';
import { GraduationCap, Award, ChevronRight, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentMobileCardProps {
  student: Student;
  onSelect: (student: Student) => void;
}

export function StudentMobileCard({ student, onSelect }: StudentMobileCardProps) {
  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-3 cursor-pointer"
      onClick={() => onSelect(student)}
    >
      {/* Top Header: Avatar + Name + ID + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-base leading-tight truncate">
              {student.name}
            </h4>
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              #{student.id}
            </span>
          </div>
        </div>
        <StatusBadge status={student.status} className="shrink-0" />
      </div>

      {/* Middle Row: Course & Marks */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
          <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate font-medium">{student.course}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700 justify-end min-w-0">
          <Award className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium truncate">
            10th: {student.marks?.tenth || student.academic.tenthMarks} | 12th: {student.marks?.twelfth || student.academic.twelfthMarks}
          </span>
        </div>
      </div>

      {/* Bottom Row: Worker Attribution & View Details Action */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1 min-w-0">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">Admitted by: {student.workerName}</span>
        </div>
        <div className="flex items-center gap-1 -mr-1">
          {student.phone && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md"
              title="Chat on WhatsApp"
              onClick={(e) => {
                e.stopPropagation();
                const cleanPhone = (student.phone || '').replace(/[^0-9]/g, '');
                const due = student.fees?.balanceDue ?? 0;
                const msg = due > 0
                  ? `Dear ${student.name}, this is a reminder from INFO TECH regarding your pending admission balance of ₹${due.toLocaleString('en-IN')} for ${student.course}. Please contact counselor ${student.workerName}.`
                  : `Hello ${student.name}! Congratulations on your admission to INFO TECH (ID: #${student.id}) for ${student.course}. Welcome to INFO TECH!`;
                window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`, '_blank');
              }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(student);
            }}
          >
            View Profile
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}


