'use client';

import React, { useState, useEffect } from 'react';
import { Student, StudentStatus } from '@/types/student';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { StudentList } from '@/components/dashboard/StudentList';
import { StudentProfileModal } from '@/components/profile/StudentProfileModal';
import { motion, AnimatePresence } from 'framer-motion';

import { MOCK_STUDENTS } from '@/data/mockStudents';
import { mapDbRecordToStudent, DbAdmissionRecord } from '@/utils/studentMapper';

import WorkersPage from './workers/page';
import SettingsPage from './settings/page';
import FootprintsPage from './footprints/page';
import { AdmissionWizard } from '@/components/admission/AdmissionWizard';

type AdminTab = 'overview' | 'workers' | 'settings' | 'footprints' | 'admission';

export default function AdminOverview() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<StudentStatus | 'ALL'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Sync URL query param for SPA tab switching
  useEffect(() => {
    const checkTab = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab') as AdminTab;
      if (t && ['overview', 'workers', 'settings', 'footprints', 'admission'].includes(t)) {
        setCurrentTab(t);
      }
    };
    checkTab();
    window.addEventListener('popstate', checkTab);
    const onTabChange = (e: CustomEvent) => {
      if (e.detail && ['overview', 'workers', 'settings', 'footprints', 'admission'].includes(e.detail)) {
        setCurrentTab(e.detail as AdminTab);
      }
    };
    window.addEventListener('admin-tab-change', onTabChange as EventListener);
    return () => {
      window.removeEventListener('popstate', checkTab);
      window.removeEventListener('admin-tab-change', onTabChange as EventListener);
    };
  }, []);

  const switchTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
      window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: tab }));
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admissions');
      if (res.ok) {
        const json = await res.json();
        const data = json.data;

        if (data && data.length > 0) {
          const records = data as unknown as DbAdmissionRecord[];
          const mapped: Student[] = records.map(mapDbRecordToStudent);
          setStudents(mapped);
          return;
        }
      }
      setStudents(MOCK_STUDENTS);
    } catch (err) {
      console.error('Error fetching admissions from Supabase:', err);
      setStudents(MOCK_STUDENTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  if (isLoading && currentTab === 'overview') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full animate-pulse bg-slate-50/50 min-h-screen">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-sm p-4">
              <div className="w-24 h-3 bg-slate-200 rounded-full mb-6" />
              <div className="w-12 h-8 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-12 overflow-hidden bg-slate-50/50 font-sans">
      {/* Dynamic Apple-style background blur blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-blue-300/25 to-purple-300/25 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-gradient-to-tl from-emerald-200/25 to-teal-200/25 blur-[120px] pointer-events-none z-0" />
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Sub-header Context Bar for Overview */}
        {currentTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60"
          >
            <div>
              <div className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry & Pipeline
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Admissions & Pipeline Analytics
              </h2>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">
                Live candidate lifecycle tracking, verification checkpoints, and fee collections.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchStudents}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                {isLoading ? 'Syncing...' : '↻ Refresh Data'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Dynamic SPA View Rendering */}
        <AnimatePresence mode="wait">
          {currentTab === 'overview' && (
            <motion.div
              key="overview-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* 6-Card Pastel Metrics Grid */}
              <section aria-label="Student Admissions Metrics">
                <MetricsGrid
                  students={students}
                  activeFilter={activeStatusFilter}
                  onFilterChange={setActiveStatusFilter}
                />
              </section>

              {/* Student List Container */}
              <section 
                aria-label="Student Admissions Tracker"
                className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden"
              >
                <StudentList
                  students={students}
                  activeStatusFilter={activeStatusFilter}
                  onFilterChange={setActiveStatusFilter}
                  onSelectStudent={(student) => setSelectedStudent(student)}
                />
              </section>
            </motion.div>
          )}

          {currentTab === 'workers' && (
            <motion.div
              key="workers-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <WorkersPage />
            </motion.div>
          )}

          {currentTab === 'settings' && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <SettingsPage />
            </motion.div>
          )}

          {currentTab === 'footprints' && (
            <motion.div
              key="footprints-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <FootprintsPage />
            </motion.div>
          )}

          {currentTab === 'admission' && (
            <motion.div
              key="admission-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Direct Enrollment Wizard</h2>
                  <p className="text-sm text-slate-500 mt-1">Official candidate documentation and immediate admission registration.</p>
                </div>
                <button
                  onClick={() => switchTab('overview')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-sm cursor-pointer"
                >
                  Close Wizard & Return
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4 sm:p-8">
                <AdmissionWizard
                  onSuccess={() => {
                    fetchStudents();
                    switchTab('overview');
                  }}
                  onCancel={() => switchTab('overview')}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Student Profile Tabbed Modal */}
        <StudentProfileModal
          student={selectedStudent}
          open={Boolean(selectedStudent)}
          onOpenChange={(open) => {
            if (!open) setSelectedStudent(null);
          }}
          onStatusUpdated={(updated) => {
            setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          }}
        />
      </div>
    </div>
  );
}
