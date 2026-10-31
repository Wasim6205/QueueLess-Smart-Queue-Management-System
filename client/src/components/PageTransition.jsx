import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { springTransition } from '../lib/motion';

export default function PageTransition({ children, className = '' }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={springTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

