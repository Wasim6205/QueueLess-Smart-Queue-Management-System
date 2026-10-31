import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function EmptyState({
  title = 'No customers waiting',
  description = 'The line is clear right now. Enjoy the quiet moment or add a walk-in.',
  action = null,
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="text-center py-12 px-6 rounded-3xl border border-dashed border-line bg-surface/50 flex flex-col items-center justify-center">
      {/* Animated SVG illustration */}
      <div className="w-20 h-20 mb-4 rounded-3xl bg-forest-100/50 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-forest-700"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Animated 3 dots in queue */}
          <motion.circle
            cx="14"
            cy="24"
            r="4"
            className="fill-forest-700"
            animate={prefersReducedMotion ? {} : { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="24"
            cy="24"
            r="4"
            className="fill-brand-500"
            animate={prefersReducedMotion ? {} : { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="34"
            cy="24"
            r="4"
            className="fill-mint-500"
            animate={prefersReducedMotion ? {} : { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }}
          />
          <path
            d="M8 36H40"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-line"
          />
        </svg>
      </div>

      <h3 className="font-display font-bold text-lg text-ink mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-ink/60 max-w-sm mx-auto mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
