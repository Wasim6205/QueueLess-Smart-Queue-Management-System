import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const prefersReducedMotion = useReducedMotion();
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type, title, createdAt: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Position: bottom-center on mobile, top-right on desktop */}
      <div className="fixed z-50 pointer-events-none flex flex-col gap-2.5 max-w-sm w-full p-4 bottom-4 left-1/2 -translate-x-1/2 sm:bottom-auto sm:left-auto sm:translate-x-0 sm:top-5 sm:right-5">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout={!prefersReducedMotion}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.94 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className={`pointer-events-auto p-4 rounded-3xl shadow-warm-lg border flex flex-col gap-2 relative overflow-hidden backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-surface border-mint-500/30 text-forest-900'
                  : toast.type === 'error'
                  ? 'bg-surface border-rose-500/30 text-rose-900'
                  : toast.type === 'alert'
                  ? 'bg-forest-900 border-forest-700 text-cream'
                  : 'bg-surface border-line text-ink'
              }`}
            >
              <div className="flex items-start gap-3">
                {toast.type === 'success' && (
                  <div className="w-6 h-6 rounded-full bg-mint-100 text-mint-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {toast.type === 'error' && (
                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {toast.type === 'alert' && (
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-4 h-4 text-brand-500" />
                  </div>
                )}
                {toast.type === 'info' && (
                  <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                )}

                <div className="flex-1 text-xs sm:text-sm">
                  {toast.title && (
                    <div className="font-display font-bold mb-0.5 tracking-tight">
                      {toast.title}
                    </div>
                  )}
                  <div className="leading-snug font-medium opacity-90">{toast.message}</div>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss toast"
                  className="opacity-50 hover:opacity-100 p-1 rounded-lg transition shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toast Auto-dismiss progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4.5, ease: 'linear' }}
                className={`h-0.5 absolute bottom-0 left-0 ${
                  toast.type === 'success'
                    ? 'bg-mint-500'
                    : toast.type === 'error'
                    ? 'bg-rose-500'
                    : toast.type === 'alert'
                    ? 'bg-brand-500'
                    : 'bg-forest-700'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { addToast: (msg) => console.log('[Toast]', msg) };
  }
  return ctx;
}
