import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { servicesApi, getErrorMessage } from '../api/client';
import { Printer, ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function QrPage() {
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadService() {
      try {
        setLoading(true);
        const list = await servicesApi.list();
        const found = list.find((s) => s._id === serviceId);
        if (found) {
          setService(found);
        } else {
          setError('Service not found');
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [serviceId]);

  const bookingUrl = `${window.location.origin}/?service=${serviceId}`;

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading QR poster…</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 mb-1">Failed to load QR code</h2>
        <p className="text-sm text-slate-500 mb-4">{error || 'Service not found.'}</p>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white flex flex-col items-center justify-center p-4">
      {/* Top action bar (hidden during print) */}
      <div className="no-print w-full max-w-md flex items-center justify-between mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print Poster
        </button>
      </div>

      {/* Printable Poster Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-slate-200 print:border print:shadow-none p-8 sm:p-10 shadow-lg text-center flex flex-col items-center justify-between">
        {/* Brand / Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> QueueLess
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {service.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Skip the line. Join the digital queue in 10 seconds.
          </p>
        </div>

        {/* Big QR Code */}
        <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs mb-6">
          <QRCodeSVG
            value={bookingUrl}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Scan Callout */}
        <div className="space-y-1.5 max-w-xs">
          <div className="text-lg font-bold text-slate-900">
            Scan to Join Queue
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Point your phone camera here to get your live token number and estimated wait time.
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-100 w-full flex items-center justify-between text-[11px] text-slate-400">
          <span>Service Code: [{service.prefix}]</span>
          <span>~{service.avgServiceMinutes} min / customer</span>
        </div>
      </div>
    </div>
  );
}

