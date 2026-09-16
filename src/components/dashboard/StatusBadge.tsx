import React from 'react';
import { cn } from '@/lib/utils';
import { StudentStatus } from '@/types/student';
import { AlertCircle, CheckCircle2, RefreshCw, XCircle, Ban } from 'lucide-react';

const STATUS_CONFIG: Record<StudentStatus, {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  'Enrolled': {
    label: 'Enrolled',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    Icon: CheckCircle2,
  },
  'Action Needed': {
    label: 'Action Needed',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    Icon: AlertCircle,
  },
  'In Process': {
    label: 'In Process',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    Icon: RefreshCw,
  },
  'Rejected': {
    label: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    Icon: XCircle,
  },
  'Cancelled': {
    label: 'Cancelled',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    Icon: Ban,
  },
};

interface StatusBadgeProps {
  status: StudentStatus;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['In Process'];
  const { Icon } = config;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}


