import React from 'react';
import { motion } from 'framer-motion';

export default function TokenBadge({ tokenCode, className = '' }) {
  return (
    <motion.div
      key={tokenCode}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`relative inline-flex items-center justify-center px-8 py-5 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-lg shadow-indigo-500/20 ${className}`}
    >
      <span className="font-extrabold tracking-wider text-4xl sm:text-5xl drop-shadow-sm font-mono">
        {tokenCode || '---'}
      </span>
    </motion.div>
  );
}

