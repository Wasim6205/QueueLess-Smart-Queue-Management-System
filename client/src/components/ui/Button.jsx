import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-brand-500 hover:bg-brand-600 text-white shadow-warm-sm hover:shadow-warm-md border border-brand-600/10 focus:ring-brand-500/30',
  secondary:
    'bg-surface hover:bg-cream text-ink border border-line hover:border-ink/20 shadow-warm-xs focus:ring-brand-500/20',
  forest:
    'bg-forest-900 hover:bg-forest-700 text-white shadow-warm-sm hover:shadow-warm-md border border-forest-700/20 focus:ring-forest-700/30',
  ghost:
    'bg-transparent hover:bg-line/40 text-ink hover:text-ink focus:ring-brand-500/20',
  danger:
    'bg-rose-500 hover:bg-rose-600 text-white shadow-warm-xs focus:ring-rose-500/30',
  mint:
    'bg-mint-500 hover:bg-mint-600 text-white shadow-warm-xs focus:ring-mint-500/30',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-xl min-h-[36px]',
  md: 'px-4 py-2.5 text-sm rounded-2xl min-h-[44px]',
  lg: 'px-6 py-3.5 text-base rounded-2xl min-h-[50px] font-semibold',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon = null,
  type = 'button',
  onClick,
  ...props
}) {
  const prefersReducedMotion = useReducedMotion();
  const variantClasses = VARIANTS[variant] || VARIANTS.primary;
  const sizeClasses = SIZES[size] || SIZES.md;

  const content = (
    <>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </>
  );

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={prefersReducedMotion || disabled || loading ? {} : { y: -1 }}
      whileTap={prefersReducedMotion || disabled || loading ? {} : { scale: 0.98, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-cream disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {content}
    </motion.button>
  );
}

