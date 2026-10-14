'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { formatDate, formatTime, formatCurrency } from '../../../../lib/utils';
import { StateBadge } from '../../../../components/StateBadge';
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
} from 'lucide-react';

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
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [humanModalOpen, setHumanModalOpen] = useState(false);
  const [manualRef, setManualRef] = useState('');
  const [humanNotes, setHumanNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBooking = () => {
    if (!bookingId) return;
    api.getBookingById(bookingId)
      .then((data) => {
        setBooking(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBooking();
    // Live polling every 2.5 seconds
    const interval = setInterval(fetchBooking, 2500);
    return () => clearInterval(interval);
  }, [bookingId]);

  const handleResolveHuman = async (action: 'SUCCESS_CONFIRMED' | 'RETRY_QUEUE' | 'CANCEL') => {
    setActionLoading(true);
    try {
      await api.resolveHumanAction(bookingId, action, manualRef, humanNotes);
      setHumanModalOpen(false);
      fetchBooking();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !booking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#C98219] border-t-transparent" />
          <p className="text-[13px] text-[#667085] font-medium">Loading booking details...</p>
        </div>
      </div>
    );
  }

  const completed = isCompleted(booking);
  const pending = isPending(booking);
  const failed = isFailed(booking);
  const requiresHuman = booking.status === 'REQUIRES_HUMAN';
  const durationText = formatDuration(booking.createdAt, booking.updatedAt || booking.completedAt);

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
            <StateBadge status={booking.status} size="md" />
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

          {completed && (
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
        {completed && (
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
                  Pass positively registered on official portal. Booking service fee captured.
                </p>
                <div className="mt-3 flex items-center gap-3 flex-wrap text-[12.5px]">
                  <div className="flex items-center gap-1.5 bg-[#EAF7EE] border border-[#C3E6CB] px-3 py-1 rounded-[6px]">
                    <span className="text-[#155724] font-medium">Official Reference:</span>
                    <strong className="font-mono text-[#155724]">{booking.officialReference || 'WISH-CONFIRMED'}</strong>
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

        {/* State 3: ACTION REQUIRED / CHALLENGE */}
        {requiresHuman && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FDECEC] text-[#C2413B] shrink-0 shadow-subtle animate-bounce">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-[#992B26]">Action Required: Official Portal Challenge</h2>
                <p className="text-[13px] text-[#A8322B] mt-1 leading-relaxed">
                  Automated process safely paused because the official portal presented an OTP or verification challenge. Complete it manually and confirm below.
                </p>
                {booking.requiresHumanNote && (
                  <p className="mt-2 text-[12px] font-semibold text-[#992B26] bg-[#FDECEC] p-2.5 rounded border border-[#F8C4C2]">
                    Challenge Note: {booking.requiresHumanNote}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setHumanModalOpen(true)}
              className="rounded-[8px] bg-[#C2413B] hover:bg-[#A8322B] px-5 py-2.5 text-[13px] font-bold text-white transition-all shadow-subtle shrink-0 self-start sm:self-center"
            >
              Resolve Challenge
            </button>
          </div>
        )}

        {/* State 4: FAILED / CANCELLED */}
        {failed && !requiresHuman && (
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
                Held service fee ({formatCurrency(Number(booking.transactions?.find((t: any) => t.type === 'RESERVE' || t.type === 'CAPTURE')?.amount || 100))}) has been fully released back to your centre wallet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2 Balanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <span className="text-[#667085]">Assistance Service Fee:</span>
              <p className="font-mono font-bold text-[#172033] mt-0.5">
                {formatCurrency(Number(booking.transactions?.find((t: any) => t.type === 'RESERVE' || t.type === 'CAPTURE')?.amount || 100))}
              </p>
            </div>
            <div>
              <span className="text-[#667085]">Ledger Status:</span>
              <p className="font-semibold mt-0.5">
                {completed ? (
                  <span className="text-[#155724]">
                    Settled ({formatCurrency(Number(booking.transactions?.find((t: any) => t.type === 'RESERVE' || t.type === 'CAPTURE')?.amount || 100))} Assistance Fee Captured)
                  </span>
                ) : failed ? (
                  <span className="text-[#667085]">Released to Centre Wallet</span>
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

      {/* Devotees Information Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0] mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#C98219]" />
            <h2 className="text-[13px] font-bold text-[#172033] uppercase tracking-wider">
              Devotees
            </h2>
          </div>
          <span className="text-[12px] text-[#667085] font-medium">Source: Official Account Profile</span>
        </div>

        {booking.pilgrims && booking.pilgrims.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-[#E6EAF0] text-left text-[#667085] text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">#</th>
                  <th className="py-2.5 px-3 font-semibold">Devotee Full Name</th>
                  <th className="py-2.5 px-3 font-semibold">Age</th>
                  <th className="py-2.5 px-3 font-semibold">Gender</th>
                  <th className="py-2.5 px-3 font-semibold">ID Type</th>
                  <th className="py-2.5 px-3 font-semibold">Document Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3F8]">
                {booking.pilgrims.map((p: any, idx: number) => (
                  <tr key={p.id || idx} className="hover:bg-[#F9FAFB]">
                    <td className="py-3 px-3 font-mono text-[#98A2B3] font-bold">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-[#172033]">{p.fullName}</td>
                    <td className="py-3 px-3 font-mono text-[#172033]">{p.age}</td>
                    <td className="py-3 px-3 text-[#475467]">{p.gender}</td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#F0F3F8] border border-[#E6EAF0] text-[11px] font-semibold text-[#475467] uppercase">
                        {p.idType || 'Aadhaar'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#172033]">
                      {p.idNumber ? `•••• •••• ${p.idNumber.slice(-4)}` : '••••••••'}
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}
