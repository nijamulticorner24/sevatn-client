'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import {
  Search,
  Plus,
  Calendar,
  Compass,
  KeyRound,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Bell,
  BellRing,
  Sparkles,
  RefreshCw,
  Layers,
  ShieldCheck,
  Zap,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const FILTER_TABS = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'PENDING', label: 'Watching & Queued' },
  { key: 'COMPLETED', label: 'Confirmed Passes' },
  { key: 'FAILED', label: 'Failed / Action Needed' },
];

function isCompleted(b: any) {
  if (!b) return false;
  const status = typeof b === 'string' ? b : b.status;
  const ref = typeof b === 'object' ? b.officialReference : null;
  if (ref && String(ref).trim().length > 0) return true;
  return (
    status === 'SUCCESS' ||
    status === 'COMPLETED' ||
    status === 'BOOKING_CONFIRMED' ||
    status === 'WISHLIST_ADDED'
  );
}

function isFailed(b: any) {
  if (!b) return false;
  if (isCompleted(b)) return false;
  const status = typeof b === 'string' ? b : b.status;
  return (
    status === 'FAILED' ||
    status === 'LOGIN_FAILED' ||
    status === 'SITE_UNAVAILABLE' ||
    status === 'SITE_ERROR' ||
    status === 'NO_AVAILABILITY' ||
    status === 'EXPIRED' ||
    status === 'TIMEOUT' ||
    status === 'WORKER_ERROR' ||
    status === 'REQUIRES_HUMAN'
  );
}

function isCancelled(b: any) {
  if (!b) return false;
  const status = typeof b === 'string' ? b : b.status;
  return status === 'CANCELLED';
}

function isPending(b: any) {
  return !isCompleted(b) && !isFailed(b) && !isCancelled(b);
}

