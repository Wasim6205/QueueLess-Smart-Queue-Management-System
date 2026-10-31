import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { servicesApi, tokensApi, getErrorMessage } from '../api/client';
import ServiceCard from '../components/ServiceCard';
import { ServiceCardSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  Sparkles,
  ArrowRight,
  User,
  Phone,
  AlertCircle,
  RefreshCw,
  Check,
  CheckCircle2,
  Clock,
  Ticket,
  X,
} from 'lucide-react';

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get('service');
  const { addToast } = useToast();
  const formRef = useRef(null);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);

  const [selectedService, setSelectedService] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [touchedName, setTouchedName] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [duplicateTokenId, setDuplicateTokenId] = useState(null);
  const [shake, setShake] = useState(false);

  // Perforated ticket success state
  const [successToken, setSuccessToken] = useState(null);
  const [dismissResumeBanner, setDismissResumeBanner] = useState(false);

  const lastTokenId = localStorage.getItem('queueless:lastTokenId');

  const fetchServices = async () => {
    setLoading(true);
    setServicesError(null);
    try {
      const data = await servicesApi.list();
      setServices(data);

      if (preselectedServiceId) {
        const found = data.find((s) => s._id === preselectedServiceId && s.isOpen);
        if (found) {
          setSelectedService(found);
        }
      } else if (data.length > 0) {
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
  }, []);

  // Deep link auto-scroll to form
  useEffect(() => {
    if (preselectedServiceId && services.length > 0) {
      const found = services.find((s) => s._id === preselectedServiceId && s.isOpen);
      if (found) {
        setSelectedService(found);
        setTimeout(() => {
          formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
      }
    }
  }, [preselectedServiceId, services]);

  const validatePhone = (p) => /^[6-9]\d{9}$/.test(p);

  const isNameValid = customerName.trim().length >= 2;
  const isPhoneValid = validatePhone(phone.trim());

  const nameError =
    touchedName && customerName.trim().length > 0 && customerName.trim().length < 2
      ? 'Name must be at least 2 characters.'
      : '';

  const phoneError =
    touchedPhone && phone.trim().length > 0 && !validatePhone(phone.trim())
      ? phone.trim().length === 10
        ? 'Indian mobile number should start with 6, 7, 8, or 9.'
        : 'Please enter exactly 10 digits.'
      : '';

  // Determine current active step (1, 2, or 3)
  const currentStep = !selectedService
    ? 1
    : !isNameValid || !isPhoneValid
    ? 2
    : 3;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setDuplicateTokenId(null);
    setTouchedName(true);
    setTouchedPhone(true);

    const trimmedName = customerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setFormError('Please enter your full name (at least 2 characters).');
      triggerShake();
      return;
    }

    const trimmedPhone = phone.trim();
    if (!validatePhone(trimmedPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      triggerShake();
      return;
    }

    if (!selectedService) {
      setFormError('Please select a service.');
      triggerShake();
      return;
    }

    if (!selectedService.isOpen) {
      setFormError('Bookings are currently closed for this service.');
      triggerShake();
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

      // Trigger Confetti in Warm Forest brand colors
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F2683C', '#1B4D3B', '#2DBE7A', '#F2A93B'],
        });
      } catch (e) {
        // Confetti gracefully fails if not available
      }

      setSuccessToken(res.token);

      // Auto-navigate after 2.2 seconds if user does not click earlier
      setTimeout(() => {
        navigate(`/token/${tokenId}`);
      }, 2200);
    } catch (err) {
      triggerShake();
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
    <div className="max-w-5xl mx-auto px-4 py-8 relative">
      {/* Soft Ambient Background Gradient Blob */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-96 sm:w-[540px] h-64 sm:h-80 bg-gradient-to-tr from-forest-100/50 via-brand-100/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Resume Token Banner */}
      {lastTokenId && !dismissResumeBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 p-4 rounded-3xl bg-forest-100/80 border border-forest-700/20 flex items-center justify-between gap-4 shadow-warm-xs backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 text-forest-900 text-sm font-medium">
            <div className="w-8 h-8 rounded-xl bg-forest-900 text-cream flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <span className="font-semibold block sm:inline">Active token in progress.</span>{' '}
              <span className="text-xs text-forest-700">You can return to your live place in line anytime.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/token/${lastTokenId}`}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-forest-900 text-cream hover:bg-forest-700 transition flex items-center gap-1.5 shrink-0 shadow-warm-xs"
            >
              Track Token
              <ArrowRight className="w-3.5 h-3.5 text-brand-500" />
            </Link>
            <button
              type="button"
              onClick={() => setDismissResumeBanner(true)}
              className="p-1.5 text-forest-700 hover:text-forest-900 rounded-lg hover:bg-forest-200/50 transition cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-10 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 border border-forest-700/15 text-forest-900 text-xs font-semibold mb-4 shadow-warm-xs">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          <span>Real-time virtual queues</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-ink tracking-tight leading-[1.08]">
          Skip the Waiting Room.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-ink-muted leading-relaxed font-normal max-w-xl mx-auto">
          Book your token online in seconds and watch your live place in line update straight from your phone.
        </p>

        {/* 3-Step Progress Header */}
        <div className="mt-8 inline-flex items-center gap-1 sm:gap-2 p-1.5 rounded-full bg-surface border border-line shadow-warm-xs text-xs font-semibold">
          {/* Step 1 */}
          <div
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              currentStep === 1
                ? 'bg-brand-500 text-white shadow-warm-xs font-bold'
                : selectedService
                ? 'bg-forest-100 text-forest-700 font-bold'
                : 'text-ink-muted'
            }`}
          >
            {selectedService ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
            )}
            <span>Choose service</span>
          </div>

          <span className="text-line text-xs font-bold">→</span>

          {/* Step 2 */}
          <div
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              currentStep === 2
                ? 'bg-brand-500 text-white shadow-warm-xs font-bold'
                : isNameValid && isPhoneValid
                ? 'bg-forest-100 text-forest-700 font-bold'
                : 'text-ink-muted'
            }`}
          >
            {isNameValid && isPhoneValid ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-cream flex items-center justify-center text-[10px] text-ink">2</span>
            )}
            <span>Your details</span>
          </div>

          <span className="text-line text-xs font-bold">→</span>

          {/* Step 3 */}
          <div
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              currentStep === 3
                ? 'bg-brand-500 text-white shadow-warm-xs font-bold'
                : 'text-ink-muted'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-cream flex items-center justify-center text-[10px] text-ink">3</span>
            <span>Get token</span>
          </div>
        </div>
      </div>

      {/* Services Grid Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider font-display">
              1. Select a Service
            </h2>
          </div>
          {preselectedServiceId && (
            <span className="text-xs text-brand-600 font-semibold bg-brand-100 px-2.5 py-0.5 rounded-full">
              Pre-selected from QR code
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
          <div className="p-8 rounded-3xl border border-rose-200 bg-rose-100/50 text-center">
            <p className="text-sm font-semibold text-rose-900 mb-3">{servicesError}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchServices}
              icon={RefreshCw}
            >
              Retry
            </Button>
          </div>
        ) : services.length === 0 ? (
          <div className="p-8 rounded-3xl border border-line bg-surface text-center text-ink-muted">
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
      <motion.div
        ref={formRef}
        animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg mx-auto bg-surface rounded-4xl border border-line p-6 sm:p-8 shadow-warm-md relative"
      >
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider font-display">
              2. Customer Details
            </h2>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            {selectedService ? (
              <span>
                Booking for <strong className="text-ink font-semibold">{selectedService.name}</strong> (~{selectedService.avgServiceMinutes} min/customer)
              </span>
            ) : (
              'Please select a service above first.'
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-rose-100 border border-rose-200 text-rose-900 text-xs sm:text-sm font-medium flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
              {duplicateTokenId && (
                <div className="mt-1">
                  <Link to={`/token/${duplicateTokenId}`}>
                    <Button variant="danger" size="sm" icon={ArrowRight}>
                      View My Active Token
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* Name Field with Floating Label Input */}
          <Input
            id="customer-name"
            label="Full Name"
            required
            maxLength={50}
            value={customerName}
            onBlur={() => setTouchedName(true)}
            onChange={(e) => {
              setCustomerName(e.target.value);
              if (formError) setFormError('');
            }}
            placeholder="e.g. Ramesh Kumar"
            icon={User}
            error={nameError}
            isValid={isNameValid && touchedName}
          />

          {/* Phone Field with Floating Label Input */}
          <Input
            id="customer-phone"
            label="Mobile Number"
            type="tel"
            inputMode="numeric"
            required
            maxLength={10}
            value={phone}
            onBlur={() => setTouchedPhone(true)}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ''));
              if (formError) setFormError('');
            }}
            placeholder="10-digit mobile number"
            icon={Phone}
            error={phoneError}
            isValid={isPhoneValid && touchedPhone}
          />
          <p className="text-[11px] text-ink-muted -mt-2 ml-1">
            Indian 10-digit mobile (starting with 6, 7, 8, or 9).
          </p>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={
                submitting ||
                !customerName.trim() ||
                !validatePhone(phone.trim()) ||
                !selectedService ||
                !selectedService.isOpen
              }
              className="w-full shadow-warm-md"
              icon={ArrowRight}
            >
              Generate Token
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Perforated Ticket Success Moment Modal */}
      <AnimatePresence>
        {successToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
              onClick={() => navigate(`/token/${successToken._id}`)}
            />

            {/* Perforated Ticket Card */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative w-full max-w-sm bg-forest-900 text-cream rounded-4xl p-6 sm:p-8 shadow-warm-2xl border border-forest-700/80 overflow-hidden z-10"
            >
              {/* Left & Right Perforated Notches */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-cream border-r border-forest-700" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-cream border-l border-forest-700" />

              {/* Ticket Content */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-700/80 text-brand-500 text-xs font-bold uppercase tracking-wider mb-3">
                  <CheckCircle2 className="w-4 h-4 text-mint-500" />
                  <span>Token Generated</span>
                </div>

                <p className="text-xs text-cream/70 uppercase tracking-widest font-bold">
                  {selectedService?.name || 'Service'}
                </p>

                {/* Giant Token Code */}
                <div className="my-4 py-3 rounded-2xl bg-forest-950/60 border border-forest-700/40">
                  <span className="font-display font-black text-6xl tracking-wider text-brand-500 tabular-nums">
                    {successToken.tokenCode}
                  </span>
                </div>

                <p className="text-sm font-semibold text-cream">
                  {successToken.customerName}
                </p>

                {/* Perforated dashed divider */}
                <div className="my-5 border-t border-dashed border-forest-700/60 relative" />

                <div className="flex items-center justify-between text-xs text-cream/70 px-2 mb-6">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-mint-500" />
                    <span>Estimated wait</span>
                  </span>
                  <span className="font-bold text-cream tabular-nums">
                    ~{(successToken.position ? (successToken.position - 1) * (selectedService?.avgServiceMinutes || 5) : 0)} min
                  </span>
                </div>

                {/* CTA to live tracker */}
                <Button
                  variant="primary"
                  size="md"
                  className="w-full shadow-warm-md"
                  onClick={() => navigate(`/token/${successToken._id}`)}
                  icon={ArrowRight}
                >
                  Go to Live Tracker Now
                </Button>

                <p className="text-[11px] text-cream/60 mt-3 animate-pulse">
                  Redirecting to live tracker in a moment…
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
