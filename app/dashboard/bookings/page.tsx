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
  Volume2,
  VolumeX,
  Loader2,
  Building2,
  Users,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const FILTER_TABS = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'ACTION_REQUIRED', label: 'Action Needed' },
  { key: 'PENDING', label: 'Watching & Queued' },
  { key: 'COMPLETED', label: 'Confirmed Passes' },
  { key: 'FAILED', label: 'Failed' },
];

function isActionRequired(b: any) {
  if (!b) return false;
  const status = typeof b === 'string' ? b : b.status;
  return status === 'REQUIRES_HUMAN' || status === 'OTP_REQUIRED' || status === 'CAPTCHA_REQUIRED';
}

function isCompleted(b: any) {
  if (!b) return false;
  const status = typeof b === 'string' ? b : b.status;
  const ref = typeof b === 'object' ? (b.officialBookingReference || b.officialReference) : null;
  const isCartId = b && b.cartId && ref === b.cartId;
  if (ref && String(ref).trim().length > 0 && !isCartId && !String(ref).startsWith('SAB-2026-')) {
    return status === 'SUCCESS' || status === 'COMPLETED' || status === 'BOOKING_CONFIRMED';
  }
  return false;
}

function isFailed(b: any) {
  if (!b) return false;
  if (isCompleted(b)) return false;
  if (isActionRequired(b)) return false;
  const status = typeof b === 'string' ? b : b.status;
  return (
    status === 'FAILED' ||
    status === 'LOGIN_FAILED' ||
    status === 'SITE_UNAVAILABLE' ||
    status === 'SITE_ERROR' ||
    status === 'NO_AVAILABILITY' ||
    status === 'EXPIRED' ||
    status === 'TIMEOUT' ||
    status === 'WORKER_ERROR'
  );
}

function isCancelled(b: any) {
  if (!b) return false;
  const status = typeof b === 'string' ? b : b.status;
  return status === 'CANCELLED';
}

function isPastDateCancelled(b: any) {
  if (!isCancelled(b)) return false;
  const note = String(b?.requiresHumanNote || b?.errorMessage || '');
  const dateStr = b?.requestedDateStr || (b?.requestedDate ? String(b.requestedDate).split('T')[0] : '');
  let today = '';
  try {
    today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch {
    today = new Date().toISOString().split('T')[0];
  }
  return note.includes('passed') || note.includes('Auto-cancelled') || (Boolean(dateStr) && dateStr < today);
}

function isPending(b: any) {
  return !isCompleted(b) && !isFailed(b) && !isCancelled(b) && !isActionRequired(b);
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

function playAttentionChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.setValueAtTime(880, now + 0.15);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);
  } catch (e) {
    // Audio context may be restricted
  }
}

