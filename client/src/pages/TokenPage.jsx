import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useToken } from '../hooks/useToken';
import { tokensApi, getErrorMessage } from '../api/client';
import StatusPill from '../components/StatusPill';
import QueueVisualizer from '../components/QueueVisualizer';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/Toast';
import { playChime } from '../lib/audio';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  Sparkles,
  Loader2,
  BellRing,
  Volume2,
  VolumeX,
  Share2,
  Ticket,
} from 'lucide-react';

export default function TokenPage() {
  const { tokenId } = useParams();
  const { addToast } = useToast();

  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [chimeMuted, setChimeMuted] = useState(
    () => localStorage.getItem('queueless:chimeMuted') === 'true'
  );

  const prevStatusRef = useRef(null);

  const toggleChime = () => {
    setChimeMuted((prev) => {
      const next = !prev;
      localStorage.setItem('queueless:chimeMuted', String(next));
      addToast(next ? 'Turn chime muted' : 'Turn chime enabled', 'info');
      return next;
    });
  };

  const handleNotify = (notification) => {
    if (notification.type === 'NEXT') {
      addToast("You're next in line! Please head towards the counter.", 'alert', 'Next in Line');
      if (!chimeMuted) playChime();
    } else if (notification.type === 'CALLED') {
      addToast("It's your turn! Please proceed to the service counter.", 'success', 'Your Turn!');
      if (!chimeMuted) playChime();
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#2DBE7A', '#F2683C', '#1B4D3B', '#F2A93B'],
        });
      } catch (e) {}
    } else if (notification.type === 'SKIPPED') {
      addToast('Your token was skipped by staff.', 'error', 'Token Skipped');
    } else if (notification.type === 'COMPLETED') {
      addToast('Your service has been completed. Thank you!', 'success', 'Completed');
    } else if (notification.type === 'CANCELLED') {
      addToast('Your token has been cancelled.', 'info', 'Cancelled');
    }
  };

  const { data, loading, error, refetch } = useToken(tokenId, handleNotify);

  // Monitor status changes for celebration on serving
  useEffect(() => {
    if (data?.token?.status) {
      const currStatus = data.token.status;
      if (currStatus === 'serving' && prevStatusRef.current && prevStatusRef.current !== 'serving') {
        if (!chimeMuted) playChime();
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#2DBE7A', '#F2683C', '#1B4D3B', '#F2A93B'],
          });
        } catch (e) {}
      }
      prevStatusRef.current = currStatus;
    }
  }, [data?.token?.status, chimeMuted]);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await tokensApi.cancel(tokenId);
      addToast('Your token has been cancelled.', 'info');
      setShowCancelModal(false);
      refetch();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-4" />
        <p className="text-ink-muted text-sm font-medium">Connecting to live queue status…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-3xl bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-warm-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink mb-2">Token Not Found</h2>
        <p className="text-ink-muted text-sm mb-6 leading-relaxed">
          {error || 'This token may have expired or the link is invalid.'}
        </p>
        <Link to="/">
          <Button variant="primary" size="md" icon={ArrowLeft}>
            Book a New Token
          </Button>
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

  // Card theme styling according to state
  const getCardThemeClasses = () => {
    if (isServing) {
      return 'bg-mint-500 text-forest-900 border-mint-400 shadow-[0_0_40px_rgba(45,190,122,0.4)]';
    }
    if (isNext) {
      return 'bg-forest-900 text-cream border-amber-500 ring-2 ring-amber-500/60 shadow-[0_0_35px_rgba(242,169,59,0.3)]';
    }
    if (isWaiting) {
      return 'bg-forest-900 text-cream border-forest-700/80 shadow-warm-xl';
    }
    // Completed, skipped, or cancelled
    return 'bg-surface text-ink border-line shadow-warm-md';
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      {/* Top action row */}
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Book Another
        </Link>

        {/* Chime toggle button */}
        {(isWaiting || isServing) && (
          <button
            type="button"
            onClick={toggleChime}
            aria-label={chimeMuted ? 'Unmute chime alert' : 'Mute chime alert'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-surface border border-line text-ink-muted hover:text-ink shadow-warm-xs transition cursor-pointer"
          >
            {chimeMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[11px]">Chime muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-mint-500" />
                <span className="text-[11px]">Chime on</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Ticket-style Main Card */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className={`rounded-4xl border p-6 sm:p-8 text-center relative overflow-hidden transition-colors duration-300 ${getCardThemeClasses()}`}
      >
        {/* Scalloped Perforated Edge Notches (Authentic physical ticket aesthetic) */}
        <div className="absolute -left-3.5 top-36 w-7 h-7 rounded-full bg-cream border border-line pointer-events-none" />
        <div className="absolute -right-3.5 top-36 w-7 h-7 rounded-full bg-cream border border-line pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-5">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full font-display border ${
              isServing
                ? 'bg-forest-900/15 text-forest-900 border-forest-900/20'
                : isWaiting
                ? 'bg-forest-800 text-brand-500 border-forest-700/60'
                : 'bg-forest-100 text-forest-700 border-forest-700/20'
            }`}
          >
            {service?.name || 'Service'}
          </span>
          <StatusPill status={token.status} size="md" />
        </div>

        {/* Customer Name */}
        <div className="mb-2">
          <p
            className={`text-[11px] font-bold uppercase tracking-wider ${
              isServing ? 'text-forest-900/70' : isWaiting ? 'text-cream/60' : 'text-ink-muted'
            }`}
          >
            Customer
          </p>
          <h2
            className={`font-display text-2xl font-black tracking-tight mt-0.5 ${
              isServing ? 'text-forest-900' : isWaiting ? 'text-cream' : 'text-ink'
            }`}
          >
            {token.customerName}
          </h2>
        </div>

        {/* Giant Token Code Display */}
        <div className="my-5">
          <div
            className={`inline-flex items-center justify-center px-10 py-5 rounded-3xl border transition-all ${
              isServing
                ? 'bg-forest-900 text-cream border-forest-900 shadow-warm-md'
                : 'bg-forest-950/80 text-cream border-forest-700/60 shadow-warm-lg'
            }`}
          >
            <span
              className={`font-display font-black tracking-wider text-5xl sm:text-6xl drop-shadow-sm tabular-nums ${
                isServing ? 'text-mint-400' : isNext ? 'text-amber-400' : 'text-cream'
              }`}
            >
              {token.tokenCode || '---'}
            </span>
          </div>
        </div>

        {/* Dynamic State Alert Banners */}
        {isServing && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 rounded-3xl bg-forest-900 text-cream shadow-warm-md"
          >
            <div className="flex items-center justify-center gap-2 font-display font-black text-base sm:text-lg tracking-tight">
              <Sparkles className="w-5 h-5 text-mint-400 animate-pulse" />
              <span>It's Your Turn! Please proceed to the counter.</span>
            </div>
          </motion.div>
        )}

        {isNext && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 rounded-3xl bg-amber-500 text-forest-900 shadow-warm-md"
          >
            <div className="flex items-center justify-center gap-2 font-display font-bold text-sm tracking-tight">
              <BellRing className="w-4 h-4 animate-bounce" />
              <span>You're next in line! Please be ready at the waiting area.</span>
            </div>
          </motion.div>
        )}

        {/* Interactive Queue Visualizer (When waiting or serving) */}
        {(isWaiting || isServing) && (
          <QueueVisualizer
            peopleAhead={peopleAhead ?? 0}
            position={position ?? 1}
            isServing={isServing}
            isNext={isNext}
            nowServingCode={nowServing?.tokenCode || null}
          />
        )}

        {/* Live Metrics Grid (For Waiting & Serving) */}
        {(isWaiting || isServing) && (
          <>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-3">
              {/* Now Serving */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border text-center ${
                  isServing
                    ? 'bg-forest-900/10 border-forest-900/15 text-forest-900'
                    : 'bg-forest-950/60 border-forest-700/50 text-cream'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                    isServing ? 'text-forest-900/70' : 'text-cream/60'
                  }`}
                >
                  Now Serving
                </span>
                <span
                  className={`text-base sm:text-lg font-display font-black tabular-nums ${
                    isServing ? 'text-forest-900' : 'text-mint-400'
                  }`}
                >
                  {nowServing ? nowServing.tokenCode : 'None'}
                </span>
              </div>

              {/* People Ahead */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border text-center ${
                  isServing
                    ? 'bg-forest-900/10 border-forest-900/15 text-forest-900'
                    : 'bg-forest-950/60 border-forest-700/50 text-cream'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                    isServing ? 'text-forest-900/70' : 'text-cream/60'
                  }`}
                >
                  Ahead of You
                </span>
                <span
                  className={`text-base sm:text-lg font-display font-black tabular-nums ${
                    isServing ? 'text-forest-900' : 'text-cream'
                  }`}
                >
                  {isServing ? '0' : <AnimatedNumber value={peopleAhead ?? 0} />}
                </span>
              </div>

              {/* Estimated Wait */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border text-center ${
                  isServing
                    ? 'bg-forest-900/10 border-forest-900/15 text-forest-900'
                    : 'bg-forest-950/60 border-forest-700/50 text-cream'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                    isServing ? 'text-forest-900/70' : 'text-cream/60'
                  }`}
                >
                  Est. Wait
                </span>
                <span
                  className={`text-base sm:text-lg font-display font-black tabular-nums ${
                    isServing ? 'text-forest-900' : 'text-brand-500'
                  }`}
                >
                  {isServing ? '0 min' : `~${etaMinutes ?? 0} min`}
                </span>
              </div>
            </div>

            {/* Disclaimer under wait tile */}
            <p
              className={`text-[11px] italic mb-6 ${
                isServing ? 'text-forest-900/70' : 'text-cream/60'
              }`}
            >
              * Estimated time. Actual wait may vary.
            </p>
          </>
        )}

        {/* Tasteful Terminal States */}
        {isCompleted && (
          <div className="py-4">
            <div className="w-14 h-14 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center mx-auto mb-3 shadow-warm-xs">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-lg text-ink">Service Completed</h3>
            <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto leading-relaxed">
              Thank you for visiting! We hope you had a fast and pleasant experience.
            </p>
            <div className="mt-6">
              <Link to="/">
                <Button variant="primary" size="md">
                  Book Another Token
                </Button>
              </Link>
            </div>
          </div>
        )}

        {isSkipped && (
          <div className="py-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-3 shadow-warm-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-lg text-rose-900">Your Token Was Skipped</h3>
            <p className="text-xs text-rose-700 mt-1 max-w-sm mx-auto leading-relaxed">
              You were not present when your token was called. Please check with staff at the counter or generate a new token.
            </p>
            <div className="mt-6">
              <Link to="/">
                <Button variant="danger" size="md">
                  Book Again
                </Button>
              </Link>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="py-4">
            <div className="w-14 h-14 rounded-full bg-line text-ink-muted flex items-center justify-center mx-auto mb-3 shadow-warm-xs">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-lg text-ink">Token Cancelled</h3>
            <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto leading-relaxed">
              This token has been cancelled and removed from the active queue.
            </p>
            <div className="mt-6">
              <Link to="/">
                <Button variant="secondary" size="md">
                  Book a New Token
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Cancel Action Button (Only visible when token is waiting) */}
        {isWaiting && (
          <div className="pt-4 border-t border-forest-700/40">
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="text-xs font-semibold text-cream/70 hover:text-rose-400 transition flex items-center justify-center gap-1.5 mx-auto min-h-[36px] cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel My Token</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Your Token?"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm text-ink-muted mb-6 leading-relaxed">
            Are you sure you want to leave the queue? If you cancel, you will lose your spot (#
            {position || 1}) and will need to book a new token.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              Keep My Spot
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={cancelling}
              onClick={handleCancel}
            >
              Yes, Cancel Token
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
