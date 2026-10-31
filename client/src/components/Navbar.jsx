import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Shield, LogIn, LogOut } from 'lucide-react';
import ConnectionIndicator from './ConnectionIndicator';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const isCurrent = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur-md border-b border-line transition-colors">
      <div className="max-w-5xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo with animated queue-dots mark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-forest-900 flex items-center justify-center text-cream shadow-warm-xs group-hover:bg-forest-700 transition duration-150">
            {/* Animated queue-dots mark */}
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-forest-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-forest-100/60" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-black text-xl sm:text-2xl text-ink tracking-tight">
              QueueLess
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-forest-100 text-forest-700">
              Live
            </span>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-1 bg-surface/80 p-1 rounded-2xl border border-line text-sm font-medium shadow-warm-xs">
            <Link
              to="/"
              className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-150 text-xs sm:text-sm font-medium ${
                isCurrent('/') ? 'text-ink font-semibold' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {isCurrent('/') && (
                <motion.div
                  layoutId={prefersReducedMotion ? undefined : 'navbar-pill'}
                  className="absolute inset-0 bg-cream border border-line/80 rounded-xl shadow-warm-xs -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              Book Token
            </Link>

            {user ? (
              <Link
                to="/admin"
                className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-150 flex items-center gap-1.5 text-xs sm:text-sm font-medium ${
                  isCurrent('/admin') ? 'text-ink font-semibold' : 'text-ink/60 hover:text-ink'
                }`}
              >
                {isCurrent('/admin') && (
                  <motion.div
                    layoutId={prefersReducedMotion ? undefined : 'navbar-pill'}
                    className="absolute inset-0 bg-cream border border-line/80 rounded-xl shadow-warm-xs -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Shield className="w-3.5 h-3.5 text-forest-700" />
                <span>Admin</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-150 flex items-center gap-1 text-xs sm:text-sm font-medium ${
                  isCurrent('/login') ? 'text-ink font-semibold' : 'text-ink/60 hover:text-ink'
                }`}
              >
                {isCurrent('/login') && (
                  <motion.div
                    layoutId={prefersReducedMotion ? undefined : 'navbar-pill'}
                    className="absolute inset-0 bg-cream border border-line/80 rounded-xl shadow-warm-xs -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <LogIn className="w-3.5 h-3.5 text-brand-500" />
                <span>Staff Login</span>
              </Link>
            )}
          </nav>

          <ConnectionIndicator />

          {/* User badge and logout if authenticated */}
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-line">
              <div className="text-right leading-none">
                <span className="block text-xs font-bold text-ink">
                  {user.name}
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-600 mt-0.5">
                  {user.role}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-ink/40 hover:text-rose-500 hover:bg-rose-100/60 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
