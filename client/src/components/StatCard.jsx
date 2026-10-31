import React from 'react';
import AnimatedNumber from './ui/AnimatedNumber';

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = 'brand',
  sublabel = null,
}) {
  const colorMap = {
    brand: 'bg-brand-100 text-brand-600 border-brand-500/20',
    amber: 'bg-amber-100 text-amber-700 border-amber-500/20',
    mint: 'bg-mint-100 text-forest-700 border-mint-500/20',
    forest: 'bg-forest-100 text-forest-700 border-forest-700/20',
    stone: 'bg-stone-100 text-stone-700 border-stone-500/20',
  };

  const badgeStyle = colorMap[color] || colorMap.brand;

  const isNumeric = typeof value === 'number' || (!isNaN(Number(value)) && value !== 'None' && value !== '---');

  return (
    <div className="bg-surface rounded-3xl border border-line p-5 sm:p-6 shadow-warm-xs flex flex-col justify-between transition-all duration-200 hover:shadow-warm-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${badgeStyle}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <div className="font-display text-2xl sm:text-3xl font-black text-ink tracking-tight tabular-nums">
          {isNumeric ? <AnimatedNumber value={value} /> : value}
        </div>
        {sublabel && <p className="text-xs text-ink-muted mt-1">{sublabel}</p>}
      </div>
    </div>
  );
}
