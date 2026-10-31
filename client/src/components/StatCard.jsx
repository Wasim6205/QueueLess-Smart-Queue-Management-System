import React from 'react';

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = 'indigo',
  sublabel = null,
}) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const badgeStyle = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${badgeStyle}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
      </div>
    </div>
  );
}

