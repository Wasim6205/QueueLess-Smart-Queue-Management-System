import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Stethoscope, Smile, Scissors, Wrench, Clock, Ban, Check } from 'lucide-react';

function getServiceIcon(prefix, name = '') {
  const n = name.toLowerCase();
  if (prefix === 'A' || n.includes('consultation') || n.includes('clinic')) {
    return Stethoscope;
  }
  if (prefix === 'B' || n.includes('dental')) {
    return Smile;
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
  const prefersReducedMotion = useReducedMotion();
  const Icon = getServiceIcon(service.prefix, service.name);
  const isClosed = !service.isOpen;

  return (
    <div className="relative group">
      {/* Animated Tangerine Ring with layoutId for smooth gliding selection */}
      {isSelected && !isClosed && (
        <motion.div
          layoutId={prefersReducedMotion ? undefined : "selectedServiceRing"}
          className="absolute -inset-1 rounded-[28px] border-2 border-brand-500 pointer-events-none z-10 shadow-warm-xs"
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        />
      )}

      <motion.button
        type="button"
        onClick={() => {
          if (!isClosed) onSelect(service);
        }}
        disabled={isClosed}
        whileHover={isClosed || prefersReducedMotion ? {} : { y: -4, rotate: -0.5 }}
        whileTap={isClosed || prefersReducedMotion ? {} : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`text-left w-full p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between min-h-[168px] relative select-none cursor-pointer ${
          isClosed
            ? 'bg-cream/40 border-line text-ink-muted cursor-not-allowed opacity-50 grayscale'
            : isSelected
            ? 'bg-brand-100/40 border-brand-500 shadow-warm-sm'
            : 'bg-surface border-line hover:border-forest-700/30 hover:shadow-warm-sm'
        }`}
      >
        {/* Top row */}
        <div className="flex items-start justify-between w-full">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-colors ${
              isClosed
                ? 'bg-line/40 text-ink-muted'
                : isSelected
                ? 'bg-brand-500 text-white shadow-warm-xs'
                : 'bg-forest-100 text-forest-700'
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>

          {isClosed ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-line/60 text-ink-muted">
              <Ban className="w-3 h-3" /> Closed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-cream border border-line text-ink">
              <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse" />
              <span className="tabular-nums font-bold">{service.waitingCount ?? 0}</span> waiting
            </span>
          )}
        </div>

        {/* Title & info */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold font-display uppercase tracking-widest px-2 py-0.5 rounded-md bg-forest-100 text-forest-700">
              Prefix {service.prefix}
            </span>
          </div>
          <h3 className={`font-display font-bold text-base leading-snug tracking-tight ${isClosed ? 'text-ink-muted' : 'text-ink'}`}>
            {service.name}
          </h3>
          <p className="text-xs text-ink-muted mt-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 opacity-70" />
            <span>~{service.avgServiceMinutes} min per customer</span>
          </p>
        </div>

        {/* Selected Indicator Pop-in Checkmark */}
        {isSelected && !isClosed && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, rotate: -20 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="absolute top-4 right-4 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-warm-xs z-20"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
