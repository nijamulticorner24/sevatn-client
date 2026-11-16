'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { formatCurrency, formatNumber, formatDate } from '../../lib/utils';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
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
  Zap,
  Users,
  Network,
  Clock,
  ArrowUpRight,
  Check,
  XCircle,
  ExternalLink,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const toast = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [isClearQueueModalOpen, setIsClearQueueModalOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'BOOKINGS' | 'CENTRES'>('BOOKINGS');

  const loadData = async () => {
    try {
      const data = await api.getAdminDashboard();
      setMetrics(data);
      setLastSyncTime(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Failed to load admin dashboard telemetry:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleClearQueues = async () => {
    setResetting(true);
    setResetFeedback(null);
    try {
      const res = await api.clearAllQueues();
      const msg = res.message || 'All active queues and worker states have been reset.';
      setResetFeedback(msg);
      toast.success(msg);
      setIsClearQueueModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear queues');
    } finally {
      setResetting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'COMPLETED':
      case 'BOOKING_CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#EAF7EE] px-2 py-0.5 text-[10.5px] font-bold text-[#198754] border border-[#C3E6CB]">
            <CheckCircle2 className="h-3 w-3" /> Confirmed
          </span>
        );
      case 'BOOKING':
      case 'AVAILABILITY_FOUND':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#EFF8FF] px-2 py-0.5 text-[10.5px] font-bold text-[#175CD3] border border-[#B2DDFF]">
            <Zap className="h-3 w-3 animate-pulse" /> In Booking
          </span>
        );
      case 'WATCHING':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#FEF7E6] px-2 py-0.5 text-[10.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
            <Activity className="h-3 w-3 animate-spin" /> Watching
          </span>
        );
      case 'QUEUED':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#F8FAFC] px-2 py-0.5 text-[10.5px] font-bold text-[#475467] border border-[#D0D5DD]">
            <Clock className="h-3 w-3" /> Queued
          </span>
        );
      case 'REQUIRES_HUMAN':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#FEF3F2] px-2 py-0.5 text-[10.5px] font-bold text-[#D92D20] border border-[#FECDCA]">
            <AlertTriangle className="h-3 w-3" /> Human Alert
          </span>
        );
      case 'FAILED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#FDECEC] px-2 py-0.5 text-[10.5px] font-bold text-[#992B26] border border-[#F8C4C2]">
            <XCircle className="h-3 w-3" /> Released
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#F8FAFC] px-2 py-0.5 text-[10.5px] font-bold text-[#667085] border border-[#E6EAF0]">
            {status}
          </span>
        );
    }
  };

  const getWorkerStatusBadge = (status: string, active: boolean) => {
    if (!active) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-[#F2F4F7] px-2 py-0.5 text-[10.5px] font-bold text-[#667085] border border-[#D0D5DD]">
          Disabled
        </span>
      );
    }
    if (status === 'ONLINE') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded bg-[#EAF7EE] px-2 py-0.5 text-[10.5px] font-bold text-[#198754] border border-[#C3E6CB]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#198754] animate-pulse" />
          ONLINE
        </span>
      );
    }
    if (status === 'BUSY') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded bg-[#FEF7E6] px-2 py-0.5 text-[10.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C98219] animate-pulse" />
          BUSY
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded bg-[#F2F4F7] px-2 py-0.5 text-[10.5px] font-bold text-[#475467] border border-[#D0D5DD]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#98A2B3]" />
        OFFLINE
      </span>
    );
  };

  const formatHeartbeat = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading || !metrics) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#C98219] border-t-transparent" />
          <p className="text-xs sm:text-sm font-semibold text-[#667085]">
            Loading operations & telemetry...
          </p>
        </div>
      </div>
    );
  }

  const { centres, workers, bookings, financials, hierarchy, recentBookings, recentCentres } = metrics;
  const partnersInfo = hierarchy?.partners || { total: 0, active: 0 };
  const distributorsInfo = hierarchy?.distributors || { total: 0, active: 0 };
  const centresInfo = hierarchy?.centres || { total: centres?.total || 0, active: centres?.active || 0, activeRate: 0 };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
      {/* Top Header & Operational Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E6EAF0]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#172033]">
              Operations & Fleet Command
            </h1>
            <span className="rounded-full bg-[#FEF7E6] border border-[#F9DE9B] px-2.5 py-0.5 text-[10px] font-bold text-[#8F5A0D] uppercase tracking-wide">
              SUPER ADMIN
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Dynamic network telemetry, 4-tier hierarchy oversight, and worker execution monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Sync Badge & Auto-refresh control */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`h-8.5 px-3 rounded-[8px] text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                : 'bg-[#F2F4F7] text-[#667085] border-[#D0D5DD]'
            }`}
            title={autoRefresh ? 'Auto-refresh active every 5s (Click to pause)' : 'Auto-refresh paused (Click to enable)'}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                autoRefresh ? 'bg-[#198754] animate-pulse' : 'bg-[#98A2B3]'
              }`}
            />
            <span>{autoRefresh ? 'Auto-Sync (5s)' : 'Sync Paused'}</span>
            {autoRefresh ? <Pause className="h-3 w-3 opacity-60" /> : <Play className="h-3 w-3 opacity-60" />}
          </button>

          <button
            type="button"
            onClick={loadData}
            className="h-8.5 w-8.5 flex items-center justify-center rounded-[8px] border border-[#D0D5DD] bg-white text-[#475467] hover:bg-[#F9FAFB] hover:text-[#172033] transition-colors shadow-subtle"
            title="Refresh Metrics Immediately"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsClearQueueModalOpen(true)}
            disabled={resetting}
            className="h-8.5 px-3 rounded-[8px] border border-[#F8C4C2] bg-[#FDECEC] text-xs font-semibold text-[#992B26] hover:bg-[#F9D6D5] transition-colors shadow-subtle disabled:opacity-50 inline-flex items-center gap-1.5"
            title="Reset active queues & release held funds"
          >
            <Trash2 className="h-3.5 w-3.5 text-[#C2413B]" />
            <span>{resetting ? 'Resetting...' : 'Reset Queues'}</span>
          </button>

          <Link
            href="/admin/fleet"
            className="h-8.5 px-3.5 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] text-xs font-semibold text-white transition-all shadow-subtle hover:shadow inline-flex items-center gap-1.5"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Worker Fleet ({workers.online} Online)</span>
          </Link>
        </div>
      </div>

      {/* Reset Feedback Notification */}
      {resetFeedback && (
        <div className="rounded-[8px] border border-[#C3E6CB] bg-[#EAF7EE] p-3 text-xs text-[#155724] shadow-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#198754] shrink-0" />
            <span className="font-semibold">{resetFeedback}</span>
          </div>
          <button
            onClick={() => setResetFeedback(null)}
            className="text-xs text-[#155724] hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4-Tier Hierarchy Architecture Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
            <Network className="h-3.5 w-3.5 text-[#C98219]" />
            <span>Business Hierarchy Network (Live Platform Nodes)</span>
          </h2>
          <span className="text-[11px] text-[#667085]">
            Last telemetry update: {lastSyncTime.toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Tier 1: Super Admin */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                  Tier 1 • Master Node
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#172033] font-mono">1</span>
                  <span className="text-xs font-medium text-[#667085]">Super Admin</span>
                </div>
              </div>
              <div className="rounded-[8px] bg-[#FEF7E6] p-2 text-[#C98219] border border-[#F9DE9B] shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#F0F3F8] flex items-center justify-between text-xs">
              <span className="text-[#667085]">Root Governance</span>
              <span className="font-bold text-[#198754] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#198754]" /> Active
              </span>
            </div>
          </div>

          {/* Tier 2: Partners */}
          <Link
            href="/admin/partners"
            className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle hover:border-[#C98219] transition-all flex flex-col justify-between group hover:shadow-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                  Tier 2 • Partner Franchises
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#172033] font-mono">
                    {partnersInfo.total}
                  </span>
                  <span className="text-xs font-medium text-[#667085]">Total Registered</span>
                </div>
              </div>
              <div className="rounded-[8px] bg-[#F0F3F8] p-2 text-[#3568A8] border border-[#E6EAF0] group-hover:bg-[#EFF8FF] transition-colors shrink-0">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#F0F3F8] flex items-center justify-between text-xs">
              <span className="text-[#667085]">
                <strong className="text-[#172033]">{partnersInfo.active}</strong> active franchises
              </span>
              <span className="font-bold text-[#C98219] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Manage <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </Link>

          {/* Tier 3: Distributors */}
          <Link
            href="/admin/distributors"
            className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle hover:border-[#C98219] transition-all flex flex-col justify-between group hover:shadow-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                  Tier 3 • Sub-Distributors
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#172033] font-mono">
                    {distributorsInfo.total}
                  </span>
                  <span className="text-xs font-medium text-[#667085]">Total Registered</span>
                </div>
              </div>
              <div className="rounded-[8px] bg-[#F0F3F8] p-2 text-[#C98219] border border-[#E6EAF0] group-hover:bg-[#FEF7E6] transition-colors shrink-0">
                <Network className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#F0F3F8] flex items-center justify-between text-xs">
              <span className="text-[#667085]">
                <strong className="text-[#172033]">{distributorsInfo.active}</strong> active operators
              </span>
              <span className="font-bold text-[#C98219] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Manage <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </Link>

          {/* Tier 4: Centres */}
          <Link
            href="/admin/centres"
            className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle hover:border-[#C98219] transition-all flex flex-col justify-between group hover:shadow-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                  Tier 4 • eSevai Centres
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#172033] font-mono">
                    {centresInfo.total}
                  </span>
                  <span className="text-xs font-medium text-[#667085]">Total Outlets</span>
                </div>
              </div>
              <div className="rounded-[8px] bg-[#F0F3F8] p-2 text-[#198754] border border-[#E6EAF0] group-hover:bg-[#EAF7EE] transition-colors shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#F0F3F8] flex items-center justify-between text-xs">
              <span className="text-[#667085]">
                <strong className="text-[#198754]">{centresInfo.active}</strong> active ({centresInfo.activeRate}% live)
              </span>
              <span className="font-bold text-[#C98219] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Manage <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Real Financials Telemetry Strip */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 sm:p-5 shadow-subtle space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E6EAF0]">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#C98219]" />
            <h2 className="text-xs sm:text-sm font-bold text-[#172033] uppercase tracking-wider">
              Platform Financial Revenue & Wallet Holding Telemetry
            </h2>
          </div>
          <Link
            href="/admin/ledger"
            className="text-xs font-bold text-[#C98219] hover:underline flex items-center gap-1"
          >
            <span>View Full Financial Split Ledger</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-[9px] border border-[#E6EAF0] bg-white p-3.5 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
              Total Assistance Revenue
            </span>
            <div className="text-xl xl:text-2xl font-extrabold text-[#172033] font-mono mt-1 tracking-tight truncate">
              {formatCurrency(financials.totalCaptured || 0)}
            </div>
            <span className="text-[10.5px] text-[#667085] mt-1 block">
              From confirmed pilgrim passes
            </span>
          </div>

          <div className="rounded-[9px] border border-[#C3E6CB] bg-[#F7FCF8] p-3.5 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#198754] uppercase tracking-wider block">
              Yuktron Platform Share
            </span>
            <div className="text-xl xl:text-2xl font-extrabold text-[#198754] font-mono mt-1 tracking-tight truncate">
              {formatCurrency(financials.yuktronRevenue || 0)}
            </div>
            <span className="text-[10.5px] text-[#198754] mt-1 block">
              Super Admin net operational cut
            </span>
          </div>

          <div className="rounded-[9px] border border-[#F9DE9B] bg-[#FFFDF7] p-3.5 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#8F5A0D] uppercase tracking-wider block">
              Active Escrow Held Funds
            </span>
            <div className="text-xl xl:text-2xl font-extrabold text-[#8F5A0D] font-mono mt-1 tracking-tight truncate">
              {formatCurrency(financials.totalNetworkReservedBalance || 0)}
            </div>
            <span className="text-[10.5px] text-[#8F5A0D] mt-1 block">
              Reserved for active queue bookings
            </span>
          </div>

          <div className="rounded-[9px] border border-[#E6EAF0] bg-white p-3.5 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
              Network Available Balance
            </span>
            <div className="text-xl xl:text-2xl font-extrabold text-[#172033] font-mono mt-1 tracking-tight truncate">
              {formatCurrency(financials.totalNetworkAvailableBalance || 0)}
            </div>
            <span className="text-[10.5px] text-[#667085] mt-1 block">
              Liquid funds across all wallets
            </span>
          </div>
        </div>
      </div>

      {/* Central Booking Pipeline (100% Dynamic States) */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#E6EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#C98219]" />
              <h2 className="text-xs sm:text-sm font-bold text-[#172033] uppercase tracking-wider">
                Central Booking Pipeline Telemetry ({bookings.TOTAL || 0} Total Requests)
              </h2>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Live automated status breakdown across watching, automated booking, confirmed passes, and human checkpoints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-[#EFF8FF] border border-[#B2DDFF] px-2.5 py-1 text-[11px] font-bold text-[#175CD3]">
              Today: {bookings.today || 0} Bookings
            </span>
            <Link
              href="/admin/bookings"
              className="h-7 rounded-[6px] border border-[#D0D5DD] bg-white px-2.5 text-xs font-semibold text-[#172033] hover:border-[#C98219] hover:bg-[#FDF7ED] transition-colors inline-flex items-center gap-1 shadow-xs"
            >
              <span>Manage Bookings</span>
              <ArrowRight className="h-3 w-3 text-[#C98219]" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E6EAF0] bg-white">
          <div className="py-3 px-3 text-center">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Queued</span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-[#3568A8] mt-1">{bookings.QUEUED || 0}</p>
            <span className="text-[10.5px] text-[#667085] mt-0.5 block truncate">Waiting for worker</span>
          </div>

          <div className="py-3 px-3 text-center">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Watching Slots</span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-[#8F5A0D] mt-1">{bookings.WATCHING || 0}</p>
            <span className="text-[10.5px] text-[#667085] mt-0.5 block truncate">5-min interval</span>
          </div>

          <div className="py-3 px-3 text-center">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">In Gateway Booking</span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-[#172033] mt-1">{bookings.BOOKING || 0}</p>
            <span className="text-[10.5px] text-[#667085] mt-0.5 block truncate">Pass creation</span>
          </div>

          <div className="py-3 px-3 text-center">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Confirmed Passes</span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-[#198754] mt-1">{bookings.successCount || 0}</p>
            <span className="text-[10.5px] text-[#198754] font-semibold mt-0.5 block truncate">
              {bookings.successRate}% Success Rate
            </span>
          </div>

          <div className="py-3 px-3 text-center">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Human Alert</span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-[#C2413B] mt-1">{bookings.REQUIRES_HUMAN || 0}</p>
            <span className="text-[10.5px] text-[#667085] mt-0.5 block truncate">Manual resolution</span>
          </div>

          <div className="py-3 px-3 text-center">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Released Holds</span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-[#475467] mt-1">{bookings.FAILED || 0}</p>
            <span className="text-[10.5px] text-[#667085] mt-0.5 block truncate">Refunded to centre</span>
          </div>
        </div>
      </div>

      {/* Worker PC Fleet Grid (Real live machines) */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-[#C98219]" />
              <h2 className="text-xs sm:text-sm font-bold text-[#172033] uppercase tracking-wider">
                Worker PC Fleet Telemetry ({workers.online} Online / {workers.total} Units)
              </h2>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Live automated browser runner nodes executing statewide quota reservations and slot checks.
            </p>
          </div>

          <Link
            href="/admin/fleet"
            className="rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-1 text-xs font-bold text-[#172033] hover:border-[#C98219] hover:bg-[#FDF7ED] transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>Fleet Control & Pairing</span>
            <ArrowRight className="h-3 w-3 text-[#C98219]" />
          </Link>
        </div>

        {workers.units && workers.units.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#E6EAF0]">
                <tr>
                  <th className="py-2.5 px-4">Machine Code</th>
                  <th className="py-2.5 px-4">Machine Name</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-4">Jobs Completed</th>
                  <th className="py-2.5 px-4">Version</th>
                  <th className="py-2.5 px-4 text-right">Heartbeat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0] bg-white">
                {workers.units.map((unit: any) => (
                  <tr key={unit.id} className="hover:bg-[#FAFBFD] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#172033]">
                      {unit.machineCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#172033]">
                      {unit.machineName}
                    </td>
                    <td className="py-3 px-4">
                      {getWorkerStatusBadge(unit.status, unit.active)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#667085]">
                      {unit.ipAddress || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#172033]">
                      <span className="font-bold text-[#198754]">{unit.successCount || 0}</span> / {unit.jobsCompleted || 0}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#667085]">
                      v{unit.version || '1.0.0'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-[#667085]">
                      {formatHeartbeat(unit.lastHeartbeat)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#667085]">
            <Server className="h-8 w-8 text-[#98A2B3] mx-auto mb-2 opacity-50" />
            <p className="font-bold text-[#172033]">No Worker Terminals Paired Yet</p>
            <p className="mt-0.5">
              Generate a pairing code in{' '}
              <Link href="/admin/fleet" className="text-[#C98219] underline font-semibold">
                Worker PC Fleet
              </Link>{' '}
              to connect your first automated booking worker.
            </p>
          </div>
        )}
      </div>

      {/* Real-time Activity: Recent Bookings & Centres */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-[#E6EAF0] bg-[#F8FAFC]">
          <button
            onClick={() => setActiveTab('BOOKINGS')}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'BOOKINGS'
                ? 'border-[#C98219] bg-white text-[#C98219]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Recent Booking Requests ({recentBookings?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('CENTRES')}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'CENTRES'
                ? 'border-[#C98219] bg-white text-[#C98219]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Recently Onboarded Centres ({recentCentres?.length || 0})</span>
          </button>
        </div>

        {/* Tab 1: Recent Bookings */}
        {activeTab === 'BOOKINGS' && (
          <div>
            {recentBookings && recentBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#E6EAF0]">
                    <tr>
                      <th className="py-2.5 px-4">Booking Code</th>
                      <th className="py-2.5 px-4">Devotee Name</th>
                      <th className="py-2.5 px-4">Centre Origin</th>
                      <th className="py-2.5 px-4">Pilgrims</th>
                      <th className="py-2.5 px-4">Darshan Date</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0] bg-white">
                    {recentBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-[#FAFBFD] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#172033]">
                          {b.bookingCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#172033]">
                          {b.customerName}
                        </td>
                        <td className="py-3 px-4 text-[#475467]">
                          <span className="font-semibold block text-[#172033]">{b.centreName}</span>
                          <span className="font-mono text-[10.5px] text-[#667085]">
                            {b.centreCode} • {b.district}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#172033]">
                          {b.pilgrimCount} Devotee{b.pilgrimCount > 1 ? 's' : ''}
                        </td>
                        <td className="py-3 px-4 text-[#475467]">
                          <span className="block font-medium">
                            {b.requestedDateStr || (b.requestedDate ? formatDate(b.requestedDate) : '—')}
                          </span>
                          {b.timeSlot && (
                            <span className="text-[10.5px] text-[#667085] block">{b.timeSlot}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(b.status)}
                        </td>
                        <td className="py-3 px-4 text-right text-[#667085]">
                          {formatDate(b.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#667085]">
                <Layers className="h-8 w-8 text-[#98A2B3] mx-auto mb-2 opacity-50" />
                <p className="font-bold text-[#172033]">No Booking Requests Logged Yet</p>
                <p className="mt-0.5">As centres and devotees initiate bookings, live requests will stream here.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Recent Centres */}
        {activeTab === 'CENTRES' && (
          <div>
            {recentCentres && recentCentres.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#E6EAF0]">
                    <tr>
                      <th className="py-2.5 px-4">Centre Name</th>
                      <th className="py-2.5 px-4">Station Code</th>
                      <th className="py-2.5 px-4">Operator</th>
                      <th className="py-2.5 px-4">Location</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0] bg-white">
                    {recentCentres.map((c: any) => (
                      <tr key={c.id} className="hover:bg-[#FAFBFD] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#172033]">
                          {c.centreName}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#C98219]">
                          {c.centreCode || '—'}
                        </td>
                        <td className="py-3 px-4 text-[#475467]">
                          <span className="font-semibold block text-[#172033]">{c.operatorName}</span>
                          <span className="font-mono text-[10.5px] text-[#667085]">{c.mobile}</span>
                        </td>
                        <td className="py-3 px-4 text-[#475467]">
                          <span>{c.district}</span>
                          {c.taluk && <span className="text-[10.5px] text-[#667085] block">{c.taluk}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                              c.status === 'ACTIVE'
                                ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                                : 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-[#667085]">
                          {formatDate(c.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#667085]">
                <Building2 className="h-8 w-8 text-[#98A2B3] mx-auto mb-2 opacity-50" />
                <p className="font-bold text-[#172033]">No Centres Registered Yet</p>
                <p className="mt-0.5">Create centres directly in the Centres Directory or approve partner onboarding links.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fast Operational Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/fleet"
          className="rounded-[10px] border border-[#E6EAF0] bg-white p-4.5 shadow-subtle hover:border-[#C98219] transition-all flex items-start gap-3.5 group hover:shadow-card"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#F0F3F8] text-[#C98219] group-hover:bg-[#FEF7E6] transition-colors shrink-0">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#172033] group-hover:text-[#7A4A12] transition-colors">
              Worker PC Fleet Telemetry
            </h3>
            <p className="text-[11.5px] text-[#667085] mt-0.5 leading-relaxed">
              Pair worker terminals, monitor heartbeat intervals, inspect job leases and load distribution.
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
            <h3 className="text-xs sm:text-sm font-bold text-[#172033] group-hover:text-[#7A4A12] transition-colors">
              Financial Audit Ledger
            </h3>
            <p className="text-[11.5px] text-[#667085] mt-0.5 leading-relaxed">
              Audit the assistance fee captures, review pending refunds, and reconcile top-up gateways.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/pricing"
          className="rounded-[10px] border border-[#E6EAF0] bg-white p-4.5 shadow-subtle hover:border-[#C98219] transition-all flex items-start gap-3.5 group hover:shadow-card"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#F0F3F8] text-[#C98219] group-hover:bg-[#FEF7E6] transition-colors shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#172033] group-hover:text-[#7A4A12] transition-colors">
              Platform Pricing & Limits
            </h3>
            <p className="text-[11.5px] text-[#667085] mt-0.5 leading-relaxed">
              Configure partner and distributor markup caps, base assistance fees, and registration licenses.
            </p>
          </div>
        </Link>
      </div>

      <ConfirmDialog
        isOpen={isClearQueueModalOpen}
        title="Reset Active Queues & Workers"
        description="Are you sure you want to clear all active queues, release held funds back to centre wallets, and reset all worker states to idle? This action immediately cancels in-flight monitoring."
        confirmLabel="Reset All Queues"
        cancelLabel="Cancel"
        isDestructive={true}
        loading={resetting}
        onConfirm={handleClearQueues}
        onCancel={() => setIsClearQueueModalOpen(false)}
      />
    </div>
  );
}
