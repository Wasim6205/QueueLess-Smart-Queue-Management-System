import React from 'react';

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

export function ServiceCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="w-3/4 h-5 mt-2" />
      <Skeleton className="w-1/2 h-4" />
    </div>
  );
}

export function QueueRowSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-8 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-20 h-3" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-16 h-8 rounded-lg" />
      </div>
    </div>
  );
}

export default Skeleton;

