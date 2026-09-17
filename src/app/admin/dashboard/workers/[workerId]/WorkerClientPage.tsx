'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentList } from '@/components/dashboard/StudentList';
import { StudentProfileModal } from '@/components/profile/StudentProfileModal';
import { Student, StudentStatus } from '@/types/student';
import { mapDbRecordToStudent, DbAdmissionRecord } from '@/utils/studentMapper';

interface WorkerInfo {
  id: string;
  name: string;
  email: string;
  status: string;
}

export default function WorkerDrilldownPage() {
  const params = useParams();
  const router = useRouter();
  const workerId = decodeURIComponent(params.workerId as string);

  // Real worker info fetched from DB
  const [worker, setWorker] = useState<WorkerInfo>({
    id: workerId,
    name: workerId,
    email: '',
    status: 'ACTIVE',
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (!workerId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch real worker info from DB
        if (workerId === 'ADM-01' || workerId === 'infotech9290@gmail.com') {
          setWorker({
            id: 'ADM-01',
            name: 'Super Admin (Director & Counselor)',
            email: 'infotech9290@gmail.com',
            status: 'ACTIVE',
          });
        } else {
          const workersRes = await fetch('/api/admin/workers');
          if (workersRes.ok) {
            const workersJson = await workersRes.json();
            const allWorkers = workersJson.workers || [];
            const found = allWorkers.find(
              (w: any) => w.id === workerId || w.email === workerId
            );
            if (found) {
              setWorker({
                id: found.id,
                name: found.name,
                email: found.email,
                status: 'ACTIVE',
              });
            }
          }
        }

        // 2. Fetch admissions filtered by worker ID
        const admRes = await fetch(`/api/admissions?workerId=${encodeURIComponent(workerId)}`);
        if (admRes.ok) {
          const admJson = await admRes.json();
          const records: DbAdmissionRecord[] = admJson.data || [];
          setStudents(records.map(mapDbRecordToStudent));
        }
      } catch (err) {
        console.error('Error fetching worker drilldown data:', err);
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workerId]);

  const enrolledCount = students.filter((s: Student) => s.status === 'Enrolled').length;
  const successRate = students.length > 0
    ? Math.round((enrolledCount / students.length) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Back Button & Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" className="h-10 w-10 p-0 rounded-xl bg-white border-slate-200 cursor-pointer hover:bg-slate-50" onClick={() => router.push('/admin/dashboard?tab=workers')}>
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Button>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Worker Analytics <ChevronRight className="w-3 h-3" /> {worker.name}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Drilldown</h1>
        </div>
      </div>

      {/* Worker Hero Profile — Real Data Only */}
      <div className="bg-slate-900 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">

          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-emerald-400 p-1 shadow-lg shadow-blue-500/30">
              <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center text-3xl font-black text-white">
                {(worker.name || 'W').split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">{worker.name}</h2>
              <p className="text-blue-400 font-medium mt-1">
                {worker.email || worker.id}
                {' • '}
                <span className="text-emerald-400">ID: {worker.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md">
            <div className="text-center px-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Assigned</p>
              <p className="text-3xl font-black text-white">{students.length}</p>
            </div>
            <div className="w-px h-12 bg-slate-700" />
            <div className="text-center px-4">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Enrolled</p>
              <p className="text-3xl font-black text-emerald-300">{enrolledCount}</p>
            </div>
            <div className="w-px h-12 bg-slate-700" />
            <div className="text-center px-4">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Success Rate</p>
              <p className="text-3xl font-black text-blue-300">{successRate}%</p>
            </div>
          </div>

        </div>
      </div>

      {/* Students Data Grid */}
      <div className="mt-8">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-900">Student Admissions Ledger</h3>
          <p className="text-sm text-slate-500">Showing all records processed by {worker.name}.</p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden animate-pulse">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="w-40 h-6 bg-slate-200 rounded-md" />
              <div className="hidden sm:block w-64 h-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-full bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <p className="text-slate-400 font-medium">No admissions found for this worker.</p>
          </div>
        ) : (
          <StudentList
            students={students}
            onSelectStudent={(s) => setSelectedStudent(s)}
            activeStatusFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
        )}
      </div>

      {/* Profile Modal */}
      <StudentProfileModal
        open={Boolean(selectedStudent)}
        onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}
        student={selectedStudent}
        onStatusUpdated={(updated) => {
          setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        }}
      />

    </div>
  );
}
