'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { formatCurrency, formatNumber } from '../../lib/utils';
import {
  Building2,
  Cpu,
  Layers,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Server,
  Activity,
  Trash2,
  Sparkles,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { MetricBlock } from '../../components/MetricBlock';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const loadData = () => {
    api.getAdminDashboard()
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleClearQueues = async () => {
    if (!window.confirm('Are you sure you want to clear all active queues, release held funds, and reset all worker states to idle?')) {
      return;
    }

    setResetting(true);
    setResetFeedback(null);
    try {
      const res = await api.clearAllQueues();
      setResetFeedback(res.message || 'All active queues and worker states have been reset.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to clear queues');
    } finally {
      setResetting(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#C98219] border-t-transparent" />
          <p className="text-[13px] text-[#667085] font-medium">Loading operations telemetry...</p>
        </div>
      </div>
    );
  }

  const { centres, workers, bookings, commercialTarget, financials } = metrics;

  return (
    <div className="w-full max-w-[1400px] space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6EAF0]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#172033] tracking-tight">
              Operations & Fleet Command
            </h1>
            <span className="rounded bg-[#FEF7E6] border border-[#F9DE9B] px-2 py-0.5 text-[11px] font-bold text-[#8F5A0D]">
              YUKTRON CENTRAL
            </span>
          </div>
          <p className="text-[13px] text-[#667085] mt-0.5">
            Real-time multi-PC worker scheduling, financial revenue reconciliation, and statewide booking queue health.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleClearQueues}
            disabled={resetting}
            className="flex items-center gap-1.5 rounded-[7px] border border-[#F8C4C2] bg-[#FDECEC] px-3.5 py-2 text-[12.5px] font-bold text-[#992B26] hover:bg-[#F9D6D5] transition-colors shadow-subtle disabled:opacity-50"
            title="Reset active queues & release holds"
          >
            <Trash2 className="h-3.5 w-3.5 text-[#C2413B]" />
            <span>{resetting ? 'Resetting...' : 'Reset Queues & Holds'}</span>
          </button>

          <Link
            href="/admin/fleet"
            className="flex items-center gap-1.5 rounded-[7px] bg-[#C98219] hover:bg-[#B57414] px-4 py-2 text-[12.5px] font-bold text-white transition-all shadow-subtle hover:shadow"
          >
            <Cpu className="h-4 w-4" />
            <span>Worker Fleet ({workers.online} Online)</span>
          </Link>

          <button
            onClick={loadData}
            className="flex h-9 w-9 items-center justify-center rounded-[7px] border border-[#D0D5DD] bg-white text-[#475467] hover:bg-[#F9FAFB] hover:text-[#172033] transition-colors shadow-subtle"
            title="Refresh Metrics"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Reset Feedback Notification */}
      {resetFeedback && (
        <div className="rounded-[8px] border border-[#C3E6CB] bg-[#EAF7EE] p-3.5 text-[12.5px] text-[#155724] shadow-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-[#198754] shrink-0" />
            <span className="font-semibold">{resetFeedback}</span>
          </div>
          <button
            onClick={() => setResetFeedback(null)}
            className="text-[12px] text-[#155724] hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Operational Milestone Progress */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 sm:p-6 shadow-subtle space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-[#C98219]" />
            <h2 className="text-[13px] font-bold text-[#172033] uppercase tracking-wider">
              Platform Booking Target (5,000 Bookings)
            </h2>
          </div>
          <span className="text-[13px] font-mono font-bold text-[#7A4A12]">
            {formatNumber(commercialTarget.successfulBookings)} of {formatNumber(commercialTarget.targetBookings)} Bookings ({commercialTarget.progressPercent}%)
          </span>
        </div>

        {/* Progress Track */}
        <div className="h-3 w-full rounded-full bg-[#F0F3F8] overflow-hidden border border-[#E6EAF0]">
          <div
            className="h-full rounded-full bg-[#C98219] transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, Math.max(2, commercialTarget.progressPercent || 0))}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11.5px] text-[#667085] pt-1">
          <span>Centre Base: <strong className="text-[#172033]">356 Registered Centres</strong></span>
          <span>Target Rate: <strong className="text-[#172033]">~14 bookings / centre target</strong></span>
          <span>Active Centre Rate: <strong className="text-[#172033]">{commercialTarget.avgPerActiveCentre} bookings / centre</strong></span>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBlock
          label="CENTRE NETWORK"
          value={`${centres.total} / ${centres.networkTarget || 356}`}
          helper={`${centres.active} active (${centres.penetrationPercent}% penetration)`}
          icon={Building2}
        />
        <MetricBlock
          label="WORKER FLEET"
          value={`${workers.online} Online`}
          helper={`${workers.busy} busy, ${workers.total} paired units`}
          icon={Cpu}
        />
        <MetricBlock
          label="TOTAL REVENUE CAPTURED"
          value={formatCurrency(financials.totalCaptured || ((financials.yuktronRevenue || 0) + (financials.workerSettlement || 0)))}
          helper={`Captured from ${bookings.SUCCESS || 0} confirmed passes`}
          icon={Wallet}
        />
        <MetricBlock
          label="ACTIVE HOLDS ESCROW"
          value={formatCurrency(financials.totalNetworkReservedBalance || 0)}
          helper="Held during active queue monitoring"
          icon={ShieldCheck}
        />
      </div>

      {/* Central Booking Queue Breakdown */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E6EAF0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#C98219]" />
            <h2 className="text-[13px] font-bold text-[#172033] uppercase tracking-wider">
              Central Booking State Breakdown
            </h2>
          </div>
          <Link
            href="/admin/bookings"
            className="text-[12.5px] font-bold text-[#C98219] hover:text-[#B57414] flex items-center gap-1 transition-colors"
          >
            <span>Manage All Bookings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E6EAF0] bg-white">
          <div className="p-4 text-center">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Cloud Queued</span>
            <p className="font-mono text-2xl font-bold text-[#3568A8] mt-1">{bookings.QUEUED || 0}</p>
            <span className="text-[11px] text-[#667085] mt-0.5 block">Waiting for worker</span>
          </div>

          <div className="p-4 text-center">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Watching Slots</span>
            <p className="font-mono text-2xl font-bold text-[#8F5A0D] mt-1">{bookings.WATCHING || 0}</p>
            <span className="text-[11px] text-[#667085] mt-0.5 block">5-min interval</span>
          </div>

          <div className="p-4 text-center">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">In Gateway Booking</span>
            <p className="font-mono text-2xl font-bold text-[#172033] mt-1">{bookings.BOOKING || 0}</p>
            <span className="text-[11px] text-[#667085] mt-0.5 block">Devotee pass creation</span>
          </div>

          <div className="p-4 text-center">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Verified Passes</span>
            <p className="font-mono text-2xl font-bold text-[#155724] mt-1">{bookings.SUCCESS || 0}</p>
            <span className="text-[11px] text-[#667085] mt-0.5 block">Passes confirmed</span>
          </div>

          <div className="p-4 text-center">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Human Challenge</span>
            <p className="font-mono text-2xl font-bold text-[#992B26] mt-1">{bookings.REQUIRES_HUMAN || 0}</p>
            <span className="text-[11px] text-[#667085] mt-0.5 block">Manual resolution</span>
          </div>

          <div className="p-4 text-center">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Released Holds</span>
            <p className="font-mono text-2xl font-bold text-[#475467] mt-1">{bookings.FAILED || 0}</p>
            <span className="text-[11px] text-[#667085] mt-0.5 block">Refunded to centre</span>
          </div>
        </div>
      </div>

      {/* Fast Operational Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/fleet"
          className="rounded-[10px] border border-[#E6EAF0] bg-white p-4.5 shadow-subtle hover:border-[#C98219] transition-all flex items-start gap-3.5 group hover:shadow-card"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#F0F3F8] text-[#C98219] group-hover:bg-[#FEF7E6] transition-colors shrink-0">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#172033] group-hover:text-[#7A4A12] transition-colors">
              Worker PC Fleet Telemetry
            </h3>
            <p className="text-[11.5px] text-[#667085] mt-0.5 leading-relaxed">
              Pair new worker terminals, monitor heartbeat intervals, inspect job leases and load distribution.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/ledger"
          className="rounded-[10px] border border-[#E6EAF0] bg-white p-4.5 shadow-subtle hover:border-[#C98219] transition-all flex items-start gap-3.5 group hover:shadow-card"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#F0F3F8] text-[#C98219] group-hover:bg-[#FEF7E6] transition-colors shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#172033] group-hover:text-[#7A4A12] transition-colors">
              Financial Audit Ledger
            </h3>
            <p className="text-[11.5px] text-[#667085] mt-0.5 leading-relaxed">
              Audit the ₹100 assistance fee captures, review pending refunds, and reconcile top-up gateways.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/centres"
          className="rounded-[10px] border border-[#E6EAF0] bg-white p-4.5 shadow-subtle hover:border-[#C98219] transition-all flex items-start gap-3.5 group hover:shadow-card"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#F0F3F8] text-[#C98219] group-hover:bg-[#FEF7E6] transition-colors shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#172033] group-hover:text-[#7A4A12] transition-colors">
              Centres Directory
            </h3>
            <p className="text-[11.5px] text-[#667085] mt-0.5 leading-relaxed">
              Manage all 356 registered eSevai centres in Tamil Nadu, approve new registrations, and inspect centre activity.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