export default function BookingsPage() {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentSuccessToast, setRecentSuccessToast] = useState<any | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const u = api.getUser();
    if (u?.role === 'DISTRIBUTOR') {
      window.location.replace('/distributor/bookings');
      return;
    }
    setCurrentUser(u);
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      await api.cancelBooking(cancellingBooking.id);
      toast.success(`Booking #${cancellingBooking.bookingCode} cancelled. Reserved funds refunded to your wallet.`);
      setCancellingBooking(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  // Keep track of known booking IDs to avoid duplicate alerts
  const knownCompletedIds = useRef<Set<string>>(new Set());
  const knownActionRequiredIds = useRef<Set<string>>(new Set());
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

          // Check for newly completed or action-required bookings
          if (!isInitialLoad.current) {
            newBookings.forEach((b: any) => {
              if (isCompleted(b) && !knownCompletedIds.current.has(b.id)) {
                knownCompletedIds.current.add(b.id);
                triggerDesktopAlert(b);
              }
              if (isActionRequired(b) && !knownActionRequiredIds.current.has(b.id)) {
                knownActionRequiredIds.current.add(b.id);
                if (soundEnabled) playAttentionChime();
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  try {
                    new Notification(`⚠️ Action Required: #${b.bookingCode}`, {
                      body: `Official portal presented an OTP or verification challenge for devotee ${b.account?.username || 'Devotee'}!`,
                      icon: '/favicon.ico',
                      tag: `action-${b.id}`,
                    });
                  } catch (err) {}
                }
              }
            });
          } else {
            // Seed known completed and action-required IDs on initial fetch
            newBookings.forEach((b: any) => {
              if (isCompleted(b)) {
                knownCompletedIds.current.add(b.id);
              }
              if (isActionRequired(b)) {
                knownActionRequiredIds.current.add(b.id);
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
  const urgentBookings = bookings.filter((b) => isActionRequired(b));
  const totalCount = bookings.length;
  const actionRequiredCount = urgentBookings.length;
  const pendingCount = bookings.filter((b) => isPending(b)).length;
  const completedCount = bookings.filter((b) => isCompleted(b)).length;
  const failedCount = bookings.filter((b) => isFailed(b)).length;

  // Filter bookings according to activeTab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ACTION_REQUIRED') return isActionRequired(b);
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
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#172033] tracking-tight">
              Bookings
            </h1>
            {currentUser?.role && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                currentUser.role === 'SUPER_ADMIN'
                  ? 'bg-[#EDE9FE] text-[#5925DC] border-[#DDD6FE]'
                  : currentUser.role === 'DISTRIBUTOR'
                  ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                  : currentUser.role === 'PARTNER'
                  ? 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]'
                  : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
              }`}>
                <ShieldCheck className="h-3 w-3" />
                <span>
                  {currentUser.role === 'SUPER_ADMIN'
                    ? 'Super Admin • Platform Scope (All Tenants)'
                    : currentUser.role === 'DISTRIBUTOR'
                    ? 'Distributor Network • Direct & Assigned Centres'
                    : currentUser.role === 'PARTNER'
                    ? 'Franchise Network • Regional Scope'
                    : 'Centre Isolated • Direct Bookings Only'}
                </span>
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#667085] mt-0.5">
            Real-time monitoring queue, success timers, and verified darshan passes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 rounded-[7px] border px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
              soundEnabled
                ? 'border-[#E4E7EC] bg-white text-[#172033] hover:bg-[#F8FAFC]'
                : 'border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]'
            }`}
            title={soundEnabled ? 'Chime sound alerts enabled' : 'Chime sound alerts muted'}
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-[#C98219]" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-[#C2413B]" />
            )}
            <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Notification Permission Toggle */}
          {notificationPermission !== 'granted' ? (
            <button
              type="button"
              onClick={requestNotificationAccess}
              className="flex items-center gap-1.5 rounded-[7px] border border-[#F9DE9B] bg-[#FEF7E6] px-3.5 py-1.5 text-[12px] font-semibold text-[#8F5A0D] hover:bg-[#FCE0A6] transition-colors shadow-subtle"
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

      {/* Urgent Action Required Banner */}
      {urgentBookings.length > 0 && (
        <div className="rounded-[10px] border border-[#F5C6CB] bg-[#FDECEC] p-4 text-[#992B26] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-[#F8D7DA] text-[#C2413B] flex items-center justify-center shrink-0 animate-pulse mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold">
                Action Required: {urgentBookings.length} Booking{urgentBookings.length !== 1 ? 's' : ''} Need Immediate Attention
              </p>
              <p className="text-[12px] text-[#A8322B] mt-0.5">
                The official portal presented an OTP or verification challenge. Complete it now before the session times out.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('ACTION_REQUIRED')}
              className="rounded-[6px] border border-[#F5C6CB] bg-white text-[#C2413B] hover:bg-[#FDECEC] px-3 py-1.5 text-[12px] font-bold transition-colors"
            >
              Filter Action Items
            </button>
            <Link
              href={`/dashboard/bookings/${urgentBookings[0].id}`}
              className="rounded-[6px] bg-[#C2413B] text-white px-3.5 py-1.5 text-[12px] font-bold hover:bg-[#A8322B] transition-colors shadow-subtle shrink-0"
            >
              Resolve #{urgentBookings[0].bookingCode}
            </Link>
          </div>
        </div>
      )}

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
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-[24px] font-bold text-[#C2413B] tabular-nums">
              {actionRequiredCount > 0 ? `${actionRequiredCount} Action` : failedCount}
            </p>
            {actionRequiredCount > 0 && (
              <span className="text-[11px] font-bold text-[#C2413B] bg-[#FDECEC] px-1.5 py-0.5 rounded border border-[#F5C6CB] animate-pulse">
                Urgent
              </span>
            )}
          </div>
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
                : tab.key === 'ACTION_REQUIRED'
                ? actionRequiredCount
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isPastDateCancelled(b)
                          ? 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]'
                          : 'bg-[#F1F4F9] text-[#667085] border-[#E6EAF0]'
                      }`}>
                        {isPastDateCancelled(b) ? 'Auto-Cancelled (Date Passed)' : 'Cancelled'}
                      </span>
                    )}
                  </div>

                  {/* Originating Tenant / Centre Badge (Visible to Distributor, Partner, Admin, or when centre is assigned) */}
                  {currentUser?.role !== 'CENTRE' && (b.user?.centre || b.user?.name || b.userId) && (
                    <div className="mt-2.5 flex items-center justify-between bg-[#F0F4F8] border border-[#D9E2EC] rounded-[6px] px-2.5 py-1 text-[11.5px]">
                      <span className="text-[#486581] font-semibold text-[11px] flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-[#627D98]" />
                        Origin:
                      </span>
                      <span className="font-semibold text-[#102A43] truncate max-w-[170px]" title={b.user?.centre?.centreName || b.user?.name || 'Direct'}>
                        {b.user?.centre?.centreName
                          ? `${b.user.centre.centreName}${b.user.centre.district ? ` (${b.user.centre.district})` : ''}`
                          : b.userId === currentUser?.id
                          ? 'You (Direct Booking)'
                          : (b.user?.name || 'Direct')}
                      </span>
                    </div>
                  )}

                  {/* Devotee Reference Box */}
                  <div className="mt-3 bg-[#F8FAFC] rounded-[8px] p-2.5 border border-[#E6EAF0]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
                        Devotee Reference
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#475467] bg-white border border-[#E6EAF0] px-1.5 py-0.5 rounded">
                          <Users className="h-3 w-3 text-[#98A2B3]" />
                          <span>{b.pilgrims?.length || b.pilgrimCount || 1}</span>
                        </span>
                        <span className="text-[10.5px] font-mono text-[#667085] truncate max-w-[90px]">
                          {accountDisplay}
                        </span>
                      </div>
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
                  {completed && (b.officialBookingReference || b.officialReference) && (
                    <div className="mt-2.5 flex items-center justify-between bg-[#EAF7EE] border border-[#C3E6CB] rounded-[6px] px-2.5 py-1 text-[11.5px]">
                      <span className="text-[#155724] font-medium text-[11px]">Pass Ref:</span>
                      <span className="font-mono font-bold text-[#155724]">{b.officialBookingReference || b.officialReference}</span>
                    </div>
                  )}
                  {b.cartId && (
                    <div className="mt-1 flex items-center justify-between text-[10.5px] text-[#667085] px-1">
                      <span>Cart ID:</span>
                      <span className="font-mono text-[#475467]">{b.cartId}</span>
                    </div>
                  )}
                </div>

                {/* Footer: Date & Action buttons */}
                <div className="mt-4 pt-3 border-t border-[#E6EAF0] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#667085]">
                    {formatDate(b.createdAt)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Direct Cancel Button for Active/Pending Requests */}
                    {(pending || b.status === 'REQUIRES_HUMAN' || b.status === 'RETRYABLE_FAILURE' || b.status === 'WAITING_FOR_ACCOUNT') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setCancellingBooking(b);
                        }}
                        className="rounded-[6px] border border-[#FECDCA] bg-[#FEF3F2] px-2.5 py-1 text-[11.5px] font-bold text-[#B42318] hover:bg-[#FEE4E2] transition-colors"
                        title="Cancel this booking request and refund reserved funds"
                      >
                        Cancel
                      </button>
                    )}
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

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[12px] bg-white p-5 shadow-modal border border-[#E6EAF0] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-[#FEF3F2] text-[#B42318] flex items-center justify-center shrink-0 border border-[#FECDCA]">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-[16px] font-bold text-[#172033]">
                  Cancel Booking #{cancellingBooking.bookingCode}?
                </h3>
                <p className="text-[12.5px] text-[#667085] mt-1">
                  Are you sure you want to cancel this booking request? The background checking worker will stop immediately.
                </p>
              </div>
            </div>

            <div className="bg-[#FAFBFD] rounded-[8px] p-3 border border-[#E6EAF0] space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#667085]">Devotee:</span>
                <span className="font-bold text-[#172033]">{cancellingBooking.account?.label || cancellingBooking.account?.username || 'Devotee'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Darshan Date:</span>
                <span className="font-semibold text-[#172033]">{formatDate(cancellingBooking.requestedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Route:</span>
                <span className="font-semibold text-[#172033] truncate max-w-[200px]">{cancellingBooking.route}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#E6EAF0] text-[#155724] font-bold">
                <span>Wallet Refund:</span>
                <span>Full booking fee refunded to Available Balance</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancellingBooking(null)}
                className="rounded-[7px] border border-[#D0D5DD] bg-white px-4 py-2 text-[12.5px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                No, Keep Booking
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#B42318] hover:bg-[#912018] px-4 py-2 text-[12.5px] font-bold text-white transition-all shadow-subtle disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel & Refund</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
