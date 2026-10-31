import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { servicesApi, adminApi, getErrorMessage } from '../api/client';
import { useQueue } from '../hooks/useQueue';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import QueueList from '../components/QueueList';
import StatusPill from '../components/StatusPill';
import WalkInModal from '../components/WalkInModal';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/Toast';
import {
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  QrCode,
  UserPlus,
  Play,
  Check,
  SkipForward,
  RotateCcw,
  Loader2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Phone,
  Monitor,
  LogOut,
  Shield,
  UserCheck,
  Command,
  Keyboard,
  HelpCircle,
} from 'lucide-react';

function ElapsedTimer({ calledAt, avgServiceMinutes = 5 }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!calledAt) return;
    const calculate = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(calledAt).getTime()) / 1000));
      setElapsedSeconds(diff);
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [calledAt]);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const isStale = avgServiceMinutes > 0 && mins >= avgServiceMinutes * 2;
  const targetSeconds = (avgServiceMinutes || 5) * 60;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-forest-100/70 mb-1.5">
        <span className="font-mono flex items-center gap-1.5 tabular-nums font-semibold">
          <Clock className="w-3.5 h-3.5 text-mint-400" />
          Serving time: {mins}m {String(secs).padStart(2, '0')}s
        </span>
        {isStale ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-forest-900 border border-amber-400 animate-pulse font-display">
            Still in service?
          </span>
        ) : (
          <span className="text-[11px] text-forest-100/50">
            Target: ~{avgServiceMinutes}m
          </span>
        )}
      </div>

      {/* Progress Bar Against Average Service Duration */}
      <div className="w-full h-1.5 bg-forest-950/80 rounded-full overflow-hidden border border-forest-700/40">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            isStale ? 'bg-amber-400' : 'bg-mint-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const prefersReducedMotion = useReducedMotion();
  const { addToast } = useToast();
  const { user, logout } = useAuth();
  const isOwner = user?.role === 'owner';

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [loadingServices, setLoadingServices] = useState(true);

  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [processingTokenId, setProcessingTokenId] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    async function loadServices() {
      try {
        setLoadingServices(true);
        const list = await servicesApi.list();
        setServices(list);
        if (list.length > 0 && !selectedServiceId) {
          setSelectedServiceId(list[0]._id);
        }
      } catch (err) {
        addToast(getErrorMessage(err), 'error');
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, []);

  const { data: queueData, loading: queueLoading, error: queueError, refetch } = useQueue(selectedServiceId);

  const selectedService = services.find((s) => s._id === selectedServiceId) || queueData?.service;
  const nowServing = queueData?.nowServing;
  const waitingCount = queueData?.stats?.waiting ?? 0;
  const canCallNext = !nowServing && waitingCount > 0;

  const handleCallNext = async () => {
    if (!selectedServiceId) return;
    try {
      setActionLoading(true);
      const res = await adminApi.callNext(selectedServiceId);
      addToast(`Now serving token ${res.token.tokenCode}`, 'success');
      refetch();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteServing = async () => {
    if (!queueData?.nowServing?._id) return;
    try {
      setActionLoading(true);
      await adminApi.complete(queueData.nowServing._id);
      addToast(`Completed token ${queueData.nowServing.tokenCode}`, 'success');
      refetch();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipServing = async () => {
    if (!queueData?.nowServing?._id) return;
    try {
      setActionLoading(true);
      await adminApi.skip(queueData.nowServing._id);
      addToast(`Skipped token ${queueData.nowServing.tokenCode}`, 'info');
      refetch();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipWaiting = async (tokenId) => {
    try {
      setProcessingTokenId(tokenId);
      await adminApi.skip(tokenId);
      addToast('Customer skipped.', 'info');
      refetch();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setProcessingTokenId(null);
    }
  };

  const handleCancelWaiting = async (tokenId) => {
    try {
      setProcessingTokenId(tokenId);
      await adminApi.cancel(tokenId);
      addToast('Customer token cancelled.', 'info');
      refetch();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setProcessingTokenId(null);
    }
  };

  const handleToggleOpen = async () => {
    if (!selectedServiceId || !queueData?.service) return;
    const nextState = !queueData.service.isOpen;
    try {
      await adminApi.setOpen(selectedServiceId, nextState);
      addToast(
        nextState ? 'Online bookings are now OPEN.' : 'Online bookings are now CLOSED.',
        'info'
      );
      refetch();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const handleAddWalkinSubmit = async ({ customerName, phone }) => {
    await adminApi.addWalkin(selectedServiceId, { customerName, phone });
    addToast(`Walk-in customer ${customerName} added to the queue!`, 'success');
    refetch();
  };

  const handleResetQueue = async () => {
    if (!selectedServiceId) return;
    try {
      setActionLoading(true);
      await adminApi.resetQueue(selectedServiceId);
      addToast("Today's queue has been reset for this service.", 'success');
      setShowResetConfirm(false);
      refetch();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable);

      if (isInput || walkinModalOpen || showResetConfirm) {
        return;
      }

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        if (canCallNext && !actionLoading) {
          e.preventDefault();
          handleCallNext();
        }
      } else if (e.key === 'c' || e.key === 'C') {
        if (nowServing && !actionLoading) {
          e.preventDefault();
          handleCompleteServing();
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (nowServing && !actionLoading) {
          e.preventDefault();
          handleSkipServing();
        }
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setWalkinModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canCallNext, nowServing, actionLoading, walkinModalOpen, showResetConfirm]);

  const callNextDisabledReason = nowServing
    ? 'Complete or skip current customer first'
    : waitingCount === 0
    ? 'No customers waiting in line'
    : '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* User Session Bar */}
      <div className="bg-forest-900 text-cream rounded-3xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-warm-md border border-forest-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-forest-700/60 flex items-center justify-center text-brand-500 shadow-warm-xs">
            {isOwner ? <Shield className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm tracking-tight text-cream">
                {user?.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isOwner
                    ? 'bg-brand-500/20 text-brand-500 border border-brand-500/30'
                    : 'bg-mint-500/20 text-mint-400 border border-mint-500/30'
                }`}
              >
                {user?.role}
              </span>
            </div>
            <span className="text-xs text-forest-100/70">{user?.email}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Keyboard Shortcuts Trigger Button */}
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="px-3 py-2 rounded-xl bg-forest-800/80 hover:bg-forest-700 text-cream/80 hover:text-cream text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-forest-700/40"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-3.5 h-3.5 text-brand-500" />
            <span className="hidden sm:inline">Shortcuts</span>
            <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-forest-950 text-cream/70 font-mono font-bold">
              ?
            </kbd>
          </button>

          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-2 rounded-xl bg-forest-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-cream text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-forest-700/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Bento Service Tabs Switcher & Controls */}
      <div className="bg-surface rounded-4xl border border-line p-4 sm:p-5 shadow-warm-xs mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Service Tabs with layoutId animated glider */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            {services.map((svc) => {
              const isSelected = selectedServiceId === svc._id;
              return (
                <button
                  key={svc._id}
                  type="button"
                  onClick={() => setSelectedServiceId(svc._id)}
                  className={`relative px-4 py-2.5 rounded-2xl text-xs font-bold font-display transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                    isSelected ? 'text-white' : 'text-ink-muted hover:text-ink hover:bg-cream/60'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId={prefersReducedMotion ? undefined : "activeAdminTab"}
                      className="absolute inset-0 bg-brand-500 rounded-2xl shadow-warm-xs -z-10"
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-line/60 text-ink'
                  }`}>
                    {svc.prefix}
                  </span>
                  <span>{svc.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Controls: Open/Close, Walk-in, QR, TV */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-line">
            {/* Open / Closed Toggle Button (OWNER ONLY) */}
            {isOwner && queueData?.service && (
              <button
                type="button"
                onClick={handleToggleOpen}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold border transition cursor-pointer shadow-warm-xs ${
                  queueData.service.isOpen
                    ? 'bg-mint-100 text-forest-900 border-mint-500/30 hover:bg-mint-200/60'
                    : 'bg-rose-100 text-rose-900 border-rose-500/30 hover:bg-rose-200/60'
                }`}
              >
                {queueData.service.isOpen ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-mint-500" />
                    <span>Bookings Open</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-rose-500" />
                    <span>Booking Closed</span>
                  </>
                )}
              </button>
            )}

            <Button
              variant="forest"
              size="sm"
              onClick={() => setWalkinModalOpen(true)}
              icon={UserPlus}
            >
              Add Walk-in
            </Button>

            {selectedServiceId && (
              <>
                {isOwner && (
                  <Link to={`/qr/${selectedServiceId}`}>
                    <Button variant="secondary" size="sm" icon={QrCode}>
                      QR Poster
                    </Button>
                  </Link>
                )}
                <Link to={`/display?service=${selectedServiceId}`} target="_blank">
                  <Button variant="secondary" size="sm" icon={Monitor}>
                    Live TV
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {queueError && (
        <div className="mb-6 p-4 rounded-3xl bg-rose-100 border border-rose-200 text-rose-900 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{queueError}</span>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Waiting"
          value={queueData?.stats?.waiting ?? 0}
          icon={Clock}
          color="amber"
          sublabel="in line right now"
        />
        <StatCard
          label="Served Today"
          value={queueData?.stats?.completed ?? 0}
          icon={CheckCircle2}
          color="mint"
          sublabel="completed customers"
        />
        <StatCard
          label="Total Today"
          value={queueData?.stats?.totalToday ?? 0}
          icon={Users}
          color="brand"
          sublabel="booked + walk-ins"
        />
        <StatCard
          label="Avg Wait Time"
          value={`~${queueData?.service?.avgServiceMinutes ?? 5}m`}
          icon={Sparkles}
          color="forest"
          sublabel="per customer target"
        />
      </div>

      {/* Giant Bento Hero: Now Serving Panel */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-forest-900 text-cream rounded-4xl border border-forest-700/60 p-6 sm:p-8 shadow-warm-lg mb-8 relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Customer info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-forest-100/70 uppercase tracking-wider font-display">
                Currently Serving
              </span>
              {nowServing && <StatusPill status="serving" size="sm" />}
            </div>

            {nowServing ? (
              <div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-5xl sm:text-6xl font-display font-black text-mint-400 tracking-tight tabular-nums">
                    {nowServing.tokenCode}
                  </span>
                  <span className="text-2xl font-display font-bold text-cream">
                    {nowServing.customerName}
                  </span>
                  {nowServing.source === 'walkin' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-forest-900 font-display">
                      Walk-in
                    </span>
                  )}
                </div>

                {nowServing.phone && (
                  <p className="text-xs text-forest-100/60 mt-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{nowServing.phone}</span>
                  </p>
                )}

                <ElapsedTimer
                  calledAt={nowServing.calledAt}
                  avgServiceMinutes={queueData?.service?.avgServiceMinutes}
                />
              </div>
            ) : (
              <div>
                <div className="text-3xl sm:text-4xl font-display font-black text-forest-700 tabular-nums">
                  Counter Free
                </div>
                <p className="text-xs text-forest-100/60 mt-1">
                  Click &ldquo;Call Next Customer&rdquo; (or press <kbd className="px-1 py-0.5 rounded bg-forest-800 text-[10px] font-mono">N</kbd>) to call the next person in line.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {nowServing ? (
              <>
                <Button
                  variant="mint"
                  size="lg"
                  loading={actionLoading}
                  onClick={handleCompleteServing}
                  icon={Check}
                  className="shadow-warm-sm"
                >
                  Complete (C)
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  loading={actionLoading}
                  onClick={handleSkipServing}
                  icon={SkipForward}
                  className="shadow-warm-sm"
                >
                  Skip (S)
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <Button
                  variant="primary"
                  size="xl"
                  disabled={!canCallNext || actionLoading}
                  loading={actionLoading}
                  onClick={handleCallNext}
                  icon={Play}
                  className="shadow-warm-md"
                >
                  Call Next Customer (N)
                </Button>
                {!canCallNext && (
                  <span className="text-[11px] text-forest-100/60 italic">
                    {callNextDisabledReason}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Waiting Queue + Terminal History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Waiting List (2 cols) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2 font-display">
              Waiting Queue
              <span className="px-2.5 py-0.5 rounded-full bg-surface border border-line text-ink font-bold tabular-nums">
                {waitingCount}
              </span>
            </h2>
            <span className="text-xs text-ink-muted">
              ~<span className="tabular-nums font-semibold">{queueData?.service?.avgServiceMinutes ?? 5}</span>m avg per customer
            </span>
          </div>

          {queueLoading ? (
            <div className="p-8 text-center text-ink-muted">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              Loading queue…
            </div>
          ) : (
            <QueueList
              waitingTokens={queueData?.waiting || []}
              onSkip={handleSkipWaiting}
              onCancel={handleCancelWaiting}
              processingId={processingTokenId}
            />
          )}
        </div>

        {/* Recently Finished History (1 col) */}
        <div>
          <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-4 font-display">
            Recently Finished
          </h2>

          <div className="bg-surface rounded-3xl border border-line p-5 shadow-warm-xs">
            {queueData?.history?.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-6">
                No completed or skipped tokens yet today.
              </p>
            ) : (
              <div className="divide-y divide-line/60">
                {queueData?.history?.map((h) => (
                  <div
                    key={h._id}
                    className="py-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-display font-bold text-ink">
                        <span className="text-forest-700 tabular-nums">{h.tokenCode}</span>
                        <span>{h.customerName}</span>
                      </div>
                      {h.source === 'walkin' && (
                        <span className="text-[10px] text-amber-700 uppercase font-semibold">
                          walk-in
                        </span>
                      )}
                    </div>
                    <StatusPill status={h.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Demo Tools Section: Reset Queue (OWNER ONLY) */}
      {isOwner && (
        <div className="pt-6 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider font-display">
              Demo Tools (Owner Only)
            </h3>
            <p className="text-xs text-ink-muted">
              Clear all tokens and reset the counter for this service today.
            </p>
          </div>

          {showResetConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-800 font-semibold">Reset today&apos;s queue?</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={actionLoading}
                onClick={handleResetQueue}
              >
                Confirm Reset
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              icon={RotateCcw}
            >
              Reset Today&apos;s Queue
            </Button>
          )}
        </div>
      )}

      {/* Walk-in Customer Modal */}
      <WalkInModal
        isOpen={walkinModalOpen}
        onClose={() => setWalkinModalOpen(false)}
        onSubmit={handleAddWalkinSubmit}
        serviceName={selectedService?.name}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <Modal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        title="Keyboard Shortcuts"
      >
        <div className="space-y-3">
          <p className="text-xs text-ink-muted mb-4">
            Manage your counter at lightning speed using these keyboard shortcuts:
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-cream border border-line">
              <span className="text-xs font-semibold text-ink">Call Next Customer</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-surface border border-line font-mono text-xs font-bold text-ink shadow-xs">
                N
              </kbd>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-cream border border-line">
              <span className="text-xs font-semibold text-ink">Complete Serving Customer</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-surface border border-line font-mono text-xs font-bold text-ink shadow-xs">
                C
              </kbd>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-cream border border-line">
              <span className="text-xs font-semibold text-ink">Skip Serving Customer</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-surface border border-line font-mono text-xs font-bold text-ink shadow-xs">
                S
              </kbd>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-cream border border-line">
              <span className="text-xs font-semibold text-ink">Add Walk-in Customer</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-surface border border-line font-mono text-xs font-bold text-ink shadow-xs">
                W
              </kbd>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-cream border border-line">
              <span className="text-xs font-semibold text-ink">Toggle Shortcuts Menu</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-surface border border-line font-mono text-xs font-bold text-ink shadow-xs">
                ?
              </kbd>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowShortcutsModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
