import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  className = '',
}) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <span className={`inline-flex items-baseline tabular-nums ${className}`}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(displayValue)}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="inline-block"
        >
          {displayValue}
        </motion.span>
      </AnimatePresence>
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  );
}

