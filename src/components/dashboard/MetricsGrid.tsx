'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Student, StudentStatus } from '@/types/student';
import { Users, AlertCircle, RefreshCw, CheckCircle2, XCircle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricsGridProps {
  students: Student[];
  activeFilter: StudentStatus | 'ALL';
  onFilterChange: (status: StudentStatus | 'ALL') => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export const MetricsGrid = React.memo(function MetricsGrid({ students, activeFilter, onFilterChange }: MetricsGridProps) {
  const counts = useMemo(() => {
    let actionNeeded = 0, inProcess = 0, enrolled = 0, rejected = 0, cancelled = 0;
    for (const s of students) {
      if (s.status === 'Action Needed') actionNeeded++;
      else if (s.status === 'In Process') inProcess++;
      else if (s.status === 'Enrolled') enrolled++;
      else if (s.status === 'Rejected') rejected++;
      else if (s.status === 'Cancelled') cancelled++;
    }
    return { total: students.length, actionNeeded, inProcess, enrolled, rejected, cancelled };
  }, [students]);

  const cards = useMemo(() => [
    { id: 'ALL', label: 'Total Leads', value: counts.total, icon: Users, color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
    { id: 'Action Needed', label: 'Action Needed', value: counts.actionNeeded, icon: AlertCircle, color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
    { id: 'In Process', label: 'In Process', value: counts.inProcess, icon: RefreshCw, color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
    { id: 'Enrolled', label: 'Enrolled', value: counts.enrolled, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
    { id: 'Rejected', label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'bg-rose-100 text-rose-700', border: 'border-rose-200' },
    { id: 'Cancelled', label: 'Cancelled', value: counts.cancelled, icon: Ban, color: 'bg-slate-100 text-slate-700', border: 'border-slate-200' }
  ], [counts]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        return (
          <motion.div
            key={card.id}
            variants={itemVariants}
            onClick={() => onFilterChange(card.id as StudentStatus | 'ALL')}
            className={cn(
              'cursor-pointer relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg',
              isActive ? 'ring-2 ring-primary ring-offset-2 scale-105 shadow-md z-10' : 'hover:-translate-y-1',
              card.border, 'bg-white'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('p-2.5 rounded-xl', card.color)}>
                <Icon size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900">{card.value}</h3>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
            </div>
            {isActive && (
              <motion.div layoutId="activeMetricsFilter" className="absolute inset-0 bg-primary/5 rounded-2xl pointer-events-none" initial={false} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
});


