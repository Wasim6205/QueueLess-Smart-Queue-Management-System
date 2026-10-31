import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { User, Sparkles, Check, ArrowLeft, Store } from 'lucide-react';

export default function QueueVisualizer({
  peopleAhead = 0,
  position = 1,
  isServing = false,
  isNext = false,
  nowServingCode = null,
}) {
  const prefersReducedMotion = useReducedMotion();
  // Determine how many dots to render for people ahead
  // Max 4 dots to keep it crisp on mobile screens
  const maxRenderedAhead = 4;
  const countAhead = Math.max(0, peopleAhead);
  const showTruncated = countAhead > maxRenderedAhead;
  const renderedAheadCount = showTruncated ? 3 : countAhead;

  const aheadItems = Array.from({ length: renderedAheadCount }, (_, i) => ({
    id: `ahead-${i}`,
    label: `#${i + 1}`,
  }));

  return (
    <div className="w-full bg-forest-950/70 border border-forest-700/50 rounded-3xl p-4 sm:p-6 my-6 shadow-inner text-cream">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-cream/70 mb-4 pb-2 border-b border-forest-700/40">
        <span className="flex items-center gap-1.5 font-display uppercase tracking-wider text-[11px]">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          Live Queue Progress
        </span>
        <span className="tabular-nums">
          {isServing
            ? 'Serving now'
            : isNext
            ? "You're next!"
            : `${countAhead} ${countAhead === 1 ? 'person' : 'people'} ahead`}
        </span>
      </div>

      {/* Visual Track */}
      <div className="relative flex items-center justify-between gap-2 sm:gap-3 py-4 overflow-x-auto no-scrollbar">
        {/* Service Counter Desk (Left) */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border transition-all ${
              isServing
                ? 'bg-mint-500 text-forest-900 border-mint-400 ring-4 ring-mint-500/30 shadow-[0_0_20px_rgba(45,190,122,0.4)]'
                : 'bg-forest-900 text-cream/80 border-forest-700'
            }`}
          >
            <Store className="w-5 h-5 mb-0.5" />
            <span className="text-[9px] font-black uppercase tracking-tighter">Desk</span>
          </div>
          <span className="text-[10px] font-bold text-cream/60 mt-1.5 font-display">
            {nowServingCode ? (
              <span className="text-mint-400 font-black tabular-nums">{nowServingCode}</span>
            ) : (
              'Counter'
            )}
          </span>
        </div>

        {/* Direction Flow Arrow towards Counter */}
        <div className="flex items-center text-forest-700 shrink-0">
          <ArrowLeft className="w-4 h-4 animate-pulse" />
        </div>

        {/* Queue Line Avatars */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-start">
          <AnimatePresence mode="popLayout">
            {/* If Serving: You are at the desk */}
            {isServing ? (
              <motion.div
                key="you-serving"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-mint-500/20 border border-mint-500/40 text-mint-300 text-xs font-bold"
              >
                <Sparkles className="w-4 h-4 text-mint-400" />
                <span>You are currently being served!</span>
              </motion.div>
            ) : (
              <>
                {/* People Ahead Dots */}
                {aheadItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout={!prefersReducedMotion}
                    initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0, x: 20 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0, x: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="flex flex-col items-center shrink-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-forest-800 border border-forest-700 flex items-center justify-center text-cream/60 text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-semibold text-cream/50 mt-1 tabular-nums">
                      {idx + 1}
                    </span>
                  </motion.div>
                ))}

                {/* Truncated pill if many ahead */}
                {showTruncated && (
                  <motion.div
                    layout={!prefersReducedMotion}
                    className="flex flex-col items-center shrink-0 px-2 py-1 rounded-xl bg-forest-800/80 border border-forest-700/60 text-[10px] font-bold text-cream/70"
                  >
                    +{countAhead - maxRenderedAhead + 1} more
                  </motion.div>
                )}

                {/* "YOU" Avatar */}
                <motion.div
                  key="you-token"
                  layout={!prefersReducedMotion}
                  initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0, x: 20 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="flex flex-col items-center shrink-0 relative"
                >
                  {/* Floating "YOU" Pill */}
                  <motion.div
                    animate={isNext && !prefersReducedMotion ? { y: [-2, 2, -2] } : {}}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className={`absolute -top-6 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-warm-xs ${
                      isNext
                        ? 'bg-amber-500 text-forest-900 ring-2 ring-amber-400'
                        : 'bg-brand-500 text-white'
                    }`}
                  >
                    You
                  </motion.div>

                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-warm-xs transition-all ${
                      isNext
                        ? 'bg-amber-500 text-forest-900 ring-4 ring-amber-500/40'
                        : 'bg-brand-500 text-white ring-4 ring-brand-500/30'
                    }`}
                  >
                    <User className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1 tabular-nums font-display ${
                      isNext ? 'text-amber-400 font-black' : 'text-brand-500'
                    }`}
                  >
                    #{position}
                  </span>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

