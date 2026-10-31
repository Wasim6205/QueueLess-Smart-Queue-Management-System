import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueue } from '../hooks/useQueue';
import { servicesApi } from '../api/client';
import ConnectionIndicator from '../components/ConnectionIndicator';
import { playChime } from '../lib/audio';
import {
  Sparkles,
  Users,
  Loader2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function DisplayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceIdParam = searchParams.get('service');

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(serviceIdParam || '');
  const [loadingServices, setLoadingServices] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chimeMuted, setChimeMuted] = useState(
    () => localStorage.getItem('queueless:displayChimeMuted') === 'true'
  );

  const prevNowServingCodeRef = useRef(null);

  // Live ticking clock
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all services
  useEffect(() => {
    async function loadServices() {
      try {
        setLoadingServices(true);
        const list = await servicesApi.list();
        setServices(list);
        if (list.length > 0 && !selectedServiceId) {
          const defaultId = serviceIdParam || list[0]._id;
          setSelectedServiceId(defaultId);
        }
      } catch (err) {
        console.error('Failed to load services for display:', err);
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, [serviceIdParam]);

  const { data: queueData } = useQueue(selectedServiceId);

  const service = queueData?.service || services.find((s) => s._id === selectedServiceId);
  const nowServing = queueData?.nowServing;
  const nextWaiting = (queueData?.waiting || []).slice(0, 5);

  // Play audio chime when a new customer is called
  useEffect(() => {
    if (nowServing?.tokenCode) {
      if (
        prevNowServingCodeRef.current &&
        prevNowServingCodeRef.current !== nowServing.tokenCode
      ) {
        if (!chimeMuted) {
          playChime();
        }
      }
      prevNowServingCodeRef.current = nowServing.tokenCode;
    } else {
      prevNowServingCodeRef.current = null;
    }
  }, [nowServing?.tokenCode, chimeMuted]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  // Keyboard shortcut listener ('F' for fullscreen)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleChime = () => {
    setChimeMuted((prev) => {
      const next = !prev;
      localStorage.setItem('queueless:displayChimeMuted', String(next));
      return next;
    });
  };

  if (loadingServices) {
    return (
      <div className="min-h-screen bg-forest-900 text-cream flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-900 text-cream flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-forest-700/60 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-forest-800 border border-forest-700/60 flex items-center justify-center shadow-warm-xs">
            <Sparkles className="w-6 h-6 text-brand-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-cream">
                {service?.name || 'Live Queue Display'}
              </h1>
              {service?.prefix && (
                <span className="px-2.5 py-0.5 rounded-lg bg-forest-800 text-xs font-mono font-bold text-mint-400 border border-forest-700/60">
                  [{service.prefix}]
                </span>
              )}
            </div>
            <p className="text-xs text-forest-100/70 mt-0.5">
              Live Waiting Lobby Display • Real-time queue updates
            </p>
          </div>
        </div>

        {/* Right side controls: Service switcher, Clock, Sound, Fullscreen, Connection */}
        <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center">
          {/* Quick service selector */}
          {services.length > 1 && (
            <select
              value={selectedServiceId}
              onChange={(e) => {
                setSelectedServiceId(e.target.value);
                setSearchParams({ service: e.target.value });
              }}
              className="px-3 py-1.5 rounded-xl border border-forest-700 bg-forest-800 text-xs font-bold text-cream focus:outline-none"
            >
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  [{s.prefix}] {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Digital Clock */}
          <div className="text-right hidden md:block">
            <div className="text-2xl font-mono font-bold tracking-wider text-cream tabular-nums">
              {currentTime}
            </div>
            <div className="text-[10px] text-forest-100/60 font-semibold uppercase tracking-wider">
              Local Time
            </div>
          </div>

          {/* Sound alert toggle */}
          <button
            type="button"
            onClick={toggleChime}
            className="p-2.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-cream transition cursor-pointer border border-forest-700/50"
            title={chimeMuted ? 'Turn on audio chime' : 'Mute audio chime'}
          >
            {chimeMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-mint-400" />
            )}
          </button>

          {/* Fullscreen toggle button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-cream transition cursor-pointer border border-forest-700/50"
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-brand-500" />
            ) : (
              <Maximize2 className="w-4 h-4 text-brand-500" />
            )}
          </button>

          <ConnectionIndicator />
        </div>
      </header>

      {/* Main TV Screen Content */}
      <main className="flex-1 my-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        {/* Left 2 Cols: Giant Now Serving Hero Card */}
        <div className="lg:col-span-2 bg-forest-950/80 rounded-4xl border-2 border-forest-700/70 p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[440px] shadow-[0_0_50px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-xs">
          <div className="absolute top-6 left-8 flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-mint-500 animate-ping" />
            <span className="text-xs font-black text-mint-400 uppercase tracking-widest font-display">
              Now Serving
            </span>
          </div>

          <AnimatePresence mode="wait">
            {nowServing ? (
              <motion.div
                key={nowServing.tokenCode}
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="my-auto py-4"
              >
                <div className="text-8xl sm:text-9xl lg:text-[11rem] font-display font-black tracking-wider text-mint-400 drop-shadow-[0_0_50px_rgba(45,190,122,0.4)] my-2 tabular-nums">
                  {nowServing.tokenCode}
                </div>
                <div className="text-3xl sm:text-4xl font-display font-bold text-cream mt-2 tracking-tight">
                  {nowServing.customerName}
                </div>
                <div className="mt-6 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-mint-500/15 border border-mint-500/30 text-mint-300 text-base font-bold font-display shadow-warm-xs">
                  Please proceed to the counter
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-serving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="my-auto py-8"
              >
                <div className="text-6xl sm:text-8xl font-display font-black text-forest-800 my-4 tabular-nums">
                  ------
                </div>
                <p className="text-xl text-cream/70 font-semibold font-display">
                  Waiting for the next customer
                </p>
                <p className="text-xs text-forest-100/50 mt-1">
                  Counter will call the next token shortly.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right 1 Col: Next in Line List */}
        <div className="bg-forest-950/60 rounded-4xl border border-forest-700/60 p-6 sm:p-8 flex flex-col justify-between min-h-[440px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-forest-700/60 mb-5">
              <span className="text-xs font-bold text-cream/80 uppercase tracking-wider flex items-center gap-2 font-display">
                <Users className="w-4 h-4 text-brand-500" />
                Next Up in Line
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-forest-800 text-forest-100 tabular-nums font-bold border border-forest-700/60">
                {queueData?.stats?.waiting ?? 0} waiting
              </span>
            </div>

            {nextWaiting.length === 0 ? (
              <p className="text-forest-100/60 text-sm text-center py-20">
                No customers waiting in line.
              </p>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {nextWaiting.map((item, idx) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      className="p-4 rounded-2xl bg-forest-800/60 border border-forest-700/50 flex items-center justify-between shadow-warm-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-forest-700/80 text-xs font-bold font-display text-forest-100 flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="text-xl font-display font-black text-cream tabular-nums">
                            {item.tokenCode}
                          </span>
                          <span className="text-xs text-forest-100/70 block font-medium">
                            {item.customerName}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-forest-100/80 font-semibold tabular-nums">
                        ~{item.etaMinutes}m est.
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-forest-700/60 text-center text-xs text-forest-100/50">
            * Estimated wait times. Actual duration may vary.
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="pt-4 border-t border-forest-700/60 flex items-center justify-between text-xs text-forest-100/60">
        <div className="flex items-center gap-2">
          <span>Powered by QueueLess</span>
          <span>•</span>
          <Link to="/admin" className="hover:text-cream transition">
            Admin Console
          </Link>
        </div>
        <div>Press <kbd className="px-1.5 py-0.5 rounded bg-forest-800 text-cream font-mono">F</kbd> for fullscreen</div>
      </footer>
    </div>
  );
}
