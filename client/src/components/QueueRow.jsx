import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Phone, SkipForward, XCircle } from 'lucide-react';

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
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
    >
      {/* Left: Code, Name, Source badge, Phone */}
      <div className="flex items-center gap-3.5">
        <div className="w-16 h-11 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-mono font-bold text-indigo-700 text-sm">
          {token.tokenCode}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">
              {token.customerName}
            </span>
            {token.source === 'walkin' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                Walk-in
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {maskPhone(token.phone)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-slate-600">
              #{token.position} in line
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              est. ~{token.etaMinutes}m
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
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200 transition text-xs font-medium flex items-center gap-1 disabled:opacity-50 min-h-[36px]"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip
        </button>
        <button
          type="button"
          onClick={() => onCancel(token._id)}
          disabled={isProcessing}
          title="Cancel this token"
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition text-xs font-medium flex items-center gap-1 disabled:opacity-50 min-h-[36px]"
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

