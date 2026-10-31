import React from 'react';
import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = false,
  ...props
}) {
  const variants = {
    default: 'bg-surface border border-line text-ink shadow-warm-sm',
    cream: 'bg-cream/60 border border-line text-ink',
    forest: 'bg-forest-900 border border-forest-700/40 text-cream shadow-warm-md',
    interactive:
      'bg-surface border border-line text-ink shadow-warm-sm hover:shadow-warm-md hover:border-forest-700/30 transition-all duration-200 cursor-pointer',
  };

  const cardStyle = variants[variant] || variants.default;

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 ${cardStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

