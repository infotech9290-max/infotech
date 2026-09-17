'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  GraduationCap, UserCircle, ChevronDown, LogOut,
  LayoutDashboard, KeyRound, Home,
  ShieldCheck, ArrowRight,
  Users, AlertCircle, RefreshCw, CheckCircle, XCircle, Ban, Search,
  Loader2, Check, PlusCircle
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdmissionWizard } from '@/components/admission/AdmissionWizard';
import { StudentProfileModal } from '@/components/profile/StudentProfileModal';
import { mapDbRecordToStudent } from '@/utils/studentMapper';
import { Student } from '@/types/student';
import { Eye, Download, MessageSquare } from 'lucide-react';

// ─── Types ─────────────────────────────────────────
type ActiveView = 'home' | 'overview' | 'admission' | 'settings';
type StatusKey = 'All' | 'Action Needed' | 'In Process' | 'Enrolled' | 'Rejected' | 'Cancelled';

interface AdmissionRecord {
  id: string;
  unique_id: string;
  student_name: string;
  graduation_course: string;
  status: string;
  created_at: string;
  balance_due: number;
  payment_method?: string;
  payment_utr?: string;
  worker_name?: string;
  tenth_marks?: string;
}

const normalizeStatus = (s: string): StatusKey => {
  const upper = (s || '').toUpperCase();
  if (upper === 'ENROLLED') return 'Enrolled';
  if (upper === 'REJECTED') return 'Rejected';
  if (upper === 'CANCELLED') return 'Cancelled';
  if (upper === 'IN_PROCESS' || upper === 'IN PROCESS') return 'In Process';
  return 'Action Needed';
};

const statusBadgeStyles: Record<StatusKey, string> = {
  'All': 'bg-slate-100 text-slate-800',
  'Action Needed': 'bg-amber-100 text-amber-800 border-amber-200',
  'In Process': 'bg-purple-100 text-purple-800 border-purple-200',
  'Enrolled': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
  'Cancelled': 'bg-slate-100 text-slate-700 border-slate-200',
};

// ─── Sub-Views ──────────────────────────────────────