// Live elapsed timer component ticking every second
function LiveTimer({ createdAt }: { createdAt: string | Date }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const start = new Date(createdAt).getTime();
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((now - start) / 1000));
      const hrs = Math.floor(diffSecs / 3600).toString().padStart(2, '0');
      const mins = Math.floor((diffSecs % 3600) / 60).toString().padStart(2, '0');
      const secs = (diffSecs % 60).toString().padStart(2, '0');
      setElapsed(`${hrs}:${mins}:${secs}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [createdAt]);

  return <span className="font-mono font-bold tracking-tight">{elapsed}</span>;
}

// Calculate duration between created and completed/updated
function formatDuration(startDate: string | Date, endDate?: string | Date) {
  if (!endDate) return '';
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffSecs = Math.max(1, Math.floor((end - start) / 1000));

  if (diffSecs < 60) return `${diffSecs}s`;
  const mins = Math.floor(diffSecs / 60);
  const secs = diffSecs % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

// Mask account username safely
function formatAccountName(username?: string) {
  if (!username) return '••••••••';
  if (username.length <= 4) return username;
  if (/^\d{10}$/.test(username)) {
    return `${username.slice(0, 4)}••••${username.slice(8)}`;
  }
  return username;
}

// Synthesize pleasant success audio chime via Web Audio API
function playSuccessChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Note 1: E5 (659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Note 2: A5 (880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch (e) {
    // Audio context may be restricted before user interaction
  }
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [recentSuccessToast, setRecentSuccessToast] = useState<any | null>(null);

  // Keep track of known completed booking IDs to avoid duplicate alerts
  const knownCompletedIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef<boolean>(true);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationAccess = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        playSuccessChime();
        new Notification('🔔 TicketAssist Alerts Enabled', {
          body: 'You will receive instant desktop notifications as soon as a pass is confirmed!',
          icon: '/favicon.ico',
        });
      }
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
    }
  };

  const triggerDesktopAlert = (booking: any) => {
    playSuccessChime();
    setRecentSuccessToast(booking);
    setTimeout(() => {
      setRecentSuccessToast(null);
    }, 8000);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const dur = formatDuration(booking.createdAt, booking.updatedAt || new Date());
        new Notification(`🎉 Pass Confirmed! (#${booking.bookingCode})`, {
          body: `Devotee: ${booking.account?.username || 'Devotee'}\nRoute: ${booking.route || 'Pamba'}\nRef: ${booking.officialReference || 'Confirmed in ' + dur}`,
          icon: '/favicon.ico',
          tag: `booking-${booking.id}`,
        });
      } catch (err) {
        console.warn('Notification error:', err);
      }
    }
  };

  const fetchBookings = () => {
    api.getBookings(undefined, 1, search)
      .then((res) => {
        if (res?.bookings) {
          const newBookings = res.bookings;

          // Check for newly completed bookings to trigger Desktop Notification
          if (!isInitialLoad.current) {
            newBookings.forEach((b: any) => {
              if (isCompleted(b.status) && !knownCompletedIds.current.has(b.id)) {
                knownCompletedIds.current.add(b.id);
                triggerDesktopAlert(b);
              }
            });
          } else {
            // Seed known completed IDs on initial fetch
            newBookings.forEach((b: any) => {
              if (isCompleted(b.status)) {
                knownCompletedIds.current.add(b.id);
              }
            });
            isInitialLoad.current = false;
          }

          setBookings(newBookings);
        }
        setLastRefreshed(new Date());
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
    // Live polling every 3 seconds for rapid confirmation detection
    const interval = setInterval(fetchBookings, 3000);
    return () => clearInterval(interval);
  }, [search]);

  // Statistics
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => isPending(b)).length;
  const completedCount = bookings.filter((b) => isCompleted(b)).length;
  const failedCount = bookings.filter((b) => isFailed(b)).length;

  // Filter bookings according to activeTab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'PENDING') return isPending(b);
    if (activeTab === 'COMPLETED') return isCompleted(b);
    if (activeTab === 'FAILED') return isFailed(b);
    return true;
  });

  return (
    <div className="w-full max-w-[1400px] space-y-6">
      {/* Toast Banner for New Success Event */}
      {recentSuccessToast && (
        <div className="rounded-[10px] border border-[#C3E6CB] bg-[#EAF7EE] p-4 text-[#155724] shadow-md flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#198754] text-white flex items-center justify-center shrink-0 shadow-subtle">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold">
                🎉 Pass Confirmed for #{recentSuccessToast.bookingCode}!
              </p>
              <p className="text-[12px] text-[#285e3a]">
                Official Ref: <strong className="font-mono">{recentSuccessToast.officialReference || 'Verified'}</strong> • Completed in {formatDuration(recentSuccessToast.createdAt, recentSuccessToast.updatedAt)}
              </p>
            </div>
          </div>

          <Link
            href={`/dashboard/bookings/${recentSuccessToast.id}`}
            className="rounded-[6px] bg-[#198754] text-white px-3.5 py-1.5 text-[12px] font-bold hover:bg-[#146c43] transition-colors shrink-0"
          >
            View Pass
          </Link>
        </div>
      )}

      {/* Top Header & New Booking CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6EAF0]">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#172033] tracking-tight">
            Bookings
          </h1>
          <p className="text-[13px] text-[#667085] mt-0.5">
            Real-time monitoring queue, success timers, and verified darshan passes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Notification Permission Toggle */}
          {notificationPermission !== 'granted' ? (
            <button
              type="button"
              onClick={requestNotificationAccess}
              className="flex items-center gap-1.5 rounded-[7px] border border-[#F9DE9B] bg-[#FEF7E6] px-3.5 py-2 text-[12.5px] font-semibold text-[#8F5A0D] hover:bg-[#FCE0A6] transition-colors shadow-subtle"
            >
              <Bell className="h-3.5 w-3.5 text-[#C98219]" />
              <span>Enable Desktop Alerts</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-[7px] border border-[#C3E6CB] bg-[#EAF7EE] px-3 py-1.5 text-[11.5px] font-bold text-[#155724]">
              <BellRing className="h-3.5 w-3.5 text-[#198754]" />
              <span>Alerts Active</span>
            </div>
          )}

          <Link
            href="/dashboard/bookings/new"
            className="flex items-center gap-1.5 rounded-[7px] bg-[#C98219] hover:bg-[#B57414] px-4 py-2 text-[12.5px] font-bold text-white transition-all shadow-subtle hover:shadow"
          >
            <Plus className="h-4 w-4" />
            <span>New Booking</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total Requests</span>
            <Layers className="h-4 w-4 text-[#98A2B3]" />
          </div>
          <p className="text-[24px] font-bold text-[#172033] mt-2 tabular-nums">{totalCount}</p>
          <p className="text-[11.5px] text-[#667085] mt-0.5">All booking requests</p>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Monitoring Queue</span>
            <Clock className="h-4 w-4 text-[#C98219]" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-[24px] font-bold text-[#C98219] tabular-nums">{pendingCount}</p>
            {pendingCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-[#C98219] animate-ping" />
            )}
          </div>
          <p className="text-[11.5px] text-[#667085] mt-0.5">Active worker checking</p>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Confirmed Passes</span>
            <CheckCircle2 className="h-4 w-4 text-[#198754]" />
          </div>
          <p className="text-[24px] font-bold text-[#198754] mt-2 tabular-nums">{completedCount}</p>
          <p className="text-[11.5px] text-[#667085] mt-0.5">Verified official passes</p>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Action Needed / Failed</span>
            <AlertCircle className="h-4 w-4 text-[#C2413B]" />
          </div>
          <p className="text-[24px] font-bold text-[#C2413B] mt-2 tabular-nums">{failedCount}</p>
          <p className="text-[11.5px] text-[#667085] mt-0.5">Human OTP or quota full</p>
        </div>
      </div>

      {/* Filter Tabs & Live Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === 'ALL'
                ? totalCount
                : tab.key === 'PENDING'
                ? pendingCount
                : tab.key === 'COMPLETED'
                ? completedCount
                : failedCount;

            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-[7px] px-3.5 py-2 text-[12.5px] font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-[#172033] text-white shadow-subtle'
                    : 'bg-white border border-[#E6EAF0] text-[#475467] hover:bg-[#F8FAFC] hover:border-[#D0D5DD]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#F0F3F8] text-[#475467]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Radar Sync & Search Bar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-medium text-[#667085]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#198754] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#198754]"></span>
            </span>
            <span>Live Polling (3s)</span>
          </div>

          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search by ID, route, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-[12.5px] bg-white border border-[#D0D5DD] rounded-[7px] text-[#172033] placeholder:text-[#98A2B3] focus:border-[#C98219] focus:outline-none focus:ring-2 focus:ring-[#C98219]/20"
            />
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#98A2B3]" />
          </div>
        </div>
      </div>

      {/* Bookings List Cards */}
      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton rows={4} className="h-28" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-12 text-center shadow-subtle">
          <EmptyState
            title="No matching bookings found"
            description="Create a new booking request or adjust your search filter."
            actionLabel="+ Create Booking Request"
            onAction={() => (window.location.href = '/dashboard/bookings/new')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => {
            const pending = isPending(b);
            const completed = isCompleted(b);
            const failed = isFailed(b);
            const accountDisplay = formatAccountName(b.account?.username);

            return (
              <div
                key={b.id}
                className={`rounded-[10px] border bg-white p-4 shadow-subtle transition-all flex flex-col justify-between hover:shadow-card ${
                  completed
                    ? 'border-[#C3E6CB] hover:border-[#198754]'
                    : pending
                    ? 'border-[#F9DE9B] hover:border-[#C98219]'
                    : 'border-[#E6EAF0] hover:border-[#D0D5DD]'
                }`}
              >
                <div>
                  {/* Top Header: Booking Code & Status / Timer */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[14px] text-[#172033]">
                      #{b.bookingCode}
                    </span>

                    {/* Live Clock Timer ONLY when pending/watching */}
                    {pending && (
                      <div className="flex items-center gap-1.5 rounded-full bg-[#FEF7E6] border border-[#F9DE9B] px-2.5 py-0.5 text-[11px] font-bold text-[#8F5A0D]">
                        <Clock className="h-3 w-3 text-[#C98219]" />
                        <span><LiveTimer createdAt={b.createdAt} /></span>
                      </div>
                    )}

                    {/* Confirmed Pass Status */}
                    {completed && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EE] text-[#155724] border border-[#C3E6CB]">
                        <CheckCircle2 className="h-3 w-3 text-[#198754]" />
                        <span>Pass Confirmed</span>
                      </span>
                    )}

                    {/* Failed Status */}
                    {failed && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FDECEC] text-[#992B26] border border-[#F8C4C2]">
                        <AlertCircle className="h-3 w-3 text-[#C2413B]" />
                        <span>{b.status === 'REQUIRES_HUMAN' ? 'Action Required' : 'Failed'}</span>
                      </span>
                    )}

                    {/* Cancelled Status */}
                    {isCancelled(b) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F4F9] text-[#667085] border border-[#E6EAF0]">
                        Cancelled
                      </span>
                    )}
                  </div>

                  {/* Devotee Reference Box */}
                  <div className="mt-3 bg-[#F8FAFC] rounded-[8px] p-2.5 border border-[#E6EAF0]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
                        Devotee Reference
                      </span>
                      <span className="text-[10.5px] font-mono text-[#667085] truncate max-w-[110px]">
                        {accountDisplay}
                      </span>
                    </div>
                    <p className="font-bold text-[13.5px] text-[#172033] mt-0.5 truncate">
                      {b.account?.label || accountDisplay}
                    </p>
                  </div>

                  {/* Darshan Date & Route */}
                  <div className="mt-3 space-y-1.5 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#667085] flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#98A2B3]" />
                        Darshan Date
                      </span>
                      <span className="font-semibold text-[#172033]">
                        {formatDate(b.requestedDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#667085] flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-[#98A2B3]" />
                        Route
                      </span>
                      <span className="font-medium text-[#172033] truncate max-w-[150px]">
                        {b.route}
                      </span>
                    </div>
                  </div>

                  {/* Official Reference Number if Confirmed */}
                  {completed && b.officialReference && (
                    <div className="mt-2.5 flex items-center justify-between bg-[#EAF7EE] border border-[#C3E6CB] rounded-[6px] px-2.5 py-1 text-[11.5px]">
                      <span className="text-[#155724] font-medium text-[11px]">Pass Ref:</span>
                      <span className="font-mono font-bold text-[#155724]">{b.officialReference}</span>
                    </div>
                  )}
                </div>

                {/* Footer: Date & Action buttons */}
                <div className="mt-4 pt-3 border-t border-[#E6EAF0] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#667085]">
                    {formatDate(b.createdAt)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {completed && (
                      <a
                        href="https://sabarimalaonline.org/#/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[6px] border border-[#C3E6CB] bg-[#EAF7EE] px-2.5 py-1 text-[11.5px] font-bold text-[#155724] hover:bg-[#D4EDDA] hover:border-[#198754] transition-colors flex items-center gap-1"
                        title="Download your pass on Official Portal"
                      >
                        <ExternalLink className="h-3 w-3 text-[#198754]" />
                        <span>Download Pass</span>
                      </a>
                    )}
                    <Link
                      href={`/dashboard/bookings/${b.id}`}
                      className="rounded-[6px] border border-[#D0D5DD] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#344054] hover:border-[#C98219] hover:text-[#C98219] hover:bg-[#FDF7ED] transition-colors flex items-center gap-1"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[#98A2B3]" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
