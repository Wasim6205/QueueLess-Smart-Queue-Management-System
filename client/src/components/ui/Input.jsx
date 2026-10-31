import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';

export default function Input({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  error = '',
  isValid = false,
  icon: Icon = null,
  rightElement = null,
  className = '',
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`relative flex flex-col ${className}`}>
      <div
        className={`relative flex items-center rounded-2xl border transition-all duration-200 bg-surface ${
          error
            ? 'border-rose-500 ring-2 ring-rose-500/10'
            : isValid
            ? 'border-mint-500/80 ring-2 ring-mint-500/10'
            : isFocused
            ? 'border-brand-500 ring-2 ring-brand-500/15'
            : 'border-line hover:border-ink/20'
        }`}
      >
        {Icon && (
          <div className="pl-4 pr-1 text-ink/40 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <div className="relative flex-1 py-1">
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFloating ? placeholder : ''}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`w-full px-4 pt-5 pb-2 text-sm text-ink bg-transparent focus:outline-none transition-all placeholder:text-ink/30 font-medium ${
              Icon ? 'pl-2' : ''
            }`}
            {...props}
          />

          <label
            htmlFor={id}
            className={`absolute left-4 pointer-events-none transition-all duration-150 tracking-tight font-medium ${
              Icon ? 'left-2' : ''
            } ${
              isFloating
                ? 'top-1.5 text-[11px] font-semibold uppercase tracking-wider'
                : 'top-3.5 text-sm font-normal'
            } ${
              error
                ? 'text-rose-500'
                : isValid
                ? 'text-mint-500'
                : isFocused
                ? 'text-brand-500'
                : 'text-ink/50'
            }`}
          >
            {label}
            {required && <span className="text-brand-500 ml-0.5">*</span>}
          </label>
        </div>

        {/* Validation icon / right element */}
        <div className="pr-3.5 flex items-center gap-1.5">
          {isValid && !error && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full bg-mint-100 text-mint-500 flex items-center justify-center"
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </motion.div>
          )}
          {rightElement}
        </div>
      </div>

      {/* Inline error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1 text-xs text-rose-500 font-medium mt-1.5 ml-1"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

