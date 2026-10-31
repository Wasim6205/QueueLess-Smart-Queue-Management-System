import React from 'react';

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-line/60 rounded-2xl ${className}`} />;
}

export function ServiceCardSkeleton() {
  return (
    <div className="p-6 rounded-3xl border border-line bg-surface shadow-warm-xs flex flex-col justify-between min-h-[150px]">
      <div className="flex justify-between items-start">
        <Skeleton className="w-11 h-11 rounded-2xl" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <div className="space-y-2 mt-4">
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-1/2 h-4" />
      </div>
    </div>
  );
}

export function QueueRowSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-line bg-surface flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-20 h-3" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-16 h-9 rounded-xl" />
      </div>
    </div>
  );
}

export default Skeleton;
