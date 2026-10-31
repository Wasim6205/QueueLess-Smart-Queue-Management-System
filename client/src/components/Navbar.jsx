import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, Shield, Sparkles } from 'lucide-react';
import ConnectionIndicator from './ConnectionIndicator';

export default function Navbar() {
  const location = useLocation();

  const isCurrent = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
              QueueLess
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                MVP
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-sm font-medium">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isCurrent('/')
                  ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Book Token
            </Link>
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                isCurrent('/admin')
                  ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          </nav>

          <ConnectionIndicator />
        </div>
      </div>
    </header>
  );
}

