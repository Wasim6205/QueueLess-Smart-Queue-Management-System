import React from 'react';
import { motion } from 'framer-motion';

export default function TokenBadge({ tokenCode, className = '' }) {
  return (
    <motion.div
      key={tokenCode}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`relative inline-flex items-center justify-center px-10 py-6 rounded-3xl bg-forest-900 border border-forest-700/60 text-cream shadow-warm-lg ${className}`}
    >
      <span className="font-display font-black tracking-wider text-5xl sm:text-6xl drop-shadow-sm tabular-nums text-cream">
        {tokenCode || '---'}
      </span>
    </motion.div>
  );
}
