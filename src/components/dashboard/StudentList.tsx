'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Student, StudentStatus } from '@/types/student';
import { StatusBadge } from './StatusBadge';
import { StudentMobileCard } from './StudentMobileCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  SlidersHorizontal,
  X,
  Users,
  GraduationCap,
  Award,
  CreditCard,
  ChevronRight,
  UserCheck,
  Download,
  MessageSquare,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentListProps {
  students: Student[];
  activeStatusFilter: StudentStatus | 'ALL';
  onFilterChange: (status: StudentStatus | 'ALL') => void;
  onSelectStudent: (student: Student) => void;
}

const FILTER_TABS: Array<{ id: StudentStatus | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All Students' },
  { id: 'Action Needed', label: 'Action Needed' },
  { id: 'In Process', label: 'In Process' },
  { id: 'Enrolled', label: 'Enrolled' },
  { id: 'Rejected', label: 'Rejected' },
  { id: 'Cancelled', label: 'Cancelled' },
];

export function StudentList({
  students,
  activeStatusFilter,
  onFilterChange,
  onSelectStudent,
}: StudentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [counselorFilter, setCounselorFilter] = useState<string>('ALL');

  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.course) set.add(s.course);
    });
    return Array.from(set).sort();
  }, [students]);

  const availableCounselors = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.workerName) set.add(s.workerName);
    });
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesStatus =
        activeStatusFilter === 'ALL' || student.status === activeStatusFilter;

      const matchesCourse =
        courseFilter === 'ALL' || student.course === courseFilter;

      const matchesCounselor =
        counselorFilter === 'ALL' || student.workerName === counselorFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (student.name?.toLowerCase().includes(q)) ||
        (student.id?.toLowerCase().includes(q)) ||
        (student.course?.toLowerCase().includes(q)) ||
        (student.workerName?.toLowerCase().includes(q)) ||
        (student.phone?.toLowerCase().includes(q)) ||
        (student.email?.toLowerCase().includes(q)) ||
        Boolean(student.payments?.some((p) => p.utr?.toLowerCase().includes(q)));

      return matchesStatus && matchesCourse && matchesCounselor && matchesSearch;
    });
  }, [students, activeStatusFilter, courseFilter, counselorFilter, searchQuery]);

  const exportToCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = [
      'Student ID',
      'Name',
      'Course',
      'Status',
      'Admitted By',
      'Phone',
      'Email',
      '10th Marks',
      '12th Marks',
      'Total Fee',
      'Scholarship',
      'Net Fee',
      'Paid Amount',
      'Balance Due',
      'Payment Mode',
      'UTR',
      'Admission Date',
    ];
    const escapeCsv = (val: unknown) => {
      const s = val === null || val === undefined ? '' : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = filteredStudents.map((s) => [
      escapeCsv(s.id),
      escapeCsv(s.name),
      escapeCsv(s.course),
      escapeCsv(s.status),
      escapeCsv(s.workerName),
      escapeCsv(s.phone),
      escapeCsv(s.email),
      escapeCsv(s.academic?.tenthMarks ?? s.marks?.tenth ?? 'N/A'),
      escapeCsv(s.academic?.twelfthMarks ?? s.marks?.twelfth ?? 'N/A'),
      escapeCsv(s.fees?.totalFee ?? 0),
      escapeCsv(s.fees?.scholarship ?? s.fees?.discount ?? 0),
      escapeCsv(s.fees?.netFee ?? 0),
      escapeCsv(s.fees?.paidAmount ?? 0),
      escapeCsv(s.fees?.balanceDue ?? 0),
      escapeCsv(s.payments?.[0]?.paymentMethod || s.payments?.[0]?.method || (s.fees?.paidAmount ? 'Official Account' : 'N/A')),
      escapeCsv(s.payments?.[0]?.utr || ''),
      escapeCsv(s.registrationDate ? new Date(s.registrationDate).toLocaleDateString('en-GB') : s.date),
    ]);

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `admissions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-xs border-slate-200/90 rounded-2xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/70 border-b border-slate-200/80 px-4 sm:px-6 py-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">
                Student Admissions Tracker
              </CardTitle>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                {filteredStudents.length} {filteredStudents.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            <CardDescription className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live tracking of registered students, status checkpoints, and worker attributions.
            </CardDescription>
          </div>

          {/* Actions & Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Export CSV Button */}
            <button
              type="button"
              onClick={exportToCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download admissions CSV spreadsheet"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            {/* Course Filter Dropdown */}
            {availableCourses.length > 0 && (
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                title="Filter by Course"
              >
                <option value="ALL">All Courses ({availableCourses.length})</option>
                {availableCourses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {/* Counselor Filter Dropdown */}
            {availableCounselors.length > 0 && (
              <select
                value={counselorFilter}
                onChange={(e) => setCounselorFilter(e.target.value)}
                className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                title="Filter by Counselor"
              >
                <option value="ALL">All Counselors ({availableCounselors.length})</option>
                {availableCounselors.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            )}

            {/* Search bar */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name, ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-white border-slate-200 focus-visible:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Reset Filters button */}
            {(activeStatusFilter !== 'ALL' || courseFilter !== 'ALL' || counselorFilter !== 'ALL' || searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  onFilterChange('ALL');
                  setCourseFilter('ALL');
                  setCounselorFilter('ALL');
                  setSearchQuery('');
                }}
                className="h-9 px-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title="Reset all filters and search"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1 hidden sm:inline" />
          {FILTER_TABS.map((tab) => {
            const isActive = activeStatusFilter === tab.id;
            const count =
              tab.id === 'ALL'
                ? students.length
                : students.filter((s) => s.status === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer',
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-semibold',
                    isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Empty State */}
        {filteredStudents.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                {students.length === 0 ? 'No admission records yet' : 'No matching students found'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {students.length === 0
                  ? 'All newly registered student admissions will appear in this ledger.'
                  : 'No admission records match your current filter and search query. Try clearing filters or searching for something else.'}
              </p>
            </div>
            {(activeStatusFilter !== 'ALL' || searchQuery || courseFilter !== 'ALL' || counselorFilter !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-slate-600 cursor-pointer"
                onClick={() => {
                  onFilterChange('ALL');
                  setSearchQuery('');
                  setCourseFilter('ALL');
                  setCounselorFilter('ALL');
                }}
              >
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile View: Card List (<768px) */}
            <motion.div
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
              initial="hidden"
              animate="show"
              className="block md:hidden p-3 space-y-3"
            >
              {filteredStudents.map((student) => (
                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} key={student.id}>
                  <StudentMobileCard
                  student={student}
                  onSelect={onSelectStudent}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Desktop View: Full Responsive Table (>=768px) */}
            <div className="hidden md:block overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader className="bg-slate-50/80 border-b border-slate-200/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3.5 pl-6">
                      Student
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3.5">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3.5">
                      Course
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3.5">
                      Marks (10th / 12th)
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3.5">
                      Admitted By
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3.5">
                      Payment / UTR
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3.5">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-right text-slate-700 text-xs uppercase tracking-wider py-3.5 pr-6">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <motion.tbody
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                    initial="hidden"
                    animate="show"
                    className="[&_tr:last-child]:border-0"
                  >
                  {filteredStudents.map((student) => {
                    const initials = student.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    const primaryPayment = student.payments?.[0];

                    return (
                      <motion.tr
                        variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                        key={student.id}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0"
                        onClick={() => onSelectStudent(student)}
                      >
                        {/* Student Name & ID */}
                        <TableCell className="py-3.5 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 text-sm truncate">
                                {student.name}
                              </div>
                              <div className="font-mono text-xs text-slate-500">
                                #{student.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3.5">
                          <StatusBadge status={student.status} />
                        </TableCell>

                        {/* Course */}
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-800 text-sm">
                            <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="truncate font-medium">{student.course}</span>
                          </div>
                        </TableCell>

                        {/* Marks */}
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {(student.marks?.tenth || student.academic?.tenthMarks || 'N/A')} / {(student.marks?.twelfth || student.academic?.twelfthMarks || 'N/A')}
                            </span>
                          </div>
                        </TableCell>

                        {/* Admitted By */}
                        <TableCell className="py-3.5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700">
                            <UserCheck className="w-3 h-3 text-blue-600" />
                            <span className="truncate max-w-[120px]">{student.workerName}</span>
                          </div>
                        </TableCell>

                        {/* Payment / UTR */}
                        <TableCell className="py-3.5">
                          {primaryPayment ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                                <CreditCard className="w-3 h-3 text-slate-500" />
                                <span>{primaryPayment.method}</span>
                              </div>
                              <div className="font-mono text-[11px] text-slate-500 truncate max-w-[130px]">
                                {primaryPayment.utr}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No payments</span>
                          )}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="py-3.5 text-xs text-slate-500 whitespace-nowrap">
                          {student.date}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="py-3.5 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {student.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title={`WhatsApp ${student.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cleanPhone = (student.phone || '').replace(/[^0-9]/g, '');
                                  if (cleanPhone.length < 10) {
                                    alert('Valid 10-digit phone number is required to send WhatsApp notification.');
                                    return;
                                  }
                                  const phone10 = cleanPhone.slice(-10);
                                  const due = student.fees?.balanceDue ?? 0;
                                  const msg = due > 0
                                    ? `Dear ${student.name}, this is a reminder regarding your pending admission balance of ₹${due.toLocaleString('en-IN')} for ${student.course}. Please contact counselor ${student.workerName}.`
                                    : `Hello ${student.name}! Congratulations on your admission (ID: #${student.id}) for ${student.course}. Welcome aboard!`;
                                  window.open(`https://wa.me/91${phone10}?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectStudent(student);
                              }}
                            >
                              View Profile
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                  </motion.tbody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


