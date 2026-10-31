import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import Button from './ui/Button';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
        <p className="text-sm text-ink-muted font-medium">Verifying authorization…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-surface rounded-3xl border border-line shadow-warm-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink mb-1.5">403 — Access Denied</h2>
        <p className="text-sm text-ink-muted mb-6 leading-relaxed">
          You are signed in as <span className="font-semibold text-ink capitalize">{user.role}</span> ({user.email}), which does not have permission to access this section.
        </p>
        <Link to="/admin">
          <Button variant="forest" size="md" icon={ArrowLeft}>
            Return to Admin
          </Button>
        </Link>
      </div>
    );
  }

  return children;
}
