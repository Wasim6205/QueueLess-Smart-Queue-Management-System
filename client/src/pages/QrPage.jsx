import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { servicesApi, getErrorMessage } from '../api/client';
import { Printer, ArrowLeft, Loader2, Sparkles, AlertCircle, Smartphone, CheckCircle, Clock } from 'lucide-react';
import Button from '../components/ui/Button';

export default function QrPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        const list = await servicesApi.list();
        setServices(list);
        if (list.length > 0) {
          const currentId = serviceId || list[0]._id;
          setSelectedServiceId(currentId);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, [serviceId]);

  const service = services.find((s) => s._id === selectedServiceId);
  const bookingUrl = `${window.location.origin}/?service=${selectedServiceId}`;

  const handlePrint = () => {
    window.print();
  };

  const handleServiceChange = (e) => {
    const newId = e.target.value;
    setSelectedServiceId(newId);
    navigate(`/qr/${newId}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
        <p className="text-ink-muted text-sm font-medium">Preparing QR poster…</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <h2 className="font-display text-lg font-bold text-ink mb-1">Failed to load poster</h2>
        <p className="text-sm text-ink-muted mb-4">{error || 'Service not found.'}</p>
        <Link to="/admin">
          <Button variant="forest" size="sm" icon={ArrowLeft}>
            Back to Admin
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream print:bg-white flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Top Action Bar (Hidden during printing) */}
      <div className="no-print w-full max-w-md flex items-center justify-between gap-3 mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </Link>

        <div className="flex items-center gap-2">
          {/* Quick Service Switcher Dropdown */}
          <select
            value={selectedServiceId}
            onChange={handleServiceChange}
            className="px-3 py-1.5 rounded-xl border border-line bg-surface text-xs font-bold font-display text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                [{s.prefix}] {s.name}
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            icon={Printer}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Printable Poster Card (Clean A4 proportions) */}
      <div className="w-full max-w-md bg-surface rounded-4xl border-2 border-line print:border-none print:shadow-none p-8 sm:p-10 shadow-warm-xl text-center flex flex-col items-center justify-between">
        {/* Brand / Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-forest-100 border border-forest-700/20 text-forest-900 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" /> QueueLess Smart Queue
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-ink tracking-tight leading-tight">
            {service.name}
          </h1>
          <p className="text-xs text-ink-muted mt-2 font-medium">
            Join the digital queue on your phone. No app install required.
          </p>
        </div>

        {/* Big Forest-Themed High-Contrast QR Code */}
        <div className="p-6 bg-white rounded-3xl border-2 border-line shadow-warm-xs mb-6 inline-block">
          <QRCodeSVG
            value={bookingUrl}
            size={220}
            level="H"
            fgColor="#0F2D22"
            bgColor="#FFFFFF"
            includeMargin={true}
          />
        </div>

        {/* 3-Step Scan Instructions */}
        <div className="w-full bg-cream/70 rounded-2xl border border-line p-4 mb-6 text-left space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-ink">
            <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              1
            </div>
            <span>Point your phone camera at the QR code above.</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-ink">
            <div className="w-5 h-5 rounded-full bg-forest-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              2
            </div>
            <span>Enter your name and mobile number.</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-ink">
            <div className="w-5 h-5 rounded-full bg-mint-500 text-forest-900 flex items-center justify-center font-bold text-[10px] shrink-0">
              3
            </div>
            <span>Get your token and track your turn in real time!</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-line/60 w-full flex items-center justify-between text-xs text-ink-muted font-medium">
          <span>
            Service Code: <strong className="text-ink font-bold">[{service.prefix}]</strong>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-brand-500" />
            <span>~<span className="tabular-nums font-bold">{service.avgServiceMinutes}</span> min per customer</span>
          </span>
        </div>
      </div>
    </div>
  );
}
