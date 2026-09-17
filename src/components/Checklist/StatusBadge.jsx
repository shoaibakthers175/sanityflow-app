import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, MinusCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'sm', onClick = null, interactive = false }) {
  const normStatus = (status || 'pending').toLowerCase();

  let config = {
    bg: 'bg-surface-200/80 dark:bg-surface-800/80 text-surface-700 dark:text-surface-300 border-surface-300 dark:border-surface-700',
    icon: Clock,
    label: 'Pending',
    dot: 'bg-surface-400'
  };

  if (normStatus === 'passed' || normStatus === 'pass') {
    config = {
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
      label: 'Passed',
      dot: 'bg-emerald-500'
    };
  } else if (normStatus === 'failed' || normStatus === 'fail') {
    config = {
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      icon: XCircle,
      label: 'Failed',
      dot: 'bg-rose-500'
    };
  } else if (normStatus === 'blocked') {
    config = {
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      icon: AlertTriangle,
      label: 'Blocked',
      dot: 'bg-amber-500'
    };
  } else if (normStatus === 'skipped') {
    config = {
      bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
      icon: MinusCircle,
      label: 'Skipped',
      dot: 'bg-slate-400'
    };
  } else if (normStatus.includes('progress')) {
    config = {
      bg: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30',
      icon: Clock,
      label: normStatus.includes('issues') ? 'Issues Found' : 'In Progress',
      dot: 'bg-brand-500'
    };
  }

  const Icon = config.icon;
  const sizeClasses = size === 'lg' 
    ? 'px-3 py-1.5 text-xs font-bold gap-2' 
    : size === 'md' 
    ? 'px-2.5 py-1 text-xs font-semibold gap-1.5' 
    : 'px-2 py-0.5 text-[11px] font-semibold gap-1.5';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded-full border transition-all select-none ${sizeClasses} ${config.bg} ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
