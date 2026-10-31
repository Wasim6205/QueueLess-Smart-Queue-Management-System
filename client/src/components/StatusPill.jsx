import React from 'react';

const STATUS_CONFIG = {
  waiting: {
    label: 'Waiting',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  serving: {
    label: 'Now Serving',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500 animate-pulse',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  skipped: {
    label: 'Skipped',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    dot: 'bg-zinc-400',
  },
};

export default function StatusPill({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.waiting;
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm font-semibold'
      : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

