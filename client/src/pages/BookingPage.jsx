import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { servicesApi, tokensApi, getErrorMessage } from '../api/client';
import ServiceCard from '../components/ServiceCard';
import { ServiceCardSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { Sparkles, ArrowRight, User, Phone, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get('service');
  const { addToast } = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);

  const [selectedService, setSelectedService] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [duplicateTokenId, setDuplicateTokenId] = useState(null);

  const lastTokenId = localStorage.getItem('queueless:lastTokenId');

  const fetchServices = async () => {
    setLoading(true);
    setServicesError(null);
    try {
      const data = await servicesApi.list();
      setServices(data);

      // Handle deep-linked service ID from QR code
      if (preselectedServiceId) {
        const found = data.find((s) => s._id === preselectedServiceId && s.isOpen);
        if (found) {
          setSelectedService(found);
        }
      } else if (!selectedService && data.length > 0) {
        // Pre-select first open service
        const firstOpen = data.find((s) => s.isOpen);
        if (firstOpen) setSelectedService(firstOpen);
      }
    } catch (err) {
      setServicesError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [preselectedServiceId]);

  const validatePhone = (p) => /^[6-9]\d{9}$/.test(p);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setDuplicateTokenId(null);

    const trimmedName = customerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setFormError('Please enter your full name (at least 2 characters).');
      return;
    }

    const trimmedPhone = phone.trim();
    if (!validatePhone(trimmedPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!selectedService) {
      setFormError('Please select a service.');
      return;
    }

    if (!selectedService.isOpen) {
      setFormError('Bookings are currently closed for this service.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await tokensApi.book({
        customerName: trimmedName,
        phone: trimmedPhone,
        serviceId: selectedService._id,
      });

      const tokenId = res.token._id;
      localStorage.setItem('queueless:lastTokenId', tokenId);
      addToast(`Token ${res.token.tokenCode} generated successfully!`, 'success');
      navigate(`/token/${tokenId}`);
    } catch (err) {
      const errResponse = err.response?.data?.error;
      if (errResponse?.code === 'DUPLICATE_ACTIVE_TOKEN') {
        setFormError('You already have an active token for this service today.');
        if (errResponse.tokenId) {
          setDuplicateTokenId(errResponse.tokenId);
        }
      } else if (errResponse?.code === 'QUEUE_CLOSED') {
        setFormError('Booking is closed for today.');
      } else if (errResponse?.code === 'DAILY_LIMIT_REACHED') {
        setFormError('The daily booking limit for this service has been reached.');
      } else {
        setFormError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Resume Token Banner */}
      {lastTokenId && (
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-indigo-900 text-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>You have an active or recent token session.</span>
          </div>
          <Link
            to={`/token/${lastTokenId}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1 shrink-0"
          >
            Track Token
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Skip the Waiting Room.
        </h1>
        <p className="mt-2.5 text-base text-slate-600">
          Book your token online in seconds and watch your live position from your phone.
        </p>
      </div>

      {/* Services Grid Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs">
            1. Select a Service
          </h2>
          {preselectedServiceId && (
            <span className="text-xs text-indigo-600 font-medium">
              Pre-selected from QR
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
          </div>
        ) : servicesError ? (
          <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 text-center">
            <p className="text-sm font-medium text-rose-800 mb-3">{servicesError}</p>
            <button
              onClick={fetchServices}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 text-sm font-medium shadow-sm hover:bg-rose-50"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="p-8 rounded-2xl border border-slate-200 bg-white text-center text-slate-500">
            No active services found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((svc) => (
              <ServiceCard
                key={svc._id}
                service={svc}
                isSelected={selectedService?._id === svc._id}
                onSelect={(selected) => {
                  setSelectedService(selected);
                  setFormError('');
                  setDuplicateTokenId(null);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Form Section */}
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
            2. Customer Details
          </h2>
          <p className="text-xs text-slate-500">
            We will assign your token number instantly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
              {duplicateTokenId && (
                <div className="mt-1">
                  <Link
                    to={`/token/${duplicateTokenId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 transition"
                  >
                    View My Token <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                maxLength={50}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
              />
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Indian 10-digit mobile (starting with 6, 7, 8, or 9).
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={
                submitting ||
                !customerName.trim() ||
                !validatePhone(phone.trim()) ||
                !selectedService ||
                !selectedService.isOpen
              }
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] shadow-sm shadow-indigo-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Token…
                </>
              ) : (
                <>
                  Generate Token
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

