import React from 'react';
import { Stethoscope, Sparkles, Scissors, Wrench, Clock, Users, Ban } from 'lucide-react';

function getServiceIcon(prefix, name = '') {
  const n = name.toLowerCase();
  if (prefix === 'A' || n.includes('consultation') || n.includes('clinic')) {
    return Stethoscope;
  }
  if (prefix === 'B' || n.includes('dental')) {
    return Sparkles;
  }
  if (prefix === 'C' || n.includes('salon') || n.includes('haircut')) {
    return Scissors;
  }
  return Wrench;
}

export default function ServiceCard({
  service,
  isSelected,
  onSelect,
}) {
  const Icon = getServiceIcon(service.prefix, service.name);
  const isClosed = !service.isOpen;

  return (
    <button
      type="button"
      onClick={() => {
        if (!isClosed) onSelect(service);
      }}
      disabled={isClosed}
      className={`text-left w-full p-5 rounded-2xl border transition-all duration-150 flex flex-col justify-between min-h-[140px] relative ${
        isClosed
          ? 'bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
          : isSelected
          ? 'bg-indigo-50/40 border-indigo-600 ring-2 ring-indigo-600 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between w-full">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
            isClosed
              ? 'bg-slate-200 text-slate-400'
              : isSelected
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-indigo-50 text-indigo-700'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>

        {isClosed ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
            <Ban className="w-3 h-3" /> Closed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {service.waitingCount ?? 0} waiting
          </span>
        )}
      </div>

      {/* Title & info */}
      <div className="mt-3">
        <h3 className={`font-semibold text-base leading-snug ${isClosed ? 'text-slate-500' : 'text-slate-900'}`}>
          {service.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>~{service.avgServiceMinutes} min per customer</span>
        </p>
      </div>

      {/* Selected Indicator Pill */}
      {isSelected && !isClosed && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-600" />
      )}
    </button>
  );
}

