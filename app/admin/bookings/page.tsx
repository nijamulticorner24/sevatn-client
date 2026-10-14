'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { formatDate, formatTime } from '../../../lib/utils';
import { StateBadge } from '../../../components/StateBadge';
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
} from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadBookings = () => {
    setLoading(true);
    api.getBookings(statusFilter === 'ALL' ? undefined : statusFilter, 1)
      .then((res) => {
        if (res?.bookings) setBookings(res.bookings);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const handleClearAllQueues = async () => {
    const activeCount = bookings.filter((b) =>
      !['SUCCESS', 'CANCELLED', 'FAILED', 'COMPLETED'].includes(b.status)
    ).length;

    const confirmed = window.confirm(
      `⚠️ ARE YOU SURE YOU WANT TO CLEAR ALL ACTIVE QUEUES?\n\n` +
      `This will immediately:\n` +
      `1. Cancel all ${activeCount || 'pending'} queued & executing booking requests.\n` +
      `2. Automatically release all reserved funds (₹100/booking) back to centre wallets.\n` +
      `3. Terminate active jobs, release account locks, and reset worker machines to idle.\n\n` +
      `Click OK to proceed with complete queue clearing.`
    );

    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await api.clearAllQueues();
      setStatusMessage({
        type: 'success',
        text: `Queue Cleared: ${res.clearedBookings} bookings cancelled, ₹${res.releasedHolds * 100} hold funds refunded, ${res.cancelledJobs} jobs stopped, ${res.resetWorkers} workers reset.`,
      });
      loadBookings();
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to clear all queues',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (id: string, bookingCode: string) => {
    const confirmed = window.confirm(
      `Cancel booking #${bookingCode}?\n\nThis will cancel the booking request and release any held ₹100 deposit back to the centre wallet.`
    );
    if (!confirmed) return;

    setCancellingId(id);
    try {
      await api.cancelBooking(id);
      setStatusMessage({
        type: 'success',
        text: `Booking #${bookingCode} cancelled successfully and held funds released.`,
      });
      loadBookings();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || `Failed to cancel booking #${bookingCode}`,
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleRecoverStale = async () => {
    try {
      const res = await api.request('/workers/recover-stale', { method: 'POST' });
      setStatusMessage({
        type: 'success',
        text: `Stale leases recovered: ${res.recoveredCount} job(s) returned to cloud queue.`,
      });
      loadBookings();
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
    <div className="space-y-6 max-w-7xl mx-auto">
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
          {/* Clear All Queues Action */}
          <button
            onClick={handleClearAllQueues}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-btn border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 px-3.5 py-2 text-xs font-bold transition-colors shadow-subtle disabled:opacity-50"
            title="Cancel all pending/active queues and release wallet holds"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-600" />
            ) : (
              <Trash2 className="h-4 w-4 text-red-600" />
            )}
            <span>Clear All Queues</span>
          </button>

          <button
            onClick={handleRecoverStale}
            className="flex items-center gap-2 rounded-btn border border-border-default bg-white px-3.5 py-2 text-xs font-semibold text-secondary-700 hover:bg-neutral-50 transition-colors shadow-subtle"
          >
            <RotateCcw className="h-4 w-4 text-brand-600" />
            <span>Recover Stale</span>
          </button>

          <button
            onClick={loadBookings}
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
          {['ALL', 'QUEUED', 'ASSIGNED', 'WATCHING', 'AVAILABILITY_FOUND', 'BOOKING', 'SUCCESS', 'REQUIRES_HUMAN', 'CANCELLED', 'FAILED'].map((s) => (
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
                  const isCancelling = cancellingId === b.id;

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
                      <td className="py-3 px-4 font-mono font-semibold text-info-700">
                        {b.assignedMachine?.machineCode || (
                          <span className="text-secondary-400 font-normal">Cloud Queue</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StateBadge status={b.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {b.officialReference || <span className="text-secondary-400 font-normal font-sans">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {canCancel && (
                            <button
                              onClick={() => handleCancelBooking(b.id, b.bookingCode)}
                              disabled={isCancelling}
                              className="inline-flex items-center gap-1 rounded-btn border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 hover:text-red-800 transition-colors disabled:opacity-50"
                              title="Cancel booking and refund ₹100 deposit hold"
                            >
                              {isCancelling ? (
                                <Loader2 className="h-3 w-3 animate-spin text-red-600" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-600" />
                              )}
                              <span>Cancel</span>
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
    </div>
  );
}

