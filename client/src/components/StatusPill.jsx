import React from 'react';

const STATUS_CONFIG = {
  waiting: {
    label: 'Waiting',
    bg: 'bg-amber-100/80 text-ink border-amber-500/30',
    dot: 'bg-amber-500',
  },
  serving: {
    label: 'Now Serving',
    bg: 'bg-mint-100 text-forest-900 border-mint-500/40 font-semibold',
    dot: 'bg-mint-500 animate-pulse',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-stone-100 text-stone-700 border-stone-500/20',
    dot: 'bg-stone-500',
  },
  skipped: {
    label: 'Skipped',
    bg: 'bg-rose-100 text-rose-900 border-rose-500/30',
    dot: 'bg-rose-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-stone-100 text-stone-700 border-stone-500/20',
    dot: 'bg-stone-500',
  },
};

export default function StatusPill({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.waiting;
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm font-semibold'
      : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-tight ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
