'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { formatDate, formatTime, formatCurrency } from '../../../../lib/utils';
import { StateBadge } from '../../../../components/StateBadge';
import { useToast } from '../../../../components/ui/Toast';
import {
  ArrowLeft,
  ShieldCheck,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Compass,
  Printer,
  RotateCcw,
  Info,
  Calendar,
  CreditCard,
  Building,
  RefreshCw,
  KeyRound,
  Globe,
  Sparkles,
  BookmarkCheck,
  Zap,
  ChevronLeft,
  Lock,
  ExternalLink,
  ListOrdered,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  enrichPilgrimsWithQueueStatus,
  EnrichedPilgrim,
  BookingPilgrimSummary,
} from '../../../../lib/pilgrim-queue';

function isCompleted(b: any) {
  if (!b) return false;
  const status = typeof b === 'string' ? b : b.status;
  if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'BOOKING_CONFIRMED') {
    return true;
  }
  const ref = typeof b === 'object' ? (b.officialBookingReference || b.officialReference || b.portalTransactionReference) : null;
  const isCartId = b && b.cartId && ref === b.cartId;
  if (ref && String(ref).trim().length > 0 && !isCartId && !String(ref).startsWith('SAB-2026-')) {
    return true;
  }
  return false;
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
    status === 'WORKER_ERROR'
  );
}

function isPending(b: any) {
  const status = typeof b === 'string' ? b : b?.status;
  return !isCompleted(b) && !isFailed(b) && status !== 'CANCELLED' && status !== 'REQUIRES_HUMAN';
}

// Live elapsed counter
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

  return <span className="font-mono font-bold">{elapsed}</span>;
}

