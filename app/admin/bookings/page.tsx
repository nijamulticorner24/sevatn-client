'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { formatDate, formatTime } from '../../../lib/utils';
import { StateBadge } from '../../../components/StateBadge';
import { getSocket } from '../../../lib/socket';
import {
  Layers,
  Search,
  Filter,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Eye,
  CheckCircle2,
  Trash2,
  AlertOctagon,
  XCircle,
  Loader2,
  Plus,
  Bell,
  BellRing,
  BellOff,
  Send,
} from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';

export default function AdminBookingsPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [restartingId, setRestartingId] = useState<string | null>(null);
  const [notifyingTelegramId, setNotifyingTelegramId] = useState<string | null>(null);
  const [telegramConfig, setTelegramConfig] = useState<{ enabled: boolean; hasCreds: boolean }>({ enabled: false, hasCreds: false });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    isDestructive: boolean;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    isDestructive: false,
    action: async () => {},
  });

  // Track known confirmed IDs to avoid duplicate alerts
  const knownConfirmedRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // Initialize notification permission state and Telegram config on client mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    api.getSystemConfig()
      .then((cfg) => {
        if (cfg) {
          setTelegramConfig({
            enabled: Boolean(cfg.telegramBotEnabled),
            hasCreds: Boolean(cfg.telegramBotToken && cfg.telegramChatId),
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleNotifyTelegram = async (id: string, bookingCode: string) => {
    setNotifyingTelegramId(id);
    try {
      const res = await api.notifyBookingTelegram(id);
      if (res?.success) {
        toast.success(`Telegram notification sent for #${bookingCode}`);
      } else if (res?.result?.skipped) {
        toast.error(`Telegram alert skipped: ${res.result.reason || 'Bot not configured in /admin/config'}`);
      } else {
        toast.error(`Failed to send Telegram alert: ${res?.result?.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch Telegram alert');
    } finally {
      setNotifyingTelegramId(null);
    }
  };

  // Request browser notification permission
  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser notifications are not supported on this browser or platform.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification('SevaTN: Booking Notifications Enabled', {
          body: 'You will receive desktop alerts when bookings are successfully confirmed.',
          icon: '/favicon.ico',
        });
      } else if (permission === 'denied') {
        alert('Notification permission was denied. Please allow notifications in your browser site permissions to receive alerts.');
      }
    } catch (err: any) {
      console.error('Failed to request notification permission:', err);
    }
  };

  // Inspect incoming bookings for new confirmations
  const checkConfirmedNotifications = useCallback((incomingBookings: any[]) => {
    const confirmedStatuses = ['SUCCESS', 'BOOKING_CONFIRMED', 'PASS_CONFIRMED', 'CONFIRMED'];

    // On initial load, record all existing confirmed bookings without firing alerts
    if (isInitialLoadRef.current) {
      incomingBookings.forEach((b) => {
        if (confirmedStatuses.includes(b.status)) {
          knownConfirmedRef.current.add(b.id);
        }
      });
      isInitialLoadRef.current = false;
      return;
    }

    // Subsequent updates: trigger notification for newly confirmed bookings
    incomingBookings.forEach((b) => {
      if (confirmedStatuses.includes(b.status) && !knownConfirmedRef.current.has(b.id)) {
        knownConfirmedRef.current.add(b.id);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('SevaTN: Booking Confirmed!', {
              body: `Booking #${b.bookingCode || b.id} has been successfully confirmed.`,
              icon: '/favicon.ico',
            });
          } catch (e) {
            console.error('Notification dispatch error:', e);
          }
        }
      }
    });
  }, []);

  // Fetch bookings data (silent mode updates state without triggering full-table skeletons)
  const loadBookings = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      return api
        .getBookings(statusFilter === 'ALL' ? undefined : statusFilter, 1)
        .then((res) => {
          if (res?.bookings) {
            setBookings(res.bookings);
            checkConfirmedNotifications(res.bookings);
          }
          if (!silent) setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching bookings:', err);
          if (!silent) setLoading(false);
        });
    },
    [statusFilter, checkConfirmedNotifications]
  );

  // Initial load or when filter changes
  useEffect(() => {
    loadBookings(false);
  }, [loadBookings]);

  // Polling every 5 seconds (only when the browser tab is visible)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadBookings(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadBookings]);

  // Real-time WebSocket connection to events gateway
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join admin room
    socket.emit('join_room', { room: 'admin_room' });

    const handleBookingConfirmed = (payload: any) => {
      loadBookings(true);

      const bookingId = payload.bookingId || payload.id;
      if (bookingId && !knownConfirmedRef.current.has(bookingId)) {
        knownConfirmedRef.current.add(bookingId);
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('SevaTN: Booking Confirmed!', {
              body: `Booking #${payload.bookingCode || bookingId} has been successfully confirmed.`,
              icon: '/favicon.ico',
            });
          } catch (e) {
            console.error('Notification dispatch error:', e);
          }
        }
      }
    };

    const handleBookingUpdated = (payload: any) => {
      loadBookings(true);
    };

    socket.on('booking.confirmed', handleBookingConfirmed);
    socket.on('admin:booking_updated', handleBookingConfirmed);
    socket.on('booking:updated', handleBookingUpdated);

    return () => {
      socket.off('booking.confirmed', handleBookingConfirmed);
      socket.off('admin:booking_updated', handleBookingConfirmed);
      socket.off('booking:updated', handleBookingUpdated);
    };
  }, [loadBookings]);

  const handleClearAllQueues = () => {
    const activeCount = bookings.filter((b) =>
      !['SUCCESS', 'CANCELLED', 'FAILED', 'COMPLETED'].includes(b.status)
    ).length;

    setConfirmModalData({
      isOpen: true,
      title: 'Clear All Active Queues',
      description: `Cancel all ${activeCount || 'pending'} queued & executing requests, release held funds back to centres, and reset worker machines to idle?`,
      confirmLabel: 'Clear All Queues',
      isDestructive: true,
      action: async () => {
        setActionLoading(true);
        try {
          const res = await api.clearAllQueues();
          const text = `Queue Cleared: ${res.clearedBookings} bookings cancelled, ₹ ${res.releasedHolds * 100} hold funds refunded.`;
          toast.success(text);
          setStatusMessage({ type: 'success', text });
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
          loadBookings(false);
          setTimeout(() => setStatusMessage(null), 6000);
        } catch (err: any) {
          toast.error(err.message || 'Failed to clear all queues');
          setStatusMessage({ type: 'error', text: err.message || 'Failed to clear all queues' });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handlePurgeAllBookings = () => {
    const totalCount = bookings.length;
    setConfirmModalData({
      isOpen: true,
      title: '🚨 Permanent Database Purge',
      description: `PERMANENTLY delete all ${totalCount || ''} bookings, jobs, pilgrims, and attempts from the database? This action CANNOT be undone.`,
      confirmLabel: 'Permanently Purge Database',
      isDestructive: true,
      action: async () => {
        setActionLoading(true);
        try {
          const res = await api.purgeAllBookings();
          const text = `Database Purged: Deleted ${res.deletedBookings} bookings, refunded ${res.releasedHolds} holds.`;
          toast.success(text);
          setStatusMessage({ type: 'success', text });
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
          loadBookings(false);
          setTimeout(() => setStatusMessage(null), 6000);
        } catch (err: any) {
          toast.error(err.message || 'Failed to purge bookings');
          setStatusMessage({ type: 'error', text: err.message || 'Failed to purge bookings' });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleCancelBooking = (id: string, bookingCode: string) => {
    setConfirmModalData({
      isOpen: true,
      title: `Cancel Booking #${bookingCode}`,
      description: `Cancel booking #${bookingCode} and immediately release held deposit back to the centre wallet?`,
      confirmLabel: 'Cancel Booking',
      isDestructive: true,
      action: async () => {
        setCancellingId(id);
        try {
          await api.cancelBooking(id);
          const text = `Booking #${bookingCode} cancelled successfully and held funds released.`;
          toast.success(text);
          setStatusMessage({ type: 'success', text });
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
          loadBookings(false);
          setTimeout(() => setStatusMessage(null), 4000);
        } catch (err: any) {
          toast.error(err.message || 'Failed to cancel booking');
          setStatusMessage({ type: 'error', text: err.message || 'Failed to cancel booking' });
        } finally {
          setCancellingId(null);
        }
      },
    });
  };

  const isDatePassed = (b: any) => {
    if (!b) return false;
    const note = String(b?.requiresHumanNote || b?.failureReason || b?.errorMessage || '');
    if (note.includes('passed') || note.includes('Auto-cancelled') || note.includes('past')) {
      return true;
    }
    const dateStr = b?.requestedDateStr || (b?.requestedDate ? String(b.requestedDate).split('T')[0] : '');
    if (!dateStr) return false;
    let today = '';
    try {
      today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    } catch {
      today = new Date().toISOString().split('T')[0];
    }
    return dateStr < today;
  };

  const isSuccessOrCompleted = (b: any) => {
    if (!b) return false;
    const status = typeof b === 'string' ? b : b.status;
    if (['SUCCESS', 'COMPLETED', 'BOOKING_CONFIRMED', 'CONFIRMED'].includes(status)) {
      return true;
    }
    const ref = typeof b === 'object' ? (b.officialBookingReference || b.officialReference) : null;
    const isCartId = b && b.cartId && ref === b.cartId;
    if (ref && String(ref).trim().length > 0 && !isCartId && !String(ref).startsWith('SAB-2026-')) {
      return true;
    }
    return false;
  };

  const isCancelled = (b: any) => {
    if (!b) return false;
    const status = typeof b === 'string' ? b : b.status;
    return status === 'CANCELLED';
  };

  const isFailed = (b: any) => {
    if (!b) return false;
    if (isSuccessOrCompleted(b)) return false;
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
      status === 'RETRYABLE_FAILURE' ||
      status === 'DATE_SELECTION_FAILED' ||
      status === 'HOLD_INVALID_NOMINEE' ||
      status.includes('FAIL') ||
      status.includes('ERROR')
    );
  };

  const isRestartable = (b: any) => {
    if (!b) return false;
    // Never restart confirmed / success passes
    if (isSuccessOrCompleted(b)) return false;
    // Never restart if Darshan date has passed / finished
    if (isDatePassed(b)) return false;
    // Only CANCELLED and FAILED bookings can be restarted
    return isCancelled(b) || isFailed(b);
  };

  const handleRestartBooking = (id: string, bookingCode: string) => {
    setConfirmModalData({
      isOpen: true,
      title: `Restart Booking #${bookingCode}`,
      description: `Restart booking #${bookingCode} and return it to availability monitoring? Once the requested date is confirmed AVAILABLE on the official portal, execution will trigger automatically. If previously cancelled, deposit hold will be re-reserved from the centre wallet.`,
      confirmLabel: 'Restart Booking',
      isDestructive: false,
      action: async () => {
        setRestartingId(id);
        try {
          const res = await api.restartBooking(id);
          const text = res.message || `Booking #${bookingCode} restarted successfully!`;
          toast.success(text);
          setStatusMessage({ type: 'success', text });
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
          loadBookings(false);
          setTimeout(() => setStatusMessage(null), 4000);
        } catch (err: any) {
          toast.error(err.message || 'Failed to restart booking');
          setStatusMessage({ type: 'error', text: err.message || 'Failed to restart booking' });
        } finally {
          setRestartingId(null);
        }
      },
    });
  };

  const handleRestartAll = () => {
    const restartableCount = bookings.filter(isRestartable).length;
    setConfirmModalData({
      isOpen: true,
      title: 'Restart All Failed & Cancelled Bookings',
      description: `Restart all ${restartableCount || ''} eligible failed and cancelled booking requests with upcoming dates and return them to availability monitoring?`,
      confirmLabel: 'Restart All',
      isDestructive: false,
      action: async () => {
        setActionLoading(true);
        try {
          const res = await api.restartAllBookings();
          const text = res.message || `Restart completed: ${res.restarted} restarted, ${res.skipped} skipped.`;
          toast.success(text);
          setStatusMessage({ type: 'success', text });
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
          loadBookings(false);
          setTimeout(() => setStatusMessage(null), 6000);
        } catch (err: any) {
          toast.error(err.message || 'Failed to restart bookings');
          setStatusMessage({ type: 'error', text: err.message || 'Failed to restart bookings' });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleRecoverStale = async () => {
    try {
      const res = await api.request('/workers/recover-stale', { method: 'POST' });
      setStatusMessage({
        type: 'success',
        text: `Stale leases recovered: ${res.recoveredCount} job(s) returned to cloud queue.`,
      });
      loadBookings(false);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Recovery trigger failed');
    }
  };

  const filtered = bookings.filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.bookingCode?.toLowerCase().includes(term) ||
      b.user?.centre?.centreName?.toLowerCase().includes(term) ||
      b.user?.name?.toLowerCase().includes(term) ||
      b.officialReference?.toLowerCase().includes(term) ||
      b.assignedMachine?.machineCode?.toLowerCase().includes(term)
    );
  });

  const activeQueuesCount = bookings.filter((b) =>
    !['SUCCESS', 'CANCELLED', 'FAILED', 'COMPLETED'].includes(b.status)
  ).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-text-primary">Central Booking Queue & Dispatch</h1>
            {activeQueuesCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                {activeQueuesCount} Active in Queue
              </span>
            )}
          </div>
          <p className="text-xs text-secondary-500 mt-0.5">
            Network-wide booking dispatch, machine job leases, slot watcher health, and queue clearing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Notification Permission Toggle */}
          {notificationPermission === 'granted' ? (
            <div
              className="inline-flex items-center gap-1.5 rounded-btn border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-subtle"
              title="Desktop notifications are enabled for confirmed bookings"
            >
              <BellRing className="h-4 w-4 text-emerald-600" />
              <span>Notifications Active</span>
            </div>
          ) : notificationPermission === 'denied' ? (
            <button
              onClick={() =>
                alert(
                  'Notifications are blocked by your browser. Please enable notifications in your browser site permissions to receive booking confirmation alerts.'
                )
              }
              className="inline-flex items-center gap-1.5 rounded-btn border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors shadow-subtle cursor-pointer"
              title="Notifications blocked in browser settings"
            >
              <BellOff className="h-4 w-4 text-red-500" />
              <span>Notifications Blocked</span>
            </button>
          ) : (
            <button
              onClick={handleRequestNotificationPermission}
              className="inline-flex items-center gap-1.5 rounded-btn border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900 transition-colors shadow-subtle cursor-pointer animate-pulse"
              title="Enable browser notifications for confirmed bookings"
            >
              <Bell className="h-4 w-4 text-amber-700" />
              <span>Enable Notifications</span>
            </button>
          )}

          {/* Telegram Alerts Indicator */}
          <Link
            href="/admin/config"
            className={`inline-flex items-center gap-1.5 rounded-btn border px-3 py-2 text-xs font-semibold shadow-subtle transition-colors ${
              telegramConfig.enabled && telegramConfig.hasCreds
                ? 'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100'
                : 'border-neutral-200 bg-white text-secondary-500 hover:bg-neutral-50'
            }`}
            title={
              telegramConfig.enabled && telegramConfig.hasCreds
                ? 'Telegram Notifier Bot is active. Notifications are dispatched for Action Required, Worker Error, Cancel, and Success.'
                : 'Telegram Notifier Bot is disabled or missing credentials. Click to configure in /admin/config.'
            }
          >
            <Send className={`h-3.5 w-3.5 ${telegramConfig.enabled && telegramConfig.hasCreds ? 'text-sky-600' : 'text-neutral-400'}`} />
            <span>
              {telegramConfig.enabled && telegramConfig.hasCreds ? 'Telegram Alerts Active' : 'Telegram Bot Inactive'}
            </span>
          </Link>

          {/* Live Polling Indicator */}
          <div
            className="inline-flex items-center gap-1.5 rounded-btn border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs font-semibold text-secondary-600 shadow-subtle"
            title="Auto-refreshing every 5 seconds when tab is active"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px]">Live (5s)</span>
          </div>

          {/* Create Booking Action for Admin & Super Admin */}
          <Link
            href="/dashboard/bookings/new"
            className="flex items-center gap-1.5 rounded-btn bg-[#C98219] hover:bg-[#B57414] text-white px-3.5 py-2 text-xs font-bold transition-colors shadow-subtle cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Booking</span>
          </Link>

          {/* Restart All Failed & Cancelled Action (visible only when eligible bookings exist) */}
          {bookings.filter(isRestartable).length > 0 && (
            <button
              onClick={handleRestartAll}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-btn border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3.5 py-2 text-xs font-bold transition-colors shadow-subtle disabled:opacity-50 cursor-pointer"
              title="Restart all failed and cancelled bookings with upcoming dates"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
              ) : (
                <RotateCcw className="h-4 w-4 text-emerald-700" />
              )}
              <span>Restart All ({bookings.filter(isRestartable).length})</span>
            </button>
          )}

          {/* Clear All Queues Action */}
          <button
            onClick={handleClearAllQueues}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-btn border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 px-3.5 py-2 text-xs font-bold transition-colors shadow-subtle disabled:opacity-50 cursor-pointer"
            title="Cancel all pending/active queues and release wallet holds"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
            ) : (
              <RotateCcw className="h-4 w-4 text-amber-700" />
            )}
            <span>Clear Queues</span>
          </button>

          {/* Purge All DB Bookings Action */}
          <button
            onClick={handlePurgeAllBookings}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-btn border border-red-300 bg-red-600 text-white hover:bg-red-700 px-3.5 py-2 text-xs font-bold transition-colors shadow-subtle disabled:opacity-50 cursor-pointer"
            title="Permanently delete all bookings and jobs from the database"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Trash2 className="h-4 w-4 text-white" />
            )}
            <span>Purge All Bookings</span>
          </button>

          <button
            onClick={handleRecoverStale}
            className="flex items-center gap-2 rounded-btn border border-border-default bg-white px-3.5 py-2 text-xs font-semibold text-secondary-700 hover:bg-neutral-50 transition-colors shadow-subtle"
          >
            <RotateCcw className="h-4 w-4 text-brand-600" />
            <span>Recover Stale</span>
          </button>

          <button
            onClick={() => loadBookings(false)}
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-border-default bg-white text-secondary-600 hover:bg-neutral-50 hover:text-text-primary transition-colors shadow-subtle"
            title="Refresh List"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2.5 rounded-panel border p-3.5 text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/90 text-emerald-900'
              : 'border-red-200 bg-red-50/90 text-red-900'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
          ) : (
            <AlertOctagon className="h-4 w-4 text-red-700 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'QUEUED', 'ASSIGNED', 'WATCHING', 'AVAILABILITY_FOUND', 'BOOKING', 'SUCCESS', 'REQUIRES_HUMAN', 'WORKER_ERROR', 'CANCELLED', 'FAILED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-btn px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-secondary-600 border border-border-default hover:bg-neutral-50 hover:text-text-primary'
              }`}
            >
              {s === 'ALL' ? 'All Queue' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search code, centre, worker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-input border border-border-default bg-white pl-8 pr-3 py-1.5 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-card border border-border-default bg-white shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No bookings match filter"
              description="No booking jobs found matching the selected status and search query."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-left text-secondary-500 bg-neutral-50/50">
                  <th className="py-2.5 px-4 font-semibold">Booking ID</th>
                  <th className="py-2.5 px-4 font-semibold">Centre & Operator</th>
                  <th className="py-2.5 px-4 font-semibold">Route & Date</th>
                  <th className="py-2.5 px-4 font-semibold">Devotees</th>
                  <th className="py-2.5 px-4 font-semibold">Assigned PC</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Official Ref</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filtered.map((b) => {
                  const canCancel = !['SUCCESS', 'CANCELLED', 'FAILED', 'COMPLETED'].includes(b.status);
                  const canRestart = isRestartable(b);
                  const isCancelling = cancellingId === b.id;
                  const isRestarting = restartingId === b.id;

                  return (
                    <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-text-primary">
                        {b.bookingCode}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-text-primary">{b.user?.centre?.centreName || b.user?.name}</p>
                        <p className="text-[10.5px] text-secondary-500">{b.user?.centre?.district || 'Tamil Nadu'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-text-primary">{b.route}</p>
                        <p className="text-[10.5px] text-secondary-500">{formatDate(b.requestedDate)}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-secondary-700">
                        {b.pilgrimCount} Devotee{b.pilgrimCount !== 1 ? 's' : ''}
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          if (b.status === 'CANCELLED') {
                            return (
                              <span className="text-secondary-400 font-normal italic text-xs">Pending Assignment</span>
                            );
                          }
                          const worker = b.status === 'EXECUTING'
                            ? (b.assignedMachine || b.monitoringWorker)
                            : (b.monitoringWorker || b.assignedMachine);
                          const isExecuting = b.status === 'EXECUTING' || b.executionStatus === 'RUNNING';
                          const isDead = worker?.lastHeartbeat ? (Date.now() - new Date(worker.lastHeartbeat).getTime() > 45000) : false;
                          const isStopped = worker?.status === 'STOPPED';
                          const isOffline = !isStopped && isDead;
                          const isChecking = !isExecuting && (b.isWatching || ['WAITING_FOR_DATE_AVAILABILITY', 'WATCHING', 'FAST_BOOKING_QUEUED', 'PENDING'].includes(b.status));
                          
                          if (worker?.machineCode) {
                            return (
                              <div className="flex flex-col space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-semibold text-text-primary text-xs">
                                    {worker.machineCode} — {worker.machineName || worker.machineCode}
                                  </span>
                                  {isStopped && (
                                    <span className="text-[9.5px] px-1.5 py-0.5 rounded font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                      Stopped
                                    </span>
                                  )}
                                  {isOffline && (
                                    <span className="text-[9.5px] px-1.5 py-0.5 rounded font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                      Offline
                                    </span>
                                  )}
                                </div>
                                <span className={`text-[11px] font-medium ${
                                  isStopped
                                    ? 'text-amber-700 font-semibold'
                                    : isOffline
                                    ? 'text-rose-700 font-semibold'
                                    : isExecuting
                                    ? 'text-amber-600 font-bold'
                                    : 'text-teal-600'
                                }`}>
                                  {isStopped
                                    ? 'Worker Stopped'
                                    : isOffline
                                    ? 'Worker Offline'
                                    : isExecuting
                                    ? 'Status: Booking Execution'
                                    : (isChecking ? 'Status: Checking Availability' : `Status: ${b.status}`)}
                                </span>
                                {(b.totalRefreshCount !== undefined || b.lastRefreshResult) && (
                                  <span className="text-[9.5px] text-secondary-500 font-mono">
                                    Refreshes: <strong>{b.totalRefreshCount ?? 0}</strong> • {b.lastRefreshResult || 'PENDING'}
                                    {b.lastRefreshAt && ` (${new Date(b.lastRefreshAt).toLocaleTimeString()})`}
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return (
                            <span className="text-secondary-400 font-normal italic text-xs">Pending Assignment</span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <StateBadge status={b.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {b.officialReference || <span className="text-secondary-400 font-normal font-sans">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {canRestart && (
                            <button
                              onClick={() => handleRestartBooking(b.id, b.bookingCode)}
                              disabled={isRestarting}
                              className="inline-flex items-center gap-1 rounded-btn border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors disabled:opacity-50"
                              title="Restart this failed or cancelled booking and return to availability monitoring"
                            >
                              {isRestarting ? (
                                <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                              ) : (
                                <RotateCcw className="h-3 w-3 text-emerald-600" />
                              )}
                              <span>Restart</span>
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => handleCancelBooking(b.id, b.bookingCode)}
                              disabled={isCancelling}
                              className="inline-flex items-center gap-1 rounded-btn border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 hover:text-red-800 transition-colors disabled:opacity-50"
                              title="Cancel booking and refund 100 Chips deposit hold"
                            >
                              {isCancelling ? (
                                <Loader2 className="h-3 w-3 animate-spin text-red-600" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-600" />
                              )}
                              <span>Cancel</span>
                            </button>
                          )}
                          {['NEW', 'QUEUED', 'PENDING', 'FAST_BOOKING_QUEUED', 'REQUIRES_HUMAN', 'WORKER_ERROR', 'CANCELLED', 'SUCCESS', 'COMPLETED', 'BOOKING_CONFIRMED'].includes(b.status) && (
                            <button
                              onClick={() => handleNotifyTelegram(b.id, b.bookingCode)}
                              disabled={notifyingTelegramId === b.id}
                              className="inline-flex items-center gap-1 rounded-btn border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 hover:text-sky-800 transition-colors disabled:opacity-50"
                              title="Dispatch or resend alert to configured Telegram Bot"
                            >
                              {notifyingTelegramId === b.id ? (
                                <Loader2 className="h-3 w-3 animate-spin text-sky-600" />
                              ) : (
                                <Send className="h-3 w-3 text-sky-600" />
                              )}
                              <span>Telegram</span>
                            </button>
                          )}
                          <Link
                            href={`/dashboard/bookings/${b.id}`}
                            className="inline-flex items-center gap-1 rounded-btn border border-border-default bg-white px-2.5 py-1 text-[11px] font-semibold text-secondary-700 hover:bg-neutral-50 hover:text-text-primary transition-colors"
                          >
                            <Eye className="h-3 w-3 text-secondary-500" />
                            <span>Inspect</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmModalData.isOpen}
        title={confirmModalData.title}
        description={confirmModalData.description}
        confirmLabel={confirmModalData.confirmLabel}
        cancelLabel="Cancel"
        isDestructive={confirmModalData.isDestructive}
        loading={actionLoading || Boolean(cancellingId)}
        onConfirm={confirmModalData.action}
        onCancel={() => setConfirmModalData((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
