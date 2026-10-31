import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToken } from '../hooks/useToken';
import { tokensApi, getErrorMessage } from '../api/client';
import StatusPill from '../components/StatusPill';
import TokenBadge from '../components/TokenBadge';
import { useToast } from '../components/Toast';
import {
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  Sparkles,
  Loader2,
  BellRing,
} from 'lucide-react';

export default function TokenPage() {
  const { tokenId } = useParams();
  const { addToast } = useToast();

  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data, loading, error, refetch } = useToken(tokenId, (notification) => {
    if (notification.type === 'NEXT') {
      addToast("You're next in line! Please head towards the counter.", 'alert', 'Next in Line');
    } else if (notification.type === 'CALLED') {
      addToast("It's your turn! Please proceed to the service counter.", 'success', 'Your Turn!');
    } else if (notification.type === 'SKIPPED') {
      addToast('Your token was skipped by staff.', 'error', 'Token Skipped');
    } else if (notification.type === 'COMPLETED') {
      addToast('Your service has been completed. Thank you!', 'success', 'Completed');
    } else if (notification.type === 'CANCELLED') {
      addToast('Your token has been cancelled.', 'info', 'Cancelled');
    }
  });

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await tokensApi.cancel(tokenId);
      addToast('Your token has been cancelled.', 'info');
      setShowCancelConfirm(false);
      refetch();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading your live token status…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Token Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">
          {error || 'This token may have expired or the link is invalid.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Book a New Token
        </Link>
      </div>
    );
  }

  const { token, service, peopleAhead, position, etaMinutes, nowServing } = data;
  const isWaiting = token.status === 'waiting';
  const isServing = token.status === 'serving';
  const isCompleted = token.status === 'completed';
  const isSkipped = token.status === 'skipped';
  const isCancelled = token.status === 'cancelled';
  const isNext = isWaiting && (peopleAhead === 0 || peopleAhead === 1);

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      {/* Back Link */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Book Another Token
        </Link>
      </div>

      {/* Main Token Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
        {/* Top status indicator & Service name */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {service?.name || 'Service'}
          </span>
          <StatusPill status={token.status} size="md" />
        </div>

        {/* Customer greeting */}
        <div className="mb-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Customer
          </p>
          <h2 className="text-xl font-bold text-slate-800">{token.customerName}</h2>
        </div>

        {/* Token Badge */}
        <div className="my-6">
          <TokenBadge tokenCode={token.tokenCode} />
        </div>

        {/* Dynamic Status Banners */}
        {isServing && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 animate-pulse">
            <div className="flex items-center justify-center gap-2 font-bold text-base">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>It's Your Turn! Please proceed to the counter.</span>
            </div>
          </div>
        )}

        {isNext && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900">
            <div className="flex items-center justify-center gap-2 font-bold text-sm">
              <BellRing className="w-4 h-4 text-indigo-600" />
              <span>You're Next! Please head towards the waiting area.</span>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="mb-6 p-5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700">
            <CheckCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h3 className="font-bold text-base text-slate-900">Service Completed</h3>
            <p className="text-xs text-slate-500 mt-1">
              Thank you for visiting! We hope you had a pleasant experience.
            </p>
            <div className="mt-4">
              <Link
                to="/"
                className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
              >
                Book Another Token
              </Link>
            </div>
          </div>
        )}

        {isSkipped && (
          <div className="mb-6 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h3 className="font-bold text-base text-rose-900">Your Token Was Skipped</h3>
            <p className="text-xs text-rose-600 mt-1">
              Please speak with staff at the counter or generate a new token.
            </p>
            <div className="mt-4">
              <Link
                to="/"
                className="inline-block px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
              >
                Book Again
              </Link>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="mb-6 p-5 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-700">
            <XCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <h3 className="font-bold text-base text-zinc-900">Token Cancelled</h3>
            <p className="text-xs text-zinc-500 mt-1">
              This token has been cancelled.
            </p>
            <div className="mt-4">
              <Link
                to="/"
                className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
              >
                Book a New Token
              </Link>
            </div>
          </div>
        )}

        {/* Live Metrics Grid (For Waiting & Serving) */}
        {(isWaiting || isServing) && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Now Serving */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Now Serving
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-emerald-600">
                  {nowServing ? nowServing.tokenCode : 'None'}
                </span>
              </div>

              {/* People Ahead */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Ahead of You
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-800">
                  {isServing ? '0' : peopleAhead ?? '—'}
                </span>
              </div>

              {/* Estimated Wait */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Est. Wait
                </span>
                <span className="text-base sm:text-lg font-bold text-indigo-600">
                  {isServing ? '0 min' : `~${etaMinutes ?? 0} min`}
                </span>
              </div>
            </div>

            {/* Disclaimer under wait tile */}
            <p className="text-[11px] text-slate-400 italic mb-6">
              * Estimated time. Actual wait may vary.
            </p>
          </>
        )}

        {/* Progress Stepper */}
        {(isWaiting || isServing) && (
          <div className="mb-6 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span className={isWaiting ? 'text-indigo-600' : 'text-slate-400'}>
                1. In Queue (#{position || 1})
              </span>
              <span className={isNext ? 'text-indigo-600 font-bold' : 'text-slate-400'}>
                2. Next Up
              </span>
              <span className={isServing ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                3. Serving
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isServing
                    ? 'w-full bg-emerald-500'
                    : isNext
                    ? 'w-2/3 bg-indigo-600'
                    : 'w-1/3 bg-amber-400'
                }`}
              />
            </div>
          </div>
        )}

        {/* Cancel Action (Only when waiting) */}
        {isWaiting && (
          <div className="pt-4 border-t border-slate-100">
            {showCancelConfirm ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center animate-in fade-in">
                <p className="text-xs font-semibold text-rose-800 mb-3">
                  Are you sure you want to cancel your token?
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 min-h-[36px]"
                  >
                    Keep Token
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition flex items-center gap-1 min-h-[36px]"
                  >
                    {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Yes, Cancel Token
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="text-xs font-medium text-slate-400 hover:text-rose-600 transition flex items-center justify-center gap-1 mx-auto min-h-[36px]"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel My Token
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

