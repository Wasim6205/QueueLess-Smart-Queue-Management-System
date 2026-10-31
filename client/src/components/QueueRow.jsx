import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock, Phone, SkipForward, XCircle } from 'lucide-react';
import { springTransition } from '../lib/motion';

function maskPhone(phone) {
  if (!phone || phone.length < 10) return phone || '—';
  return `${phone.slice(0, 2)}XXXXXX${phone.slice(8)}`;
}

export default function QueueRow({
  token,
  onSkip,
  onCancel,
  isProcessing = false,
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      layout={!prefersReducedMotion}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={springTransition}
      className="p-4 rounded-2xl border border-line bg-surface hover:border-forest-700/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-warm-xs"
    >
      {/* Left: Code, Name, Source badge, Phone */}
      <div className="flex items-center gap-3.5">
        <div className="w-16 h-11 rounded-xl bg-forest-100 border border-forest-700/20 flex items-center justify-center font-display font-bold text-forest-900 text-sm tabular-nums shadow-xs">
          {token.tokenCode}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-ink text-sm">
              {token.customerName}
            </span>
            {token.source === 'walkin' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-500/20">
                Walk-in
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-ink-muted/70" />
              <span className="tabular-nums">{maskPhone(token.phone)}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-ink">
              #{token.position} in line
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-ink-muted">
              <Clock className="w-3 h-3 text-ink-muted/70" />
              est. ~<span className="tabular-nums">{token.etaMinutes}</span>m
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 self-end sm:self-center">
        <button
          type="button"
          onClick={() => onSkip(token._id)}
          disabled={isProcessing}
          title="Skip this customer"
          className="px-3 py-1.5 rounded-xl border border-line text-ink-muted hover:text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 min-h-[36px] cursor-pointer"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip
        </button>
        <button
          type="button"
          onClick={() => onCancel(token._id)}
          disabled={isProcessing}
          title="Cancel this token"
          className="px-3 py-1.5 rounded-xl border border-line text-ink-muted hover:text-rose-800 hover:bg-rose-100 hover:border-rose-300 transition text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 min-h-[36px] cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
