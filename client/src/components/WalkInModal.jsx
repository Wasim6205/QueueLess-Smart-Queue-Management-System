import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';

export default function WalkInModal({
  isOpen,
  onClose,
  onSubmit,
  serviceName = 'Selected Service',
}) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = customerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter a valid customer name (at least 2 characters).');
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) {
      setError('If provided, phone must be a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({ customerName: trimmedName, phone: trimmedPhone });
      setCustomerName('');
      setPhone('');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to add walk-in customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <UserPlus className="w-5 h-5" />
            <h3 className="text-slate-900 font-bold text-lg">Add Walk-in Customer</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Adding customer directly to <span className="font-semibold text-slate-700">{serviceName}</span>.
            Walk-ins bypass online booking limits and join the live queue at the end.
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile number"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !customerName.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Adding…' : 'Add to Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