function HomeView({
  workerName,
  brandName,
  admissions,
  isLoading,
  onGoToOverview,
  onStartAdmission,
  onSelectStudent,
}: {
  workerName: string;
  brandName: string;
  admissions: AdmissionRecord[];
  isLoading: boolean;
  onGoToOverview: () => void;
  onStartAdmission: () => void;
  onSelectStudent: (record: any) => void;
}) {
  const recentAdmissions = admissions.slice(0, 5);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* Dark Blue Banner */}
      <div className="bg-slate-900 text-white rounded-[2rem] p-10 sm:p-14 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12 shadow-2xl">
        <div className="flex-1 space-y-8 relative z-10 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
            <ShieldCheck className="w-4 h-4" /> Secure Portal Active
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-[1.1]">
            Welcome back, <br /> <span className="text-blue-400 capitalize">{workerName}!</span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
            You are currently logged into the {brandName} network. Begin a new application or manage your recent student registrations below.
          </p>
        </div>
        {/* Action Card */}
        <div className="w-full md:w-[400px] bg-slate-800 rounded-3xl p-8 border border-slate-700/50 shadow-2xl relative z-10 flex-shrink-0">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">New Admission</h3>
          <p className="text-slate-300 text-sm mb-8 leading-relaxed">
            Start the 3-step enrollment wizard for a new student.
          </p>
          <Button
            onClick={onStartAdmission}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black h-14 rounded-xl text-lg shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
          >
            Start Form <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Recent Admissions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div>
            <h3 className="text-xl font-black text-slate-900">Your Recent Admissions</h3>
            <p className="text-xs text-slate-500">Live submissions linked to your account</p>
          </div>
          <Button
            variant="link"
            onClick={onGoToOverview}
            className="text-blue-600 font-bold hover:underline p-0 h-auto cursor-pointer"
          >
            View All ({admissions.length}) &rarr;
          </Button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-sm font-semibold text-slate-500">Retrieving student records...</p>
          </div>
        ) : recentAdmissions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">No admissions logged yet</h4>
              <p className="text-xs text-slate-400 mt-1">Applications you submit will appear here instantly.</p>
            </div>
            <Button
              onClick={onStartAdmission}
              className="bg-blue-600 text-white font-bold rounded-xl px-6 h-11 cursor-pointer"
            >
              + Register First Student
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {recentAdmissions.map((record, index) => {
              const status = normalizeStatus(record.status);
              return (
                <div
                  key={record.unique_id || record.id || `rec-${index}`}
                  onClick={() => onSelectStudent(record)}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-blue-50/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-base shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                      {(record.student_name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{record.student_name}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadgeStyles[status]}`}>
                          {status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        ID: #{record.unique_id} &bull; Course: <span className="text-slate-700 font-semibold">{record.graduation_course }</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 text-xs text-slate-500 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Payment</span>
                      <span className="font-bold text-slate-800">{record.payment_method }</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Registered</span>
                      <span className="font-medium text-slate-600">
                        {new Date(record.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStudent(record);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs border border-blue-200 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Dossier</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewView({
  admissions,
  isLoading,
  onRefresh,
  onStartAdmission,
  onSelectStudent,
}: {
  admissions: AdmissionRecord[];
  isLoading: boolean;
  onRefresh?: () => void;
  onStartAdmission: () => void;
  onSelectStudent: (record: any) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<StatusKey>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const counts: Record<StatusKey, number> = useMemo(() => {
    return {
      'All': admissions.length,
      'Action Needed': admissions.filter((a) => normalizeStatus(a.status) === 'Action Needed').length,
      'In Process': admissions.filter((a) => normalizeStatus(a.status) === 'In Process').length,
      'Enrolled': admissions.filter((a) => normalizeStatus(a.status) === 'Enrolled').length,
      'Rejected': admissions.filter((a) => normalizeStatus(a.status) === 'Rejected').length,
      'Cancelled': admissions.filter((a) => normalizeStatus(a.status) === 'Cancelled').length,
    };
  }, [admissions]);

  const stats: { id: StatusKey; label: string; val: number; icon: React.ElementType; color: string; bg: string }[] = [
    { id: 'All' as StatusKey,           label: 'Total Leads',    val: counts['All'],           icon: Users,        color: 'text-blue-600',    bg: 'bg-blue-50'    },
    { id: 'Action Needed' as StatusKey, label: 'Action Needed',  val: counts['Action Needed'], icon: AlertCircle,  color: 'text-amber-600',   bg: 'bg-amber-50'   },
    { id: 'In Process' as StatusKey,    label: 'In Process',     val: counts['In Process'],    icon: RefreshCw,    color: 'text-purple-600',  bg: 'bg-purple-50'  },
    { id: 'Enrolled' as StatusKey,      label: 'Enrolled',       val: counts['Enrolled'],      icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'Rejected' as StatusKey,      label: 'Rejected',       val: counts['Rejected'],      icon: XCircle,      color: 'text-rose-600',    bg: 'bg-rose-50'    },
    { id: 'Cancelled' as StatusKey,     label: 'Cancelled',      val: counts['Cancelled'],     icon: Ban,          color: 'text-slate-600',   bg: 'bg-slate-50'   },
  ];

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((a) => {
      const matchesFilter = activeFilter === 'All' || normalizeStatus(a.status) === activeFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        a.student_name?.toLowerCase().includes(q) ||
        a.unique_id?.toLowerCase().includes(q) ||
        a.graduation_course?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [admissions, activeFilter, searchQuery]);

  const exportCSV = () => {
    if (filteredAdmissions.length === 0) return;
    const headers = ['Unique ID', 'Student Name', 'Course', 'Status', '10th Marks', 'Payment Mode', 'UTR', 'Balance Due', 'Submission Date'];
    const rows = filteredAdmissions.map((r) => [
      `"${r.unique_id || ''}"`,
      `"${r.student_name || ''}"`,
      `"${r.graduation_course || ''}"`,
      `"${normalizeStatus(r.status)}"`,
      `"${r.tenth_marks || ''}"`,
      `"${r.payment_method }"`,
      `"${r.payment_utr || ''}"`,
      `"${r.balance_due || 0}"`,
      `"${new Date(r.created_at).toLocaleDateString('en-GB')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `my_admissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">My Admissions Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Live tracking of your registered candidates and verification statuses.</p>
        </div>
        <Button
          onClick={onStartAdmission}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-xl shadow-md flex items-center justify-center transition-transform hover:-translate-y-1 text-base cursor-pointer"
        >
          + New Admission
        </Button>
      </div>

      {/* 6-Card Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.id}
            onClick={() => setActiveFilter(stat.id)}
            className={`bg-white rounded-2xl p-5 shadow-sm transition-all hover:-translate-y-1 cursor-pointer text-left focus:outline-none ${
              activeFilter === stat.id
                ? 'border-slate-800 border-2 shadow-md scale-[1.02]'
                : 'border border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">{isLoading ? '—' : stat.val}</p>
            <p className="text-xs font-bold text-slate-500">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Student Tracker */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-900">Student Admissions Tracker</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {filteredAdmissions.length} Showing
              </span>
            </div>
            <p className="text-xs text-slate-500">Real-time candidate pipeline mapped to your agent key</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download admissions CSV spreadsheet"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates..."
                className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500 text-sm bg-white"
              />
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh admissions list"
                className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-sm font-semibold text-slate-500">Syncing student database...</p>
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800">No candidates match your filters</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No students found matching "${searchQuery}". Try a different keyword.`
                : `No students found in category "${activeFilter}".`}
            </p>
            {activeFilter !== 'All' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveFilter('All')}
                className="rounded-xl mt-2 cursor-pointer"
              >
                Clear Category Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAdmissions.map((record, index) => {
              const status = normalizeStatus(record.status);
              const isOverdue = status === 'Action Needed' && record.balance_due > 0;

              return (
                <div
                  key={record.unique_id || record.id || `filter-rec-${index}`}
                  onClick={() => onSelectStudent(record)}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-blue-50/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-lg shrink-0 border border-blue-100 mt-1 group-hover:scale-105 transition-transform">
                      {(record.student_name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{record.student_name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadgeStyles[status]}`}>
                          {status}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-wider">
                            Fee Pending
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="font-mono text-slate-600">ID: #{record.unique_id}</span>
                        <span>&bull;</span>
                        <span className="text-slate-800 font-semibold">{record.graduation_course }</span>
                        <span>&bull;</span>
                        <span>10th: {record.tenth_marks || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Mode</p>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{record.payment_method }</p>
                      {record.payment_utr && (
                        <p className="text-[10px] font-mono text-slate-400">UTR: {record.payment_utr.slice(0, 14)}...</p>
                      )}
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance Due</p>
                      <p className={`font-black text-base mt-0.5 ${record.balance_due > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        ₹{Number(record.balance_due || 0).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submission Date</p>
                      <p className="font-medium text-slate-700 text-xs mt-0.5">
                        {new Date(record.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pl-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const phone = (record as any).phone || '';
                          const clean = phone.replace(/[^0-9]/g, '');
                          if (clean.length < 10) {
                            alert('Valid 10-digit mobile number required.');
                            return;
                          }
                          const due = Number(record.balance_due || 0);
                          const text = due > 0
                            ? encodeURIComponent(`Dear ${record.student_name}, this is a reminder regarding your pending admission balance fee of ₹${due.toLocaleString('en-IN')} for ${record.graduation_course || ''}. Kindly clear the dues or contact your counselor.`)
                            : encodeURIComponent(`Hello ${record.student_name}! Congratulations on your enrollment (ID: #${record.unique_id}) for ${record.graduation_course || ''}. Welcome aboard!`);
                          window.open(`https://wa.me/91${clean.slice(-10)}?text=${text}`, '_blank');
                        }}
                        className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                        title="Chat on WhatsApp / Send Notification"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(record);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Full Dossier</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsView() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    if (!user?.email) {
      setStatusMessage({ type: 'error', text: 'User email not found.' });
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: 'Password successfully updated! Your account is secured.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update password.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'An error occurred while updating the password.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Agent Security Credentials</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage your secret password and portal PIN</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
          {statusMessage && (
            <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {statusMessage.type === 'success' ? <Check className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              {statusMessage.text}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="h-12 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="h-12 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="h-12 rounded-xl"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isUpdating}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md cursor-pointer"
          >
            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Worker SPA Component ──────────────────────

export default function WorkerSPA() {
  const { role, user, logout } = useAuth();
  const workerName = user?.name || user?.email?.split('@')[0] || 'Counselor';
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [brandName, setBrandName] = useState<string>('Admissions Portal');

  useEffect(() => {
    setMounted(true);
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        const name = json.data?.brand?.websiteName || json.data?.website_name;
        if (name) setBrandName(name);
      })
      .catch(() => {});

    const onBrandUpdate = (e: CustomEvent) => {
      if (e.detail) setBrandName(e.detail);
    };
    window.addEventListener('brand-update', onBrandUpdate as EventListener);
    return () => window.removeEventListener('brand-update', onBrandUpdate as EventListener);
  }, []);

  const handleSelectRecord = (record: any) => {
    try {
      const s = mapDbRecordToStudent(record);
      setSelectedStudent(s);
    } catch (err) {
      console.error('Failed to map student record:', err);
    }
  };

  // Read URL query parameter for direct tab linking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view') || params.get('tab');
      if (v === 'admission' || v === 'overview' || v === 'settings' || v === 'home') {
        setActiveView(v as ActiveView);
      }
    }
  }, []);

  // Fetch real admissions with strict role filtering via secure server API
  const loadAdmissions = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const endpoint =
        role !== 'ADMIN' && user?.id
          ? `/api/admissions?workerId=${encodeURIComponent(user.id)}`
          : '/api/admissions';
      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.data) {
        setAdmissions(json.data as AdmissionRecord[]);
      }
    } catch (err) {
      console.error('Failed to load admissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [role, user?.id]);

  useEffect(() => {
    loadAdmissions();
  }, [loadAdmissions]);

  const navItems: { id: ActiveView; label: string; icon: React.ElementType }[] = [
    { id: 'home',      label: 'Home',            icon: Home },
    { id: 'overview',  label: 'Overview',        icon: LayoutDashboard },
    { id: 'admission', label: 'New Admission',   icon: PlusCircle },
    { id: 'settings',  label: 'Change Password', icon: KeyRound },
  ];

  return (
    <ProtectedRoute>
      <div suppressHydrationWarning className="min-h-screen bg-slate-50 flex flex-col font-sans">

        {/* ── Top Header ── */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => setActiveView('home')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{brandName}</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Authorized Admissions Agent</p>
              </div>
            </button>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Nav tabs (desktop) */}
              <nav className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      activeView === item.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Stealth Admin Switch Button */}
              {mounted && role === 'ADMIN' && (
                <Link
                  href="/admin/dashboard"
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer mr-2"
                  title="Switch to Admin Panel"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Switch to Admin Panel</span>
                </Link>
              )}

              {/* Profile + Logout */}
              <div className="group relative">
                <button className="flex items-center gap-3 pl-4 border-l border-slate-200 hover:opacity-80 transition-opacity py-2 cursor-pointer">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-500">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-bold text-slate-900 capitalize">{workerName}</p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">ID: {user?.id || ""}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 top-14 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] overflow-hidden">
                  <div className="p-2 flex flex-col gap-1">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors text-left cursor-pointer ${
                          activeView === item.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <item.icon className="w-4 h-4 text-slate-400" />
                        {item.label}
                      </button>
                    ))}
                    <div className="h-px bg-slate-100 my-1 mx-2" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Secure Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Bottom Nav Tabs */}
          <div className="md:hidden flex border-t border-slate-100">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex-1 flex flex-col items-center py-2 text-xs font-bold transition-colors cursor-pointer ${
                  activeView === item.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'
                }`}
              >
                <item.icon className="w-5 h-5 mb-0.5" />
                {item.label}
              </button>
            ))}
          </div>
        </header>

        {/* ── Main Content Area ── */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {activeView === 'home' && (
            <HomeView
              workerName={workerName}
              brandName={brandName}
              admissions={admissions}
              isLoading={isLoading}
              onGoToOverview={() => setActiveView('overview')}
              onStartAdmission={() => setActiveView('admission')}
              onSelectStudent={handleSelectRecord}
            />
          )}

          {activeView === 'overview' && (
            <OverviewView
              admissions={admissions}
              isLoading={isLoading}
              onRefresh={() => loadAdmissions(true)}
              onStartAdmission={() => setActiveView('admission')}
              onSelectStudent={handleSelectRecord}
            />
          )}

          {activeView === 'admission' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">New Student Admission</h2>
                  <p className="text-sm text-slate-500 mt-1">3-Step Official Enrollment & Documentation Wizard</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setActiveView('home')}
                  className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-sm cursor-pointer"
                >
                  Cancel & Return
                </Button>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4 sm:p-8">
                <AdmissionWizard
                  onSuccess={() => {
                    loadAdmissions(true);
                  }}
                  onComplete={() => setActiveView('overview')}
                  onCancel={() => setActiveView('home')}
                />
              </div>
            </div>
          )}

          {activeView === 'settings' && <SettingsView />}
        </main>

        {/* Full Student Profile Modal (Dossier, Marksheets, Fees & Receipts) */}
        <StudentProfileModal
          student={selectedStudent}
          open={Boolean(selectedStudent)}
          onOpenChange={(open) => {
            if (!open) setSelectedStudent(null);
          }}
          onStatusUpdated={() => loadAdmissions(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
