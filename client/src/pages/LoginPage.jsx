import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Users,
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const from =
    location.state?.from?.pathname ||
    new URLSearchParams(location.search).get('redirect') ||
    '/admin';

  if (user) {
    return <Navigate to={from} replace />;
  }

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      triggerShake();
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      triggerShake();
      return;
    }

    try {
      setLoading(true);
      await login(cleanEmail, password);
      navigate(from, { replace: true });
    } catch (err) {
      triggerShake();
      const errCode = err.response?.data?.error?.code;
      if (errCode === 'INVALID_CREDENTIALS') {
        setError('Invalid email or password.');
      } else if (errCode === 'TOO_MANY_ATTEMPTS') {
        setError('Too many failed login attempts. Please wait 15 minutes before trying again.');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'owner') {
      setEmail('owner@queueless.com');
      setPassword('OwnerSecurePass123!');
    } else {
      setEmail('staff@queueless.com');
      setPassword('StaffSecurePass123!');
    }
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl bg-surface rounded-4xl border border-line shadow-warm-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Dark Forest Brand Experience Panel (Hidden on tiny screens, prominent on md+) */}
        <div className="hidden md:flex flex-col justify-between bg-forest-900 text-cream p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle ambient decorative gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-mint-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-forest-700/80 flex items-center justify-center text-cream shadow-warm-xs">
                <Sparkles className="w-5 h-5 text-brand-500" />
              </div>
              <span className="font-display font-black text-2xl text-cream tracking-tight">
                QueueLess
              </span>
            </Link>

            <div className="mt-12 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-800 text-brand-500 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Staff Portal
              </div>
              <h2 className="font-display text-3xl font-black text-cream tracking-tight leading-tight">
                Manage your queues with ease and precision.
              </h2>
              <p className="text-xs text-forest-100/70 leading-relaxed max-w-sm">
                Control counter operations, call next customers, log walk-ins, and keep your waiting lobby stress-free.
              </p>
            </div>
          </div>

          {/* Features list */}
          <div className="my-8 space-y-4 relative z-10">
            <div className="flex items-center gap-3 text-xs text-forest-100/90 font-medium">
              <div className="w-7 h-7 rounded-xl bg-forest-800 flex items-center justify-center text-mint-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <span>Instant real-time WebSocket counter updates</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-forest-100/90 font-medium">
              <div className="w-7 h-7 rounded-xl bg-forest-800 flex items-center justify-center text-brand-500 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span>Walk-in support with automatic atomic ticketing</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-forest-100/90 font-medium">
              <div className="w-7 h-7 rounded-xl bg-forest-800 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>Role-based access for Owners and Staff</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[11px] text-forest-100/50 pt-4 border-t border-forest-700/60 relative z-10">
            QueueLess • Smart Virtual Queue Management
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Mobile Header (Only on small screens) */}
            <div className="md:hidden mb-6 flex items-center justify-between">
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-forest-900 flex items-center justify-center text-cream">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                </div>
                <span className="font-display font-black text-xl text-ink">QueueLess</span>
              </Link>
            </div>

            <div className="mb-6">
              <h1 className="font-display text-2xl font-black text-ink tracking-tight">
                Staff Sign In
              </h1>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Enter your credentials to manage queues and counter calling.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 rounded-2xl bg-rose-100 border border-rose-200 text-rose-900 text-xs font-medium flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.form
              onSubmit={handleSubmit}
              animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <Input
                id="login-email"
                label="Email Address"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="staff@queueless.com"
                icon={Mail}
              />

              <Input
                id="login-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••••••"
                icon={Lock}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-ink/40 hover:text-ink transition cursor-pointer p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  disabled={loading}
                  className="w-full shadow-warm-md"
                >
                  Sign In to Dashboard
                </Button>
              </div>
            </motion.form>

            {/* Quick Demo Autofill */}
            <div className="mt-6 pt-5 border-t border-line">
              <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider text-center mb-2.5">
                Quick Demo Autofill
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('owner')}
                  className="flex-1 py-2 px-3 rounded-2xl border border-line bg-cream hover:bg-forest-100 hover:border-forest-700/30 text-ink text-xs font-semibold transition text-center cursor-pointer shadow-warm-xs"
                >
                  Owner Demo
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('staff')}
                  className="flex-1 py-2 px-3 rounded-2xl border border-line bg-cream hover:bg-forest-100 hover:border-forest-700/30 text-ink text-xs font-semibold transition text-center cursor-pointer shadow-warm-xs"
                >
                  Staff Demo
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Customer Booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
