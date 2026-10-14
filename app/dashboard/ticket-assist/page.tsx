'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, formatDate, formatTime } from '@/lib/utils';
import { StateBadge } from '@/components/StateBadge';
import { MetricBlock } from '@/components/MetricBlock';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import {
  Wallet,
  CalendarCheck2,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export default function TicketAssistDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [centre, setCentre] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [serviceFee, setServiceFee] = useState<number>(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = api.getUser();
    setUser(u);

    Promise.all([
      api.getWallet().catch(() => null),
      api.getBookings('ALL', 1).catch(() => ({ bookings: [] })),
      api.request('/centres/me').catch(() => null),
      api.getBookingConfig().catch(() => null),
    ]).then(([walletData, bookingsData, centreData, cfg]) => {
      if (walletData) setWallet(walletData);
      if (bookingsData?.bookings) setBookings(bookingsData.bookings);
      if (centreData) setCentre(centreData);
      if (cfg?.serviceFee) setServiceFee(Number(cfg.serviceFee));
      setLoading(false);
    });
  }, []);

  const isCompletedBooking = (b: any) =>
    (b.officialReference && String(b.officialReference).trim().length > 0) ||
    b.status === 'SUCCESS' ||
    b.status === 'COMPLETED' ||
    b.status === 'BOOKING_CONFIRMED' ||
    b.status === 'WISHLIST_ADDED';

  const stats = {
    total: bookings.length,
    watching: bookings.filter(
      (b) =>
        !isCompletedBooking(b) &&
        (b.status === 'WATCHING' || b.status === 'QUEUED' || b.status === 'PENDING' || b.status === 'EXECUTING'),
    ).length,
    success: bookings.filter(isCompletedBooking).length,
    actionRequired: bookings.filter(
      (b) =>
        !isCompletedBooking(b) &&
        (b.status === 'REQUIRES_HUMAN' || b.status === 'OTP_REQUIRED' || b.status === 'CAPTCHA_REQUIRED'),
    ).length,
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-20" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton className="h-28" rows={1} />
          <LoadingSkeleton className="h-28" rows={1} />
          <LoadingSkeleton className="h-28" rows={1} />
          <LoadingSkeleton className="h-28" rows={1} />
        </div>
        <LoadingSkeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Platform Breadcrumb / Context Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E6EAF0]">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-[6px] border border-[#D0D5DD] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#667085]" />
            <span>SevaTN Platform Home</span>
          </Link>
          <span className="text-xs text-[#98A2B3]">/</span>
          <span className="text-xs font-bold text-[#C98219] flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            TicketAssist Service
          </span>
        </div>

        {/* Quick Action */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bookings/new"
            className="flex items-center gap-1.5 rounded-[7px] bg-[#C98219] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle"
          >
            <Plus className="h-4 w-4" />
            <span>New Booking</span>
          </Link>
        </div>
      </div>

      {/* Top Welcome & Centre Metadata Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-bold text-[#172033] tracking-tight">
            {getTimeGreeting()}, {user?.name || 'Operator'}
          </h1>
          <p className="mt-0.5 text-[13px] text-[#667085]">
            <span className="font-semibold text-[#344054]">{centre?.centreName || 'Seva Centre'}</span> • {centre?.district || 'Tamil Nadu'} ({centre?.taluk || 'Local'})
          </p>
        </div>
      </div>

      {/* Action Required Banner (If any booking requires human action) */}
      {stats.actionRequired > 0 && (
        <div className="flex items-center justify-between rounded-[8px] border border-[#FECDCA] bg-[#FEF3F2] p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[#D92D20] shrink-0" />
            <div>
              <p className="text-[13.5px] font-bold text-[#912018]">
                {stats.actionRequired} Booking Request(s) Require Operator Assistance
              </p>
              <p className="text-[12px] text-[#B42318]">
                Official portal presented verification challenges (OTP/CAPTCHA). Please review and complete manually.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/bookings?status=REQUIRES_HUMAN"
            className="rounded-[6px] bg-[#D92D20] px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-[#B42318] transition-colors"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* 4 Restrained KPI Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBlock
          label="Available Wallet"
          value={wallet ? formatINR(wallet.availableBalance) : '₹0.00'}
          subtext={`Reserved: ${wallet ? formatINR(wallet.reservedBalance) : '₹0.00'}`}
          icon={Wallet}
          variant="brand"
        />

        <MetricBlock
          label="Active Requests"
          value={stats.total}
          subtext={`${stats.watching} in queue or watching`}
          icon={CalendarCheck2}
          variant="info"
        />

        <MetricBlock
          label="Watching Slots"
          value={stats.watching}
          subtext="Compliant 5-min intervals"
          icon={Clock}
          variant="warning"
        />

        <MetricBlock
          label="Successful Passes"
          value={stats.success}
          subtext="Verified & settled passes"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/bookings/new"
          className="rounded-[8px] border border-[#E6EAF0] bg-white p-4 hover:border-[#C98219] hover:bg-[#FDF7ED]/40 transition-colors shadow-subtle flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#FDF7ED] text-[#C98219]">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-[#172033]">New Booking Request</p>
              <p className="text-[11.5px] text-[#667085]">Reserve ₹{serviceFee} from wallet</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#98A2B3]" />
        </Link>

        <Link
          href="/dashboard/wallet"
          className="rounded-[8px] border border-[#E6EAF0] bg-white p-4 hover:border-[#C98219] hover:bg-[#FDF7ED]/40 transition-colors shadow-subtle flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#EAF7EE] text-[#198754]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-[#172033]">Add Money to Wallet</p>
              <p className="text-[11.5px] text-[#667085]">Top up via UPI / Netbanking</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#98A2B3]" />
        </Link>

        <Link
          href="/dashboard/bookings"
          className="rounded-[8px] border border-[#E6EAF0] bg-white p-4 hover:border-[#C98219] hover:bg-[#FDF7ED]/40 transition-colors shadow-subtle flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#EDF4FC] text-[#3568A8]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-[#172033]">All Booking Requests</p>
              <p className="text-[11.5px] text-[#667085]">Track queue & results</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#98A2B3]" />
        </Link>
      </div>

      {/* Recent Booking Activity Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-[15px] font-bold text-[#172033]">Recent Booking Activity</h2>
            <p className="text-[12px] text-[#667085]">Live operational status across all active requests</p>
          </div>
          <Link
            href="/dashboard/bookings"
            className="text-[12.5px] font-semibold text-[#C98219] hover:underline flex items-center gap-1"
          >
            <span>View All ({bookings.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No booking requests yet"
              description="Submit your first devotee booking request to begin monitoring availability."
              actionLabel="Create New Booking"
              onAction={() => (window.location.href = '/dashboard/bookings/new')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-operational">
              <thead>
                <tr>
                  <th>Booking Code</th>
                  <th>Darshan Date</th>
                  <th>Route</th>
                  <th>Devotees</th>
                  <th>Status</th>
                  <th>Official Ref</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 7).map((b) => (
                  <tr key={b.id}>
                    <td className="font-bold text-[#172033] font-mono text-[13px]">{b.bookingCode}</td>
                    <td className="text-[#344054]">{formatDate(b.requestedDate)}</td>
                    <td className="font-medium text-[#172033]">{b.route}</td>
                    <td className="text-[#344054] tabular-nums">{b.pilgrimCount} Devotee(s)</td>
                    <td>
                      <StateBadge status={b.status} size="sm" />
                    </td>
                    <td className="font-mono text-[#198754] font-semibold text-[12px]">
                      {b.officialReference || '—'}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/dashboard/bookings/${b.id}`}
                        className="rounded-[6px] border border-[#D0D5DD] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#344054] hover:border-[#C98219] hover:text-[#C98219] transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