// Helper to format runtime duration
function formatDuration(startDate: string | Date, endDate?: string | Date) {
  if (!endDate) return '';
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffSecs = Math.max(1, Math.floor((end - start) / 1000));

  if (diffSecs < 60) return `${diffSecs} seconds`;
  const mins = Math.floor(diffSecs / 60);
  const secs = diffSecs % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [humanModalOpen, setHumanModalOpen] = useState(false);
  const [manualRef, setManualRef] = useState('');
  const [humanNotes, setHumanNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Super Admin manual devotee completion modal states
  const [manualCompleteModalOpen, setManualCompleteModalOpen] = useState(false);
  const [selectedPilgrim, setSelectedPilgrim] = useState<any>(null);
  const [adminReason, setAdminReason] = useState('');
  const [completingDevotee, setCompletingDevotee] = useState(false);

  const fetchBooking = () => {
    if (!bookingId) return;
    api.getBookingById(bookingId)
      .then((data) => {
        setBooking(data);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Access denied: You do not have permission to view this booking.');
        setLoading(false);
      });
  };

  useEffect(() => {
    const u = api.getUser();
    setCurrentUser(u);
    if (u?.role === 'DISTRIBUTOR') {
      window.location.replace(`/distributor/bookings/${bookingId}`);
      return;
    }
    fetchBooking();
    // Live polling every 2.5 seconds
    const interval = setInterval(fetchBooking, 2500);
    return () => clearInterval(interval);
  }, [bookingId]);

  const handleResolveHuman = async (action: 'SUCCESS_CONFIRMED' | 'RETRY_QUEUE' | 'CANCEL') => {
    setActionLoading(true);
    try {
      await api.resolveHumanAction(bookingId, action, manualRef, humanNotes);
      toast.success(
        action === 'SUCCESS_CONFIRMED'
          ? 'Booking confirmed successfully.'
          : action === 'RETRY_QUEUE'
          ? 'Returned to queue for next attempt.'
          : 'Booking cancelled.'
      );
      setHumanModalOpen(false);
      fetchBooking();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !booking && !error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#C98219] border-t-transparent" />
          <p className="text-[13px] text-[#667085] font-medium">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="w-full max-w-[600px] mx-auto py-16 px-4">
        <div className="rounded-[12px] border border-[#FDA29B] bg-white p-8 text-center space-y-4 shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3F2] text-[#D92D20] border border-[#FECDCA]">
            <Lock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#172033]">Booking Access Denied</h2>
            <p className="text-xs text-[#667085] max-w-sm mx-auto leading-relaxed">
              {error || 'This booking belongs to another centre or user and is isolated from your account under SevaTN tenant security.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard/bookings"
              className="inline-flex items-center gap-2 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] px-5 py-2.5 text-xs font-bold text-white transition-all shadow-subtle"
            >
              <span>Return to Bookings Queue</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { enrichedPilgrims, summary } = enrichPilgrimsWithQueueStatus(booking?.pilgrims, booking);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const totalDevotees = summary.totalDevotees;
  const confirmedPilgrimsCount = summary.confirmedCount;
  const deferredDevoteesCount = summary.deferredCount;
  const pendingDevoteesCount = summary.pendingCount;

  // Parent booking must not appear completed until every requested pilgrim is confirmed
  const isFullyConfirmed = summary.isAllConfirmed;
  const completed = isFullyConfirmed && isCompleted(booking);

  const isPartiallyConfirmed = summary.isPartiallyConfirmed;
  const pending = !isPartiallyConfirmed && !isFullyConfirmed && isPending(booking);
  const failed = !isPartiallyConfirmed && !isFullyConfirmed && isFailed(booking);
  const requiresHuman = false;
  const durationText = formatDuration(booking.createdAt, booking.updatedAt || booking.completedAt);

  const nextDevoteeSequence = summary.nextPilgrim
    ? summary.nextPilgrim.taskIndex
    : Math.min(totalDevotees, confirmedPilgrimsCount + 1);

  return (
    <div className="w-full max-w-[1400px] space-y-6">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6EAF0]">
        <div>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#667085] hover:text-[#C98219] transition-colors mb-1.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to Bookings</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#172033] tracking-tight">
              Booking #{booking.bookingCode}
            </h1>
            <StateBadge status={isFullyConfirmed ? 'SUCCESS' : (isPartiallyConfirmed ? 'PARTIALLY_CONFIRMED' : booking.status)} size="md" />
          </div>
          <p className="text-[12.5px] text-[#667085] mt-0.5">
            Created on {formatDate(booking.createdAt)} at {formatTime(booking.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {requiresHuman && (
            <button
              onClick={() => setHumanModalOpen(true)}
              className="flex items-center gap-2 rounded-[7px] bg-[#C2413B] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#A8322B] transition-colors shadow-subtle animate-pulse"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Resolve Verification Challenge</span>
            </button>
          )}

          {(completed || isFullyConfirmed) && (
            <a
              href="https://sabarimalaonline.org/#/login"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-[7px] border border-[#198754]/40 bg-[#EAF7EE] px-4 py-2 text-[12.5px] font-bold text-[#155724] hover:bg-[#d4f0dc] transition-colors shadow-subtle"
            >
              <ExternalLink className="h-4 w-4 text-[#198754]" />
              <span>Download Pass</span>
            </a>
          )}

          <button
            onClick={fetchBooking}
            className="flex h-9 w-9 items-center justify-center rounded-[7px] border border-[#D0D5DD] bg-white text-[#475467] hover:bg-[#F9FAFB] hover:text-[#172033] transition-colors shadow-subtle"
            title="Refresh Status"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PROGRESS / STATUS HERO ANIMATION CARD */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle">
        {/* State 0: PARTIALLY CONFIRMED (Sequential devotee progress) */}
        {isPartiallyConfirmed && pendingDevoteesCount > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF8FF] text-[#175CD3] shrink-0 shadow-subtle">
                  <BookmarkCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#175CD3] flex items-center gap-2">
                    <span>Partially Confirmed • Sequential Devotee Booking</span>
                    <span className="inline-flex items-center rounded-full bg-[#EFF8FF] px-2.5 py-0.5 text-[11px] font-bold text-[#175CD3] border border-[#B2DDFF]">
                      {confirmedPilgrimsCount} of {totalDevotees} Confirmed
                    </span>
                  </h2>
                  <p className="text-[13px] text-[#344054] mt-1">
                    {confirmedPilgrimsCount} of {totalDevotees} devotees confirmed. Waiting in availability monitoring queue to process remaining {totalDevotees - confirmedPilgrimsCount} devotee(s).
                  </p>
                  <div className="mt-3 flex items-center gap-3 flex-wrap text-[12.5px]">
                    <div className="flex items-center gap-1.5 bg-[#EAF7EE] border border-[#C3E6CB] px-3 py-1 rounded-[6px]">
                      <span className="text-[#155724] font-medium">Official Txn ID:</span>
                      <strong className="font-mono text-[#155724]">{booking.portalTransactionReference || booking.officialReference || 'Verified'}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#EFF8FF] border border-[#B2DDFF] px-3 py-1 rounded-[6px]">
                      <span className="text-[#175CD3] font-medium">Devotee Progress:</span>
                      <span className="font-semibold text-[#175CD3]">
                        {confirmedPilgrimsCount} Confirmed • {deferredDevoteesCount} Deferred • {pendingDevoteesCount} Pending
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#FEF7E6] border border-[#F9DE9B] px-3 py-1 rounded-[6px]">
                      <span className="text-[#8F5A0D] font-medium">Next in Queue:</span>
                      <span className="font-semibold text-[#8F5A0D]">
                        Devotee #{nextDevoteeSequence} {summary.nextPilgrim ? `(${summary.nextPilgrim.fullName})` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <a
                href="https://sabarimalaonline.org/#/TransactionHistory"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[8px] bg-[#175CD3] hover:bg-[#154fc0] px-5 py-2.5 text-[13px] font-bold text-white transition-all shadow-subtle hover:shadow shrink-0 self-start sm:self-center"
              >
                <span>Download Devotee Pass</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2">
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#F0F3F8]">
                <div
                  className="h-full rounded-full bg-[#175CD3] transition-all"
                  style={{ width: `${Math.round((confirmedPilgrimsCount / totalDevotees) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11.5px] text-[#667085]">
                <span>{confirmedPilgrimsCount} of {totalDevotees} devotees booked</span>
                <span>Returning to availability queue for devotee #{nextDevoteeSequence}</span>
              </div>
            </div>
          </div>
        )}

        {/* State 1: IN PROGRESS / MONITORING QUEUE */}
        {pending && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF7E6] text-[#C98219] shadow-subtle shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C98219] opacity-25" />
                  <Clock className="h-6 w-6 relative z-10" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#172033] flex items-center gap-2">
                    <span>Monitoring Official Slot Availability</span>
                    <span className="inline-flex items-center rounded-full bg-[#FEF7E6] px-2 py-0.5 text-[11px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                      Active
                    </span>
                  </h2>
                  <p className="text-[13px] text-[#667085] mt-0.5">
                    Assigned worker terminal is actively polling the official portal for available darshan slots.
                  </p>
                </div>
              </div>

              <div className="rounded-[8px] bg-[#F7F9FC] border border-[#E6EAF0] px-4 py-2.5 text-right sm:shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">Active Runtime</p>
                <p className="text-[18px] font-bold text-[#C98219] font-mono">
                  <LiveTimer createdAt={booking.createdAt} />
                </p>
              </div>
            </div>

            {/* Smooth Progress Bar Animation */}
            <div className="space-y-1.5 pt-2">
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#F0F3F8]">
                <div className="h-full w-full rounded-full bg-[#C98219] animate-pulse" />
              </div>
              <div className="flex items-center justify-between text-[11.5px] text-[#667085]">
                <span>Scanning at compliant 5-min intervals</span>
                <span>Auto-recovery & failover enabled</span>
              </div>
            </div>
          </div>
        )}

        {/* State 2: COMPLETED / VERIFIED PASS */}
        {(isFullyConfirmed || completed) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF7EE] text-[#198754] shrink-0 shadow-subtle">
                <BookmarkCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-[#155724] flex items-center gap-2">
                  <span>Official Pass Confirmed</span>
                  <span className="inline-flex items-center rounded-full bg-[#EAF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#155724] border border-[#C3E6CB]">
                    Verified
                  </span>
                </h2>
                <p className="text-[13px] text-[#285e3a] mt-1">
                  Pass positively registered on official portal. Ticket fee captured.
                </p>
                <div className="mt-3 flex items-center gap-3 flex-wrap text-[12.5px]">
                  <div className="flex items-center gap-1.5 bg-[#EAF7EE] border border-[#C3E6CB] px-3 py-1 rounded-[6px]">
                    <span className="text-[#155724] font-medium">Official Reference:</span>
                    <strong className="font-mono text-[#155724]">{booking.officialBookingReference || booking.officialReference || booking.portalTransactionReference || 'Verified'}</strong>
                  </div>
                  {booking.cartId && (
                    <div className="flex items-center gap-1.5 bg-[#F0F3F8] border border-[#D0D5DD] px-3 py-1 rounded-[6px]" title="Portal shopping cart identifier">
                      <span className="text-[#475467] font-medium">Cart ID:</span>
                      <span className="font-mono text-[#475467]">{booking.cartId}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-[#F7F9FC] border border-[#E6EAF0] px-3 py-1 rounded-[6px]">
                    <span className="text-[#475467] font-medium">Ticket Fee:</span>
                    <span className={`font-semibold ${booking.financialStatus === 'CAPTURED' ? 'text-[#155724]' : 'text-[#8F5A0D]'}`}>
                      {booking.financialStatus === 'CAPTURED' ? '₹ 100.00 Captured' : (booking.financialStatus || 'Reserved')}
                    </span>
                  </div>
                  {durationText && (
                    <div className="flex items-center gap-1 text-[#285e3a] font-medium">
                      <Zap className="h-3.5 w-3.5 text-[#198754]" />
                      <span>Completed in {durationText}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <a
              href="https://sabarimalaonline.org/#/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[8px] bg-[#198754] hover:bg-[#146c43] px-5 py-2.5 text-[13px] font-bold text-white transition-all shadow-subtle hover:shadow shrink-0 self-start sm:self-center"
            >
              <span>Download your pass</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* State 4: FAILED / CANCELLED */}
        {failed && (
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FDECEC] text-[#C2413B] shrink-0 shadow-subtle">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#992B26]">Booking Request Concluded (Unconfirmed)</h2>
              <p className="text-[13px] text-[#A8322B] mt-1">
                Reason: {booking.failureReason || 'Slots unavailable or session expired.'}
              </p>
              <p className="text-[12px] text-[#667085] mt-1">
                Held ticket fee ({formatCurrency(Number(booking.transactions?.find((t: any) => t.type === 'RESERVE' || t.type === 'CAPTURE')?.amount || 100))}) has been fully released back to your centre wallet.
              </p>
              {booking.confirmationEvidence?.screenshot && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#992B26] mb-1.5 flex items-center gap-1.5">
                    📸 Captured Official Portal Screenshot:
                  </p>
                  <a
                    href={booking.confirmationEvidence.screenshot}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block group rounded-lg overflow-hidden border border-[#F8C4C2] bg-white shadow-sm hover:shadow-md transition-all max-w-[280px]"
                  >
                    <img
                      src={booking.confirmationEvidence.screenshot}
                      alt="Portal Failure Screenshot"
                      className="w-full h-auto max-h-[140px] object-cover object-top group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="block text-[11px] font-semibold text-center py-1 text-[#992B26] bg-[#FDECEC] border-t border-[#F8C4C2]">
                      Click to enlarge screenshot ↗
                    </span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3 Balanced Summary Cards: Origin, Devotee Account, Settlement Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Originating Operator & Tenant Details */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E6EAF0]">
            <Building className="h-4 w-4 text-[#175CD3]" />
            <h3 className="text-[12px] font-bold text-[#172033] uppercase tracking-wider">
              Originating Tenant & Operator
            </h3>
          </div>
          <div className="space-y-2 text-[12.5px]">
            <div>
              <span className="text-[#667085]">Booking Origin:</span>
              <p className="font-bold text-[#172033] mt-0.5">
                {booking.user?.centre?.centreName || booking.user?.name || 'Authorized Operator'}
                {booking.user?.role && (
                  <span className="ml-1.5 inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
                    {booking.user.role.replace('_', ' ')}
                  </span>
                )}
              </p>
            </div>
            {booking.user?.centre?.centreCode && (
              <div>
                <span className="text-[#667085]">Centre Code & Jurisdiction:</span>
                <p className="font-mono font-semibold text-[#475467] mt-0.5">
                  {booking.user.centre.centreCode} • {booking.user.centre.district || 'Tamil Nadu'}
                </p>
              </div>
            )}
            {booking.user?.distributor && (
              <div>
                <span className="text-[#667085]">Regional Distributor:</span>
                <p className="font-semibold text-[#175CD3] mt-0.5">
                  {booking.user.distributor.name} ({booking.user.distributor.distributorCode})
                </p>
              </div>
            )}
            <div>
              <span className="text-[#667085]">Devotees in Request:</span>
              <p className="font-semibold text-[#172033] mt-0.5">
                {booking.pilgrimCount || 1} Saved Pilgrim{(booking.pilgrimCount || 1) > 1 ? 's' : ''} ({booking.selectedPilgrimName || 'Auto-Selected from Account'})
              </p>
            </div>
            {(booking.nomineeName || (Array.isArray(booking.preferences?.nominees) && booking.preferences.nominees.length > 0)) && (
              <div>
                <span className="text-[#667085]">Customer Nominee{(booking.preferences?.nominees?.length || 1) > 1 ? 's' : ''}:</span>
                {Array.isArray(booking.preferences?.nominees) && booking.preferences.nominees.length > 1 ? (
                  <div className="mt-1 space-y-1">
                    {booking.preferences.nominees.map((nom: any, nIdx: number) => (
                      <p key={nIdx} className="font-semibold text-[#172033] text-[12px]">
                        #{nIdx + 1}: {nom.nomineeName} ({nom.nomineeAge} yrs • {nom.nomineeRelationship})
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="font-semibold text-[#172033] mt-0.5">
                    {booking.nomineeName} ({booking.nomineeAge} yrs • {booking.nomineeRelationship})
                  </p>
                )}
                {booking.nomineeValidationStatus && (
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF7EE] text-[#155724] border border-[#C3E6CB]">
                    Nominee: {booking.nomineeValidationStatus}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Official Account & Route Details */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E6EAF0]">
            <Globe className="h-4 w-4 text-[#C98219]" />
            <h3 className="text-[12px] font-bold text-[#172033] uppercase tracking-wider">
              Official Account & Route
            </h3>
          </div>
          <div className="space-y-2 text-[12.5px]">
            <div>
              <span className="text-[#667085]">Devotee Profile / Account:</span>
              <p className="font-bold text-[#172033] mt-0.5 flex items-center gap-1.5">
                <span>{booking.account?.label || booking.account?.username || 'Centre Official Account'}</span>
                {booking.account?.label && (
                  <span className="font-mono text-[11.5px] text-[#667085]">({booking.account?.username})</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-[#667085]">Requested Darshan Date:</span>
              <p className="font-bold text-[#172033] mt-0.5">{formatDate(booking.requestedDate)}</p>
            </div>
            <div>
              <span className="text-[#667085]">Approved Route:</span>
              <p className="font-semibold text-[#172033] mt-0.5">
                {booking.route}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Settlement Ledger */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E6EAF0]">
            <CreditCard className="h-4 w-4 text-[#198754]" />
            <h3 className="text-[12px] font-bold text-[#172033] uppercase tracking-wider">
              Settlement Ledger
            </h3>
          </div>
          <div className="space-y-2 text-[12.5px]">
            <div>
              <span className="text-[#667085]">Ticket Fee:</span>
              <p className="font-mono font-bold text-[#172033] mt-0.5">
                {formatCurrency(Number(booking.transactions?.find((t: any) => t.type === 'RESERVE' || t.type === 'CAPTURE')?.amount || 100))}
              </p>
            </div>
            <div>
              <span className="text-[#667085]">Ledger Status:</span>
              <p className="font-semibold mt-0.5">
                {completed ? (
                  <span className="text-[#155724]">
                    Settled ({formatCurrency(Number(booking.transactions?.find((t: any) => t.type === 'RESERVE' || t.type === 'CAPTURE')?.amount || 100))} Captured)
                  </span>
                ) : failed ? (
                  <span className="text-[#667085]">Released to Wallet</span>
                ) : (
                  <span className="text-[#8F5A0D]">Held in Reservation Ledger</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-[#667085]">Safety Guarantee:</span>
              <p className="text-[#667085] mt-0.5">Zero charge if pass is unconfirmed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sequential Devotee Execution & Live Queue Section */}
      <div className="space-y-4">
        {/* Metric Summary Cards for Sequential Devotee Execution */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-3.5 shadow-subtle">
            <div className="flex items-center justify-between text-[#667085] text-[11px] font-bold uppercase tracking-wider">
              <span>Total Devotees</span>
              <Users className="h-4 w-4 text-[#475467]" />
            </div>
            <p className="mt-2 text-[20px] font-extrabold text-[#172033]">{summary.totalDevotees}</p>
            <p className="text-[11px] text-[#667085] mt-0.5">In booking request</p>
          </div>

          <div className="rounded-[10px] border border-[#C3E6CB] bg-[#F4FBF6] p-3.5 shadow-subtle">
            <div className="flex items-center justify-between text-[#155724] text-[11px] font-bold uppercase tracking-wider">
              <span>Confirmed</span>
              <CheckCircle2 className="h-4 w-4 text-[#198754]" />
            </div>
            <p className="mt-2 text-[20px] font-extrabold text-[#155724]">{summary.confirmedCount}</p>
            <p className="text-[11px] text-[#285e3a] mt-0.5">Verified on portal</p>
          </div>

          <div className="rounded-[10px] border border-[#B2DDFF] bg-[#F5FAFF] p-3.5 shadow-subtle">
            <div className="flex items-center justify-between text-[#175CD3] text-[11px] font-bold uppercase tracking-wider">
              <span>Processing</span>
              <Cpu className="h-4 w-4 text-[#175CD3]" />
            </div>
            <p className="mt-2 text-[14px] font-extrabold text-[#175CD3] truncate" title={summary.activePilgrim ? summary.activePilgrim.fullName : 'None'}>
              {summary.activePilgrim ? summary.activePilgrim.fullName : '—'}
            </p>
            <p className="text-[11px] text-[#175CD3] mt-0.5">
              {summary.activePilgrim ? `Attempt #${summary.activePilgrim.attemptCount + 1}` : 'Idle between scans'}
            </p>
          </div>

          <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEFBF2] p-3.5 shadow-subtle">
            <div className="flex items-center justify-between text-[#8F5A0D] text-[11px] font-bold uppercase tracking-wider">
              <span>Next in Queue</span>
              <ListOrdered className="h-4 w-4 text-[#C98219]" />
            </div>
            <p className="mt-2 text-[14px] font-extrabold text-[#8F5A0D] truncate" title={summary.nextPilgrim ? summary.nextPilgrim.fullName : 'None'}>
              {summary.nextPilgrim ? `#${summary.nextPilgrim.taskIndex} ${summary.nextPilgrim.fullName}` : '—'}
            </p>
            <p className="text-[11px] text-[#8F5A0D] mt-0.5">
              {summary.nextPilgrim?.deferralCount ? `Retry #${summary.nextPilgrim.deferralCount + 1} (FIFO)` : (summary.nextPilgrim ? 'Priority #1 initial' : 'All processed')}
            </p>
          </div>

          <div className="rounded-[10px] border border-[#FEDF89] bg-[#FFFCF5] p-3.5 shadow-subtle">
            <div className="flex items-center justify-between text-[#B54708] text-[11px] font-bold uppercase tracking-wider">
              <span>Deferred (Rotation)</span>
              <RotateCcw className="h-4 w-4 text-[#B54708]" />
            </div>
            <p className="mt-2 text-[20px] font-extrabold text-[#B54708]">{summary.deferredCount}</p>
            <p className="text-[11px] text-[#B54708] mt-0.5">Retrying in rotation</p>
          </div>
        </div>

        {/* Dynamic Rotation & Execution Highlight Alert */}
        {summary.activePilgrim ? (
          <div className="rounded-[8px] bg-[#EFF8FF] border border-[#B2DDFF] p-3.5 flex items-center justify-between gap-3 text-[12.5px]">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#175CD3] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#175CD3]" />
              </span>
              <div>
                <strong className="text-[#175CD3] font-bold">Currently Processing:</strong>{' '}
                <span className="text-[#172033] font-semibold">
                  Devotee #{summary.activePilgrim.taskIndex}: {summary.activePilgrim.fullName}
                </span>{' '}
                <span className="text-[#475467]">
                  (Attempt #{summary.activePilgrim.attemptCount + 1} actively submitting on official portal)
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#175CD3] text-white">
              LIVE ATTEMPT
            </span>
          </div>
        ) : summary.nextPilgrim && !isFullyConfirmed ? (
          <div className="rounded-[8px] bg-[#FEF7E6] border border-[#F9DE9B] p-3.5 flex items-center justify-between gap-3 text-[12.5px]">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[#C98219] shrink-0" />
              <div>
                <strong className="text-[#8F5A0D] font-bold">Next Devotee in Queue:</strong>{' '}
                <span className="text-[#172033] font-semibold">
                  Devotee #{summary.nextPilgrim.taskIndex}: {summary.nextPilgrim.fullName}
                </span>{' '}
                <span className="text-[#475467]">
                  {summary.nextPilgrim.deferralCount > 0
                    ? `— Priority #1 in FIFO queue following previous deferral (Attempt #${summary.nextPilgrim.attemptCount + 1} next).`
                    : '— Priority #1 for next available darshan slot.'}
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#C98219] text-white">
              WAITING FOR AVAILABILITY
            </span>
          </div>
        ) : isFullyConfirmed ? (
          <div className="rounded-[8px] bg-[#EAF7EE] border border-[#C3E6CB] p-3.5 flex items-center gap-3 text-[12.5px] text-[#155724]">
            <CheckCircle2 className="h-5 w-5 text-[#198754] shrink-0" />
            <div>
              <strong className="font-bold">All Devotees Confirmed:</strong> Every requested devotee in this booking has been authoritatively registered and verified on the official portal.
            </div>
          </div>
        ) : null}

        {/* Devotees Information Table */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0] mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#C98219]" />
              <h2 className="text-[13px] font-bold text-[#172033] uppercase tracking-wider">
                Devotees & Sequential Rotation Queue
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0F3F8] text-[#475467] border border-[#E6EAF0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#198754] animate-pulse" />
                Live 2.5s Polling
              </span>
              <span className="text-[12px] text-[#667085] font-medium hidden sm:inline">
                Source: Official Account Profile
              </span>
            </div>
          </div>

          {enrichedPilgrims && enrichedPilgrims.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-[#E6EAF0] text-left text-[#667085] text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-semibold">#</th>
                    <th className="py-2.5 px-3 font-semibold">Devotee Full Name</th>
                    <th className="py-2.5 px-3 font-semibold">Sequential Status</th>
                    <th className="py-2.5 px-3 font-semibold">Queue Order</th>
                    <th className="py-2.5 px-3 font-semibold">Attempts / Deferrals</th>
                    <th className="py-2.5 px-3 font-semibold">Last Attempt & Reason</th>
                    <th className="py-2.5 px-3 font-semibold">Official Ref / Txn ID</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Pass / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F3F8]">
                  {enrichedPilgrims.map((p, idx) => {
                    const isAdminCompleted = p.statusKey === 'ADMIN_COMPLETED';
                    const isConfirmed = p.statusKey === 'CONFIRMED';
                    const isProcessing = p.statusKey === 'PROCESSING';
                    const isNextInQueue = p.statusKey === 'NEXT_IN_QUEUE';
                    const isDeferred = p.statusKey === 'DEFERRED';
                    const isFailedStatus = p.statusKey === 'FAILED';

                    const officialRef = p.officialBookingReference || (isConfirmed ? (booking.portalTransactionReference || booking.officialReference) : null);

                    return (
                      <tr
                        key={p.id || idx}
                        className={`hover:bg-[#F9FAFB] transition-colors ${
                          isProcessing
                            ? 'bg-[#F0F7FF]/50 border-l-4 border-l-[#175CD3]'
                            : isNextInQueue
                            ? 'bg-[#FEFBF2]/40'
                            : ''
                        }`}
                      >
                        {/* Sequence # */}
                        <td className="py-3 px-3 font-mono text-[#98A2B3] font-bold">
                          #{p.taskIndex}
                        </td>

                        {/* Devotee Name & Demographic info */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#172033] flex items-center gap-1.5 flex-wrap">
                            <span>{p.fullName}</span>
                            {isProcessing && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#175CD3] text-white">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#667085] mt-0.5">
                            <span className="font-semibold text-[#344054]">{p.age}y</span> • {p.gender} •{' '}
                            <span className="uppercase">{p.idType}</span>:{' '}
                            <span className="font-mono">{p.idNumber ? `•••• ${p.idNumber.slice(-4)}` : '••••'}</span>
                          </div>
                        </td>

                        {/* Sequential Status Badge */}
                        <td className="py-3 px-3">
                          {isConfirmed ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#EAF7EE] text-[#155724] border border-[#C3E6CB]">
                                <CheckCircle2 className="h-3 w-3 text-[#198754]" />
                                Confirmed
                              </span>
                              <div className="text-[10px] text-[#285e3a] mt-0.5">
                                Confirmed on Portal
                              </div>
                            </div>
                          ) : isAdminCompleted ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                <ShieldCheck className="h-3 w-3 text-purple-600" />
                                Admin Completed
                              </span>
                              {p.adminReason && (
                                <div className="text-[10px] text-purple-700 mt-0.5 italic max-w-[200px] truncate" title={p.adminReason}>
                                  {p.adminReason}
                                </div>
                              )}
                            </div>
                          ) : isProcessing ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#175CD3] animate-ping" />
                                Processing Now
                              </span>
                              <div className="text-[10px] text-[#175CD3] mt-0.5">
                                Submitting to Wishlist
                              </div>
                            </div>
                          ) : isNextInQueue ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF7E6] text-[#8F5A0D] border border-[#F9DE9B]">
                                <Sparkles className="h-3 w-3 text-[#C98219]" />
                                Next in Queue
                              </span>
                              <div className="text-[10px] text-[#8F5A0D] mt-0.5">
                                {p.deferralCount > 0 ? `Priority #1 (Deferred #${p.deferralCount})` : 'Priority #1 Initial'}
                              </div>
                            </div>
                          ) : isDeferred ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFF4ED] text-[#B54708] border border-[#FEDF89]">
                                <RotateCcw className="h-3 w-3 text-[#B54708]" />
                                Deferred
                              </span>
                              <div className="text-[10px] text-[#B54708] mt-0.5">
                                Queued for Rotation
                              </div>
                            </div>
                          ) : isFailedStatus ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF3F2] text-[#D92D20] border border-[#FECDCA]">
                                <AlertTriangle className="h-3 w-3 text-[#D92D20]" />
                                Failed
                              </span>
                              <div className="text-[10px] text-[#D92D20] mt-0.5">
                                Request Concluded
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#F2F4F7] text-[#344054] border border-[#D0D5DD]">
                                <Clock className="h-3 w-3 text-[#475467]" />
                                Pending
                              </span>
                              <div className="text-[10px] text-[#667085] mt-0.5">
                                Waiting for Turn
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Queue Order & Priority */}
                        <td className="py-3 px-3">
                          {isConfirmed || isAdminCompleted ? (
                            <span className="text-[#98A2B3] text-[11px]">—</span>
                          ) : isProcessing ? (
                            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#175CD3]">
                              <ArrowRight className="h-3.5 w-3.5" />
                              Active Turn
                            </span>
                          ) : p.queuePosition === 1 ? (
                            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#8F5A0D]">
                              <span className="h-2 w-2 rounded-full bg-[#C98219]" />
                              Priority #1
                            </span>
                          ) : p.queuePosition ? (
                            <span className="text-[11.5px] font-semibold text-[#475467]">
                              Position #{p.queuePosition}
                            </span>
                          ) : (
                            <span className="text-[#98A2B3] text-[11px]">Queued</span>
                          )}
                        </td>

                        {/* Attempts & Deferrals */}
                        <td className="py-3 px-3">
                          <div className="text-[12px] font-medium text-[#172033]">
                            <span>{p.attemptCount} attempt{p.attemptCount === 1 ? '' : 's'}</span>
                          </div>
                          {p.deferralCount > 0 && (
                            <div className="mt-0.5">
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10.5px] font-bold bg-[#FFF4ED] text-[#B54708] border border-[#FEDF89]">
                                {p.deferralCount} deferral{p.deferralCount === 1 ? '' : 's'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Last Attempt & Reason */}
                        <td className="py-3 px-3 max-w-[240px]">
                          {p.lastAttemptedAt ? (
                            <div>
                              <div className="text-[11px] text-[#475467] font-mono">
                                {formatDate(p.lastAttemptedAt)} {formatTime(p.lastAttemptedAt)}
                              </div>
                              {p.lastFailureReason && (
                                <div
                                  className="mt-1 p-1.5 rounded bg-[#FEF3F2] border border-[#FECDCA] text-[10.5px] text-[#B42318] line-clamp-2"
                                  title={p.lastFailureReason}
                                >
                                  {p.lastFailureReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#98A2B3] text-[11px] italic">Not yet attempted</span>
                          )}
                        </td>

                        {/* Official Ref / Txn ID */}
                        <td className="py-3 px-3">
                          {officialRef ? (
                            <div>
                              <span className="font-mono font-bold text-[#155724] text-[12px]">
                                {officialRef}
                              </span>
                              {p.confirmedAt && (
                                <div className="text-[10px] text-[#667085] font-mono mt-0.5">
                                  {formatDate(p.confirmedAt)}
                                </div>
                              )}
                            </div>
                          ) : isAdminCompleted ? (
                            <span className="text-purple-700 font-sans text-[11px] font-medium italic">
                              Administrative Complete
                            </span>
                          ) : (
                            <span className="text-[#98A2B3] font-normal font-sans">—</span>
                          )}
                        </td>

                        {/* Pass / Actions */}
                        <td className="py-3 px-3 text-right">
                          {isConfirmed ? (
                            <a
                              href="https://sabarimalaonline.org/#/TransactionHistory"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-[6px] bg-[#EAF7EE] hover:bg-[#d4f0dc] px-2.5 py-1 text-[11px] font-bold text-[#155724] border border-[#C3E6CB] transition-colors"
                            >
                              <span>Download Pass</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : isAdminCompleted ? (
                            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              Manual Entry
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-2 justify-end">
                              <span className="text-[11px] text-[#98A2B3]">
                                {isProcessing ? 'Processing' : 'In Rotation'}
                              </span>
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPilgrim(p.raw || p);
                                    setAdminReason('');
                                    setManualCompleteModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold transition-colors"
                                  title="Manually complete this devotee as Super Admin"
                                >
                                  <ShieldCheck className="h-3 w-3 text-purple-600" />
                                  <span>Complete</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-[8px] bg-[#F7F9FC] p-4 border border-[#E6EAF0] flex items-center gap-3 text-[12.5px] text-[#475467]">
              <CheckCircle2 className="h-4 w-4 text-[#198754] shrink-0" />
              <p>
                All registered devotees from official account <strong>{booking.account?.username}</strong> are automatically synchronized and locked onto the official pass.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Human Resolution Modal */}
      {humanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[10px] bg-white p-6 border border-[#E6EAF0] shadow-modal">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0] mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#C2413B]" />
                <h3 className="text-[14px] font-bold text-[#172033]">
                  Operator Verification Challenge Resolution
                </h3>
              </div>
              <button
                onClick={() => setHumanModalOpen(false)}
                className="text-[#98A2B3] hover:text-[#172033] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-[12.5px]">
              <p className="text-[#667085] leading-relaxed">
                The official portal displayed a challenge. If you have completed the verification manually on the official site, enter the confirmed reference code below to reconcile this booking.
              </p>

              <div>
                <label className="block font-semibold text-[#344054] mb-1">
                  Official Confirmation / Wishlist Reference <span className="text-[#C2413B]">*</span>
                </label>
                <input
                  type="text"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="e.g. WISH-98214"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-[13px] font-mono text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#344054] mb-1">
                  Operator Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={humanNotes}
                  onChange={(e) => setHumanNotes(e.target.value)}
                  placeholder="Notes for ledger and audit trail..."
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-[13px] text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E6EAF0]">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleResolveHuman('CANCEL')}
                  className="rounded-[7px] border border-[#D0D5DD] px-3.5 py-1.5 font-semibold text-[#475467] hover:bg-[#F8FAFC]"
                >
                  Cancel Booking
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleResolveHuman('RETRY_QUEUE')}
                  className="rounded-[7px] border border-[#F9DE9B] bg-[#FEF7E6] px-3.5 py-1.5 font-semibold text-[#8F5A0D] hover:bg-[#FCE0A6]"
                >
                  Re-queue to Worker
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleResolveHuman('SUCCESS_CONFIRMED')}
                  className="rounded-[7px] bg-[#198754] px-4 py-1.5 font-bold text-white hover:bg-[#146c43] shadow-subtle"
                >
                  Confirm Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Manual Devotee Completion Modal */}
      {manualCompleteModalOpen && selectedPilgrim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[10px] bg-white p-6 border border-[#E6EAF0] shadow-modal">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0] mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <h3 className="text-[15px] font-extrabold text-[#172033]">
                  Super Admin Manual Devotee Completion
                </h3>
              </div>
              <button
                onClick={() => {
                  if (!completingDevotee) {
                    setManualCompleteModalOpen(false);
                    setSelectedPilgrim(null);
                  }
                }}
                disabled={completingDevotee}
                className="text-[#98A2B3] hover:text-[#172033] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-[12.5px]">
              <div className="rounded-[8px] bg-purple-50 p-3 border border-purple-200 text-purple-900 space-y-1">
                <p className="font-bold text-[13px]">
                  Devotee: {selectedPilgrim.fullName} ({selectedPilgrim.age}y, {selectedPilgrim.gender})
                </p>
                <p className="text-[12px] text-purple-700">
                  Booking #{booking.bookingCode} • ID: {selectedPilgrim.idType} ({selectedPilgrim.idNumber ? `•••• ${selectedPilgrim.idNumber.slice(-4)}` : '••••'})
                </p>
              </div>

              <div className="rounded-[8px] bg-amber-50 p-3 border border-amber-200 text-amber-900 text-[12px] flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Important:</strong> Marking this devotee as completed will assign status <code>ADMIN_COMPLETED</code> and <strong>permanently exclude them from future automated booking attempts</strong>. If remaining devotees exist, the parent booking will remain active in monitoring.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#344054] mb-1">
                  Administrative Reason / Justification <span className="text-[#C2413B]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={adminReason}
                  onChange={(e) => setAdminReason(e.target.value)}
                  placeholder="e.g. Official portal pass confirmed offline, manual slot allocated, or direct counter reservation verified..."
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-[13px] text-[#172033] focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E6EAF0]">
                <button
                  type="button"
                  disabled={completingDevotee}
                  onClick={() => {
                    setManualCompleteModalOpen(false);
                    setSelectedPilgrim(null);
                  }}
                  className="rounded-[7px] border border-[#D0D5DD] px-3.5 py-1.5 font-semibold text-[#475467] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={completingDevotee || !adminReason.trim()}
                  onClick={async () => {
                    if (!adminReason.trim()) {
                      toast.error('Please enter an administrative reason.');
                      return;
                    }
                    setCompletingDevotee(true);
                    try {
                      await api.completePilgrimManually(booking.id, selectedPilgrim.id, adminReason.trim());
                      toast.success(`Devotee ${selectedPilgrim.fullName} marked as completed.`);
                      setManualCompleteModalOpen(false);
                      setSelectedPilgrim(null);
                      setAdminReason('');
                      fetchBooking();
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to complete devotee');
                    } finally {
                      setCompletingDevotee(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-[7px] bg-purple-700 px-4 py-1.5 font-bold text-white hover:bg-purple-800 disabled:opacity-50 shadow-subtle"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{completingDevotee ? 'Completing...' : 'Confirm Manual Completion'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
