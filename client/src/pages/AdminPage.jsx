import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { servicesApi, adminApi, getErrorMessage } from '../api/client';
import { useQueue } from '../hooks/useQueue';
import StatCard from '../components/StatCard';
import QueueList from '../components/QueueList';
import StatusPill from '../components/StatusPill';
import WalkInModal from '../components/WalkInModal';
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
} from 'lucide-react';

export default function AdminPage() {
  const { addToast } = useToast();

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [loadingServices, setLoadingServices] = useState(true);

  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [processingTokenId, setProcessingTokenId] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Fetch list of services
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

  // Live queue data hook
  const { data: queueData, loading: queueLoading, error: queueError, refetch } = useQueue(selectedServiceId);

  // Handlers
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

  const selectedService = services.find((s) => s._id === selectedServiceId) || queueData?.service;
  const nowServing = queueData?.nowServing;
  const waitingCount = queueData?.stats?.waiting ?? 0;
  const canCallNext = !nowServing && waitingCount > 0;

  const callNextDisabledReason = nowServing
    ? 'Complete or skip current customer first'
    : waitingCount === 0
    ? 'No customers waiting in line'
    : '';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Bar: Service Selector + Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Service Dropdown & Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Service:
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            disabled={loadingServices}
            className="px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 min-w-[200px]"
          >
            {services.map((svc) => (
              <option key={svc._id} value={svc._id}>
                [{svc.prefix}] {svc.name}
              </option>
            ))}
          </select>

          {/* Open / Closed Toggle Button */}
          {queueData?.service && (
            <button
              type="button"
              onClick={handleToggleOpen}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                queueData.service.isOpen
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              {queueData.service.isOpen ? (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                  <span>Accepting Bookings</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-rose-600" />
                  <span>Booking Closed</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Action Buttons: Add Walk-in & QR poster */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWalkinModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm min-h-[40px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Walk-in</span>
          </button>

          {selectedServiceId && (
            <Link
              to={`/qr/${selectedServiceId}`}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm min-h-[40px]"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
              <span>Get QR Poster</span>
            </Link>
          )}
        </div>
      </div>

      {queueError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{queueError}</span>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Today"
          value={queueData?.stats?.totalToday ?? 0}
          icon={Users}
          color="indigo"
        />
        <StatCard
          label="Waiting"
          value={queueData?.stats?.waiting ?? 0}
          icon={Clock}
          color="amber"
        />
        <StatCard
          label="Completed"
          value={queueData?.stats?.completed ?? 0}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          label="Now Serving"
          value={nowServing ? nowServing.tokenCode : 'None'}
          icon={Sparkles}
          color="slate"
        />
      </div>

      {/* Hero: Now Serving Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Serving Customer Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Currently Serving
              </span>
              {nowServing && <StatusPill status="serving" size="sm" />}
            </div>

            {nowServing ? (
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {nowServing.tokenCode}
                  </span>
                  <span className="text-lg font-semibold text-slate-700">
                    {nowServing.customerName}
                  </span>
                  {nowServing.source === 'walkin' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                      Walk-in
                    </span>
                  )}
                </div>
                {nowServing.phone && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {nowServing.phone}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-300 font-mono">
                  No Active Customer
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Click &ldquo;Call Next Customer&rdquo; when ready to serve the next person in line.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {nowServing ? (
              <>
                <button
                  type="button"
                  onClick={handleCompleteServing}
                  disabled={actionLoading}
                  className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm min-h-[44px] disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Complete</span>
                </button>
                <button
                  type="button"
                  onClick={handleSkipServing}
                  disabled={actionLoading}
                  className="px-5 py-3 rounded-xl bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 transition flex items-center gap-2 shadow-sm min-h-[44px] disabled:opacity-50"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Skip</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-start sm:items-end gap-1">
                <button
                  type="button"
                  onClick={handleCallNext}
                  disabled={!canCallNext || actionLoading}
                  className="px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition flex items-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                  <span>Call Next Customer</span>
                </button>
                {!canCallNext && (
                  <span className="text-[11px] text-slate-400 italic">
                    {callNextDisabledReason}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Waiting Queue + Terminal History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Waiting List (2 cols) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              Waiting Queue
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                {waitingCount}
              </span>
            </h2>
            <span className="text-xs text-slate-400">
              ~{queueData?.service?.avgServiceMinutes ?? 5}m avg per customer
            </span>
          </div>

          {queueLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
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
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
            Recently Finished
          </h2>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            {queueData?.history?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No completed or skipped tokens yet today.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {queueData?.history?.map((h) => (
                  <div
                    key={h._id}
                    className="py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span className="font-mono text-indigo-600">{h.tokenCode}</span>
                        <span>{h.customerName}</span>
                      </div>
                      {h.source === 'walkin' && (
                        <span className="text-[10px] text-amber-600 uppercase font-medium">
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

      {/* Demo Tools Section: Reset Queue */}
      <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Demo Tools
          </h3>
          <p className="text-xs text-slate-400">
            Clear all tokens and reset the counter for this service today.
          </p>
        </div>

        {showResetConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-rose-700 font-medium">Reset today&apos;s queue?</span>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 min-h-[36px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetQueue}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition flex items-center gap-1 min-h-[36px]"
            >
              {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Reset
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition text-xs font-medium flex items-center gap-1.5 self-start min-h-[36px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Today&apos;s Queue</span>
          </button>
        )}
      </div>

      {/* Walk-in Customer Modal */}
      <WalkInModal
        isOpen={walkinModalOpen}
        onClose={() => setWalkinModalOpen(false)}
        onSubmit={handleAddWalkinSubmit}
        serviceName={selectedService?.name}
      />
    </div>
  );
}

