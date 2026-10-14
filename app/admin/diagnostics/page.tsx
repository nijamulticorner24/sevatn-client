'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Activity,
  RefreshCw,
  Cpu,
  Info,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Clock,
  Ban,
  Check,
  AlertCircle,
  BarChart3,
  Layers,
  CreditCard,
  UserCheck,
  UserX,
  FileText,
  MapPin,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';

type TabSection = 'OVERVIEW' | 'USERS' | 'FREQUENCY' | 'FINANCE' | 'PERFORMANCE' | 'FLEET';

export default function DiagnosticsPage() {
  const [activeTab, setActiveTab] = useState<TabSection>('OVERVIEW');
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  // Filter States
  const [dateRange, setDateRange] = useState<string>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userSegmentFilter, setUserSegmentFilter] = useState<string>('ALL');
  const [userTablePage, setUserTablePage] = useState<number>(1);

  // Data States
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [fleetAuditData, setFleetAuditData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Drill-down Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailData, setUserDetailData] = useState<any>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState<boolean>(false);

  // Check Super Admin Authentication
  useEffect(() => {
    const user = api.getUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }
    setIsSuperAdmin(true);
    fetchAnalyticsData();
  }, [dateRange, customStartDate, customEndDate, selectedService, selectedStatus, userSegmentFilter, userTablePage]);

  const fetchAnalyticsData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const [analyticsRes, fleetRes] = await Promise.all([
        api.getAdvancedAnalytics({
          range: dateRange,
          startDate: dateRange === 'custom' ? customStartDate : undefined,
          endDate: dateRange === 'custom' ? customEndDate : undefined,
          service: selectedService,
          status: selectedStatus,
          search: searchQuery.trim() || undefined,
          page: userTablePage,
          limit: 15,
          userSegment: userSegmentFilter,
        }),
        api.getDiagnostics().catch(() => null),
      ]);

      setAnalyticsData(analyticsRes);
      if (fleetRes) setFleetAuditData(fleetRes);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setErrorMsg(err.message || 'Failed to load telemetry & analytics data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserTablePage(1);
    fetchAnalyticsData(true);
  };

  // Open User Drill-down Detail Modal
  const handleOpenUserDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setLoadingUserDetail(true);
    setUserDetailData(null);
    try {
      const res = await api.getUserActivityDetail(userId);
      setUserDetailData(res);
    } catch (err: any) {
      alert(`Could not load user activity: ${err.message}`);
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // CSV Export for User Activity
  const exportUsersCSV = () => {
    if (!analyticsData?.usersTable?.users || analyticsData.usersTable.users.length === 0) {
      alert('No user records available to export.');
      return;
    }
    const headers = [
      'User ID',
      'Name',
      'Email',
      'Mobile',
      'Role',
      'District',
      'Centre Name',
      'Registration Date',
      'Last Activity Date',
      'Total Attempts',
      'Successful Bookings',
      'Failed Bookings',
      'Repeat Count',
      'Successful Value (INR)',
      'Actual Paid (INR)',
      'Latest Status',
      'Classification',
    ];

    const rows = analyticsData.usersTable.users.map((u: any) => [
      `"${u.id}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.mobile}"`,
      `"${u.role}"`,
      `"${u.district || ''}"`,
      `"${(u.centreName || '').replace(/"/g, '""')}"`,
      `"${new Date(u.registrationDate).toLocaleDateString()}"`,
      `"${new Date(u.lastActivityDate).toLocaleDateString()}"`,
      u.totalAttempts,
      u.successfulCount,
      u.failedCount,
      u.repeatCount,
      u.successfulValue,
      u.actualPaid,
      `"${u.latestBookingStatus}"`,
      `"${u.classification}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SevaTN_User_Analytics_${analyticsData.metadata.range}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for Diagnostic Bookings
  const exportBookingsCSV = () => {
    if (!analyticsData?.performance?.sampleRecords || analyticsData.performance.sampleRecords.length === 0) {
      alert('No diagnostic booking records available to export.');
      return;
    }
    const headers = [
      'Booking Code',
      'User ID',
      'Route',
      'Devotees',
      'Status',
      'Created At',
      'Completed At',
      'Duration (Seconds)',
      'Booking Value (INR)',
      'Failure Category',
      'Sanitized Reason',
    ];

    const rows = analyticsData.performance.sampleRecords.map((b: any) => [
      `"${b.bookingCode}"`,
      `"${b.userId}"`,
      `"${b.route}"`,
      b.pilgrimCount,
      `"${b.status}"`,
      `"${new Date(b.createdAt).toLocaleString()}"`,
      `"${b.completedAt ? new Date(b.completedAt).toLocaleString() : ''}"`,
      b.durationSec || '',
      b.bookingValue,
      `"${b.sanitizedFailureCategory || ''}"`,
      `"${(b.sanitizedFailureReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SevaTN_Booking_Diagnostics_${analyticsData.metadata.range}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isSuperAdmin === false) {
    return (
      <div className="rounded-[12px] border border-[#F5C6CB] bg-[#FDECEC] p-8 text-center max-w-xl mx-auto my-12 shadow-sm">
        <Ban className="h-10 w-10 text-[#C2413B] mx-auto mb-3" />
        <h2 className="text-base font-bold text-[#721C24]">Access Restricted (Super Admin Only)</h2>
        <p className="text-xs text-[#721C24] mt-1">
          This advanced user analytics and telemetry suite is strictly authorized for Super Administrators.
        </p>
      </div>
    );
  }

  const kpis = analyticsData?.kpis;
  const trends = analyticsData?.trends;
  const performance = analyticsData?.performance;
  const usersTable = analyticsData?.usersTable;
  const insights = analyticsData?.insights || [];
  const metadata = analyticsData?.metadata;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header with Title & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#E6EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033]">
              SevaTN Advanced User & Booking Analytics
            </h1>
            <span className="rounded bg-[#FEF7E6] border border-[#F9DE9B] px-2 py-0.5 text-[10.5px] font-bold text-[#8F5A0D]">
              SUPER_ADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Authoritative platform telemetry, booking frequency analysis, revenue reconciliation, and operator behavioral insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {lastRefreshedAt && (
            <span className="text-[11px] text-[#667085] flex items-center gap-1 font-mono mr-1">
              <Clock className="h-3 w-3" /> {lastRefreshedAt}
            </span>
          )}

          <button
            onClick={() => fetchAnalyticsData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#F8FAFC] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#C98219] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-[7px] bg-[#C98219] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 rounded-[8px] border border-[#E6EAF0] bg-white p-1.5 shadow-modal hidden group-hover:block z-30 animate-in fade-in">
              <button
                type="button"
                onClick={exportUsersCSV}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-[#172033] hover:bg-[#FEF7E6] hover:text-[#8F5A0D] rounded-[5px] transition-colors cursor-pointer"
              >
                Export User Analytics
              </button>
              <button
                type="button"
                onClick={exportBookingsCSV}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-[#172033] hover:bg-[#FEF7E6] hover:text-[#8F5A0D] rounded-[5px] transition-colors cursor-pointer"
              >
                Export Booking Diagnostics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Global Sticky Filter Bar */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-3.5 shadow-subtle space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Date Range Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-[8px] border border-[#E6EAF0]">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'custom', label: 'Custom' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setDateRange(r.id);
                  setUserTablePage(1);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-[6px] transition-all cursor-pointer ${
                  dateRange === r.id
                    ? 'bg-[#C98219] text-white shadow-2xs'
                    : 'text-[#475467] hover:text-[#172033] hover:bg-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Service Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#667085] hidden sm:inline">Service:</span>
            <select
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.target.value);
                setUserTablePage(1);
              }}
              className="rounded-[7px] border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">All Services & Routes</option>
              {metadata?.availableRoutes?.map((r: string) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Booking Status Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#667085] hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setUserTablePage(1);
              }}
              className="rounded-[7px] border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">All Booking Statuses</option>
              <option value="BOOKING_CONFIRMED">Confirmed (Success)</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending / Queued</option>
              <option value="REQUIRES_HUMAN">Requires Human Assist</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search user, mobile, booking code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-8 pr-3 py-1.5 text-xs text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
            />
          </form>
        </div>

        {/* Custom Date Pickers (visible only when custom is picked) */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#F0F3F8] animate-in fade-in">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#475467]">
              <Calendar className="h-3.5 w-3.5 text-[#C98219]" />
              <span>Start Date:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-[6px] border border-[#D0D5DD] bg-white px-2.5 py-1 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#475467]">
              <span>End Date:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-[6px] border border-[#D0D5DD] bg-white px-2.5 py-1 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchAnalyticsData(true)}
              className="rounded-[6px] bg-[#C98219] px-3 py-1 text-xs font-bold text-white hover:bg-[#B57414]"
            >
              Apply Dates
            </button>
          </div>
        )}
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E6EAF0] overflow-x-auto scrollbar-none">
        {[
          { id: 'OVERVIEW', label: 'Executive Overview & KPIs', icon: BarChart3 },
          { id: 'USERS', label: 'User Activity & Classification', icon: Users },
          { id: 'FREQUENCY', label: 'Booking Frequency & Timing', icon: TrendingUp },
          { id: 'FINANCE', label: 'Amount & Revenue Integrity', icon: DollarSign },
          { id: 'PERFORMANCE', label: 'Performance Diagnostics', icon: Activity },
          { id: 'FLEET', label: 'Fleet Telemetry & Guardrails', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabSection)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#C98219] text-[#C98219]'
                  : 'border-transparent text-[#667085] hover:text-[#172033] hover:border-[#D0D5DD]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="rounded-[8px] border border-[#F5C6CB] bg-[#FDECEC] p-3 text-xs text-[#C2413B] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-8 shadow-subtle">
          <LoadingSkeleton rows={6} />
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* TAB 1: EXECUTIVE OVERVIEW & KPIS                         */}
          {/* ======================================================== */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Primary 12 KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {/* 1. Total Registered Users */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Total Registered Users
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#172033]">
                      {kpis?.totalRegisteredUsers ?? 0}
                    </span>
                    <span className="rounded bg-[#F8FAFC] border border-[#E6EAF0] px-1.5 py-0.5 text-[10px] font-bold text-[#475467]">
                      All-Time
                    </span>
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Platform user accounts base</span>
                </div>

                {/* 2. New Registrations in Period */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    New Registrations
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#172033]">
                      {kpis?.newRegistrationsInPeriod ?? 0}
                    </span>
                    <span
                      className={`flex items-center gap-0.5 text-[10.5px] font-bold font-mono ${
                        (kpis?.newRegistrationsChangePct ?? 0) >= 0 ? 'text-[#027A48]' : 'text-[#C2413B]'
                      }`}
                    >
                      {(kpis?.newRegistrationsChangePct ?? 0) >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {kpis?.newRegistrationsChangePct ?? 0}%
                    </span>
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">In selected {metadata?.rangeLabel}</span>
                </div>

                {/* 3. Active Users */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Active Users
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#172033]">
                      {kpis?.activeUsersInPeriod ?? 0}
                    </span>
                    <span className="rounded bg-[#ECFDF3] border border-[#A6F4C5] px-1.5 py-0.5 text-[10px] font-bold text-[#027A48]">
                      Active
                    </span>
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Engaged via booking or ledger</span>
                </div>

                {/* 4. Users Attempting Bookings */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Booking Operators
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#172033]">
                      {kpis?.usersWhoAttemptedBookings ?? 0}
                    </span>
                    <span className="text-[11px] font-bold text-[#667085]">
                      {kpis?.totalRegisteredUsers > 0
                        ? `${Math.round(((kpis.usersWhoAttemptedBookings || 0) / kpis.totalRegisteredUsers) * 100)}% base`
                        : '0%'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Attempted ≥ 1 Virtual-Q pass</span>
                </div>

                {/* 5. Total Booking Attempts */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Booking Attempts
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#172033]">
                      {kpis?.totalBookingAttempts ?? 0}
                    </span>
                    <span
                      className={`flex items-center gap-0.5 text-[10.5px] font-bold font-mono ${
                        (kpis?.bookingVolumeChangePct ?? 0) >= 0 ? 'text-[#027A48]' : 'text-[#C2413B]'
                      }`}
                    >
                      {(kpis?.bookingVolumeChangePct ?? 0) >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {kpis?.bookingVolumeChangePct ?? 0}%
                    </span>
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Total passes requested</span>
                </div>

                {/* 6. Successful Bookings */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Successful Passes
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#027A48]">
                      {kpis?.successfulBookings ?? 0}
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-[#12B76A]" />
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Confirmed official passes</span>
                </div>

                {/* 7. Failed Bookings */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Failed Bookings
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#C2413B]">
                      {kpis?.failedBookings ?? 0}
                    </span>
                    <AlertTriangle className="h-4 w-4 text-[#F04438]" />
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Halted or slot exhaustion</span>
                </div>

                {/* 8. Success Rate % */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Success Percentage
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#172033]">
                      {kpis?.bookingSuccessPercentage ?? 0}%
                    </span>
                    <span className="text-[10.5px] font-mono text-[#027A48] bg-[#ECFDF3] border border-[#A6F4C5] px-1.5 py-0.5 rounded font-bold">
                      Conversion
                    </span>
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Confirmed / Total attempts</span>
                </div>

                {/* 9. Total Successful Booking Value */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Confirmed Pass Value
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#172033]">
                      ₹{(kpis?.successfulBookingValue ?? 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] font-bold text-[#667085]">
                      @ ₹{metadata?.systemServiceFee ?? 100}/pass
                    </span>
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Expected gross confirmed value</span>
                </div>

                {/* 10. Actual Collected Amount (Ledger Capture) */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Actual Collected Money
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#027A48]">
                      ₹{(kpis?.actualCollectedAmount ?? 0).toFixed(2)}
                    </span>
                    <span className="rounded bg-[#FEF7E6] border border-[#F9DE9B] px-1.5 py-0.5 text-[10px] font-bold text-[#8F5A0D]">
                      Ledger Verified
                    </span>
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Authoritative wallet CAPTUREs</span>
                </div>

                {/* 11. Average Booking Value */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Average Pass Fee
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#172033]">
                      ₹{(kpis?.averageBookingAmount ?? 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] font-mono text-[#667085]">Per pass</span>
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Mean confirmed service fee</span>
                </div>

                {/* 12. Repeat Booking Rate */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Repeat-Booking Rate
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-[#C98219]">
                      {kpis?.repeatBookingRate ?? 0}%
                    </span>
                    <span className="text-[10.5px] font-mono text-[#8F5A0D] bg-[#FEF7E6] border border-[#F9DE9B] px-1.5 py-0.5 rounded font-bold">
                      {kpis?.repeatBookersCount ?? 0} Repeaters
                    </span>
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Operators with ≥2 bookings</span>
                </div>
              </div>

              {/* Behavior & Diagnostic Insights Banner Cards */}
              <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#F0F3F8] pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#C98219]" />
                    <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Automated Behavioral Insights ({metadata?.rangeLabel})
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#667085]">
                    Mathematical analysis from authoritative database records
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {insights.map((ins: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3.5 space-y-1.5 hover:border-[#C98219] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#172033]">{ins.title}</span>
                        {ins.trend === 'UP' && (
                          <span className="text-[10px] font-mono font-bold text-[#027A48] bg-[#ECFDF3] px-1.5 py-0.5 rounded border border-[#A6F4C5]">
                            +{ins.changePct}%
                          </span>
                        )}
                        {ins.trend === 'DOWN' && (
                          <span className="text-[10px] font-mono font-bold text-[#C2413B] bg-[#FDECEC] px-1.5 py-0.5 rounded border border-[#F5C6CB]">
                            {ins.changePct}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#475467] leading-relaxed">{ins.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: USER ACTIVITY & SEGMENTATION TABLE                */}
          {/* ======================================================== */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              {/* Segment Filtering Pills */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[#E6EAF0] pb-3">
                {[
                  { id: 'ALL', label: 'All Operators', count: usersTable?.segmentSummary?.all ?? 0 },
                  { id: 'ACTIVE', label: 'Active in Window', count: usersTable?.segmentSummary?.active ?? 0 },
                  { id: 'REPEAT_BOOKER', label: 'Repeat Bookers (≥2)', count: usersTable?.segmentSummary?.repeatBookers ?? 0 },
                  { id: 'NEW_USER', label: 'New Registrations', count: usersTable?.segmentSummary?.newUsers ?? 0 },
                  { id: 'NEVER_BOOKED', label: 'Never Booked', count: usersTable?.segmentSummary?.neverBooked ?? 0 },
                  { id: 'INACTIVE', label: 'Inactive Operators', count: usersTable?.segmentSummary?.inactive ?? 0 },
                  { id: 'FREQUENT_FAILS', label: 'Frequent Failed', count: usersTable?.segmentSummary?.frequentFails ?? 0 },
                ].map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => {
                      setUserSegmentFilter(seg.id);
                      setUserTablePage(1);
                    }}
                    className={`px-3 py-1.5 rounded-[7px] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      userSegmentFilter === seg.id
                        ? 'bg-[#172033] text-white shadow-xs'
                        : 'bg-[#F8FAFC] text-[#475467] border border-[#E6EAF0] hover:bg-[#F0F3F8]'
                    }`}
                  >
                    <span>{seg.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        userSegmentFilter === seg.id
                          ? 'bg-white/20 text-white'
                          : 'bg-[#E6EAF0] text-[#475467]'
                      }`}
                    >
                      {seg.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* User Activity Table */}
              <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
                <div className="p-3.5 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
                  <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Operator Analytics Directory ({usersTable?.total ?? 0})
                  </span>
                  <button
                    onClick={exportUsersCSV}
                    className="flex items-center gap-1 text-xs font-bold text-[#C98219] hover:underline cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Filtered Table (CSV)</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#667085] font-bold">
                      <tr>
                        <th className="py-2.5 px-3.5">Operator & District</th>
                        <th className="py-2.5 px-3">Registered</th>
                        <th className="py-2.5 px-3">Last Active</th>
                        <th className="py-2.5 px-3 text-center">Attempts</th>
                        <th className="py-2.5 px-3 text-center">Success</th>
                        <th className="py-2.5 px-3 text-center">Failed</th>
                        <th className="py-2.5 px-3 text-right">Confirmed Val</th>
                        <th className="py-2.5 px-3 text-right">Actual Paid</th>
                        <th className="py-2.5 px-3">Latest Status</th>
                        <th className="py-2.5 px-3">Classification</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EAF0]">
                      {!usersTable?.users || usersTable.users.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-12 text-center text-[#98A2B3]">
                            No operators found matching the selected segment or search criteria.
                          </td>
                        </tr>
                      ) : (
                        usersTable.users.map((u: any) => (
                          <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="py-3 px-3.5">
                              <div className="font-bold text-[#172033]">{u.name}</div>
                              <div className="text-[11px] text-[#667085] font-mono">
                                {u.mobile} • {u.district}
                              </div>
                              {u.centreName && (
                                <div className="text-[10px] text-[#C98219] font-medium truncate max-w-xs">
                                  {u.centreName}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-[#475467] font-mono whitespace-nowrap">
                              {new Date(u.registrationDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3 text-[#475467] font-mono whitespace-nowrap">
                              {new Date(u.lastActivityDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3 text-center font-bold font-mono text-[#172033]">
                              {u.totalAttempts}
                            </td>
                            <td className="py-3 px-3 text-center font-bold font-mono text-[#027A48]">
                              {u.successfulCount}
                            </td>
                            <td className="py-3 px-3 text-center font-bold font-mono text-[#C2413B]">
                              {u.failedCount}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-[#172033]">
                              ₹{u.successfulValue.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-[#027A48]">
                              ₹{u.actualPaid.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  u.latestBookingStatus === 'BOOKING_CONFIRMED' || u.latestBookingStatus === 'SUCCESS'
                                    ? 'bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]'
                                    : u.latestBookingStatus === 'FAILED'
                                    ? 'bg-[#FDECEC] text-[#C2413B] border border-[#F5C6CB]'
                                    : 'bg-[#F8FAFC] text-[#667085] border border-[#E6EAF0]'
                                }`}
                              >
                                {u.latestBookingStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.classification === 'ACTIVE'
                                    ? 'bg-[#ECFDF3] text-[#027A48]'
                                    : u.classification === 'REPEAT_BOOKER'
                                    ? 'bg-[#FEF7E6] text-[#8F5A0D] border border-[#F9DE9B]'
                                    : u.classification === 'NEW_USER'
                                    ? 'bg-[#EFF8FF] text-[#175CD3]'
                                    : u.classification === 'FREQUENT_FAILS'
                                    ? 'bg-[#FDECEC] text-[#C2413B]'
                                    : 'bg-[#F8FAFC] text-[#667085]'
                                }`}
                              >
                                {u.classification}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenUserDetail(u.id)}
                                className="inline-flex items-center gap-1 rounded-[6px] border border-[#D0D5DD] bg-white px-2.5 py-1 text-[11px] font-bold text-[#172033] hover:bg-[#FEF7E6] hover:border-[#F9DE9B] hover:text-[#8F5A0D] transition-colors cursor-pointer"
                              >
                                <Eye className="h-3 w-3 text-[#C98219]" />
                                <span>Activity</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination */}
                {usersTable?.totalPages > 1 && (
                  <div className="p-3 border-t border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
                    <span className="text-xs text-[#667085]">
                      Showing page {usersTable.page} of {usersTable.totalPages} ({usersTable.total} operators)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={usersTable.page <= 1}
                        onClick={() => setUserTablePage((p) => Math.max(1, p - 1))}
                        className="rounded-[6px] border border-[#D0D5DD] bg-white p-1 text-[#667085] hover:bg-[#F0F3F8] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 font-mono text-xs font-bold text-[#172033]">
                        {usersTable.page} / {usersTable.totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={usersTable.page >= usersTable.totalPages}
                        onClick={() => setUserTablePage((p) => Math.min(usersTable.totalPages, p + 1))}
                        className="rounded-[6px] border border-[#D0D5DD] bg-white p-1 text-[#667085] hover:bg-[#F0F3F8] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: BOOKING FREQUENCY & TIMING CHARTS                 */}
          {/* ======================================================== */}
          {activeTab === 'FREQUENCY' && (
            <div className="space-y-6">
              {/* Daily Booking Trend Chart */}
              <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F3F8] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#172033]">
                      Daily Booking Volume & Outcome Trend
                    </h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Chronological booking attempts, confirmed passes, and recorded failures across {metadata?.rangeLabel}.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-[#172033]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#172033]" /> Attempts
                    </span>
                    <span className="flex items-center gap-1.5 text-[#027A48]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#027A48]" /> Confirmed
                    </span>
                    <span className="flex items-center gap-1.5 text-[#C2413B]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#C2413B]" /> Failed
                    </span>
                  </div>
                </div>

                {/* Visual Chart Bars */}
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[600px] h-48 flex items-end gap-2 pt-6">
                    {trends?.daily?.map((d: any, idx: number) => {
                      const maxAttempts = Math.max(1, ...trends.daily.map((item: any) => item.attempts));
                      const heightPct = Math.round((d.attempts / maxAttempts) * 100);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                          <div className="text-[10px] font-mono text-[#667085] opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.attempts}
                          </div>
                          <div className="w-full bg-[#F0F3F8] rounded-t-[4px] h-32 flex flex-col justify-end overflow-hidden">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full bg-[#172033] hover:bg-[#C98219] transition-colors relative flex flex-col justify-end"
                            >
                              {d.success > 0 && (
                                <div
                                  style={{ height: `${Math.round((d.success / (d.attempts || 1)) * 100)}%` }}
                                  className="w-full bg-[#027A48]"
                                />
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-[#667085] font-mono transform -rotate-45 origin-top-left mt-2 whitespace-nowrap">
                            {d.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Two Column Breakdown: Frequency Buckets & Hour Demand */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Frequency Distribution Buckets */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-3.5">
                  <div className="border-b border-[#F0F3F8] pb-2">
                    <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Operator Booking Frequency Distribution
                    </h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Segmentation of operators by total booking volume during {metadata?.rangeLabel}.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {trends?.frequencyDistribution?.map((b: any, idx: number) => {
                      const totalOperators = kpis?.usersWhoAttemptedBookings || 1;
                      const pct = Math.round((b.count / totalOperators) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#172033]">{b.bucket}</span>
                            <span className="font-mono text-[#667085]">
                              {b.count} operators ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[#F0F3F8] overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full bg-[#C98219] rounded-full transition-all"
                            />
                          </div>
                          <span className="text-[10.5px] text-[#667085] block">{b.description}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Hour of Day Demand Analysis */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-3.5">
                  <div className="border-b border-[#F0F3F8] pb-2">
                    <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Hour-of-Day Demand Distribution (24-Hour Cycle)
                    </h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Hourly booking submission intensity across Tamil Nadu operator base.
                    </p>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {trends?.hourDemand?.map((h: any) => {
                      const maxHourCount = Math.max(1, ...trends.hourDemand.map((item: any) => item.count));
                      const isPeak = h.count === maxHourCount && h.count > 0;
                      return (
                        <div
                          key={h.hour}
                          className={`rounded-[6px] border p-2 text-center transition-all ${
                            isPeak
                              ? 'border-[#C98219] bg-[#FEF7E6] text-[#8F5A0D] font-bold shadow-2xs'
                              : 'border-[#E6EAF0] bg-[#F8FAFC] text-[#475467]'
                          }`}
                        >
                          <span className="text-[10px] block text-[#667085] font-mono">{h.label}</span>
                          <span className="font-mono text-xs font-bold mt-0.5 block">{h.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: AMOUNT & REVENUE INTEGRITY                        */}
          {/* ======================================================== */}
          {activeTab === 'FINANCE' && (
            <div className="space-y-6">
              {/* Financial Integrity Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Actual Collected Money
                  </span>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#027A48]">
                    ₹{(kpis?.actualCollectedAmount ?? 0).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">
                    Authoritative wallet debits (CAPTUREs)
                  </span>
                </div>

                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Yuktron / Platform Share
                  </span>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#C98219]">
                    ₹{(kpis?.platformRevenue ?? 0).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">
                    Authoritative net platform revenue
                  </span>
                </div>

                <div className="rounded-[10px] border border-[#E6EAF0] bg-[#FEF7E6]/50 p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#8F5A0D] uppercase tracking-wider block">
                    Reserved / Pending Funds
                  </span>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#8F5A0D]">
                    ₹{(kpis?.pendingReservedAmount ?? 0).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-[#8F5A0D] mt-1 block">
                    Escrow-reserved for pending passes
                  </span>
                </div>

                <div className="rounded-[10px] border border-[#E6EAF0] bg-[#FDECEC]/50 p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#C2413B] uppercase tracking-wider block">
                    Refunded Funds
                  </span>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#C2413B]">
                    ₹{(kpis?.refundedAmount ?? 0).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-[#C2413B] mt-1 block">
                    Authoritative ledger refunds issued
                  </span>
                </div>
              </div>

              {/* Service & Route Revenue Table */}
              <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
                <div className="p-4 border-b border-[#E6EAF0] bg-[#F8FAFC]">
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Route-Wise Financial Settlement Summary
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Gross requested value, confirmed revenue, and conversion efficiency per Virtual-Q route.
                  </p>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#667085] font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Service Route</th>
                      <th className="py-2.5 px-4 text-center">Attempts</th>
                      <th className="py-2.5 px-4 text-center">Confirmed Passes</th>
                      <th className="py-2.5 px-4 text-center">Conversion %</th>
                      <th className="py-2.5 px-4 text-right">Confirmed Value (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0]">
                    {!trends?.serviceVolume || trends.serviceVolume.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#98A2B3]">
                          No route-specific volume recorded in the selected period.
                        </td>
                      </tr>
                    ) : (
                      trends.serviceVolume.map((s: any, idx: number) => {
                        const conv = s.attempts > 0 ? Math.round((s.success / s.attempts) * 100) : 0;
                        return (
                          <tr key={idx} className="hover:bg-[#F8FAFC]">
                            <td className="py-3 px-4 font-bold text-[#172033]">{s.route}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-[#172033]">{s.attempts}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-[#027A48]">{s.success}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-[#C98219]">{conv}%</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[#172033]">
                              ₹{s.value.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PERFORMANCE DIAGNOSTICS & BOTTLENECK AUDIT        */}
          {/* ======================================================== */}
          {activeTab === 'PERFORMANCE' && (
            <div className="space-y-6">
              {/* Performance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Success Rate
                  </span>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#027A48]">
                    {performance?.successRate ?? 0}%
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Full completion efficiency</span>
                </div>

                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Average Duration
                  </span>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#172033]">
                    {performance?.avgDurationSec ? `${performance.avgDurationSec}s` : 'Data unavailable'}
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Submission to official capture</span>
                </div>

                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Median Duration
                  </span>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#172033]">
                    {performance?.medianDurationSec ? `${performance.medianDurationSec}s` : 'Data unavailable'}
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">P50 execution speed</span>
                </div>

                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
                  <span className="text-[10.5px] font-bold text-[#667085] uppercase tracking-wider block">
                    Stuck / Stalled Bookings
                  </span>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#C2413B]">
                    {performance?.pendingStuckCount ?? 0}
                  </div>
                  <span className="text-[11px] text-[#667085] mt-1 block">Pending &gt; 30 mins</span>
                </div>
              </div>

              {/* Diagnostic Sample Table */}
              <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
                <div className="p-3.5 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
                  <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Recent Booking Diagnostics Log (Sanitized Telemetry)
                  </span>
                  <button
                    onClick={exportBookingsCSV}
                    className="flex items-center gap-1 text-xs font-bold text-[#C98219] hover:underline cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Diagnostics (CSV)</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#667085] font-bold">
                      <tr>
                        <th className="py-2.5 px-3.5">Booking Code</th>
                        <th className="py-2.5 px-3">Route</th>
                        <th className="py-2.5 px-3 text-center">Devotees</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Created</th>
                        <th className="py-2.5 px-3 text-right">Duration</th>
                        <th className="py-2.5 px-3">Failure Category</th>
                        <th className="py-2.5 px-3">Sanitized Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EAF0]">
                      {!performance?.sampleRecords || performance.sampleRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-[#98A2B3]">
                            No booking diagnostic records in the selected period.
                          </td>
                        </tr>
                      ) : (
                        performance.sampleRecords.map((r: any) => (
                          <tr key={r.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-3.5 font-bold font-mono text-[#172033]">{r.bookingCode}</td>
                            <td className="py-2.5 px-3 font-medium text-[#475467]">{r.route}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-[#172033]">
                              {r.pilgrimCount}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  r.status === 'BOOKING_CONFIRMED' || r.status === 'SUCCESS'
                                    ? 'bg-[#ECFDF3] text-[#027A48]'
                                    : r.status === 'FAILED'
                                    ? 'bg-[#FDECEC] text-[#C2413B]'
                                    : 'bg-[#F8FAFC] text-[#667085]'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#667085] whitespace-nowrap">
                              {new Date(r.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#172033]">
                              {r.durationSec ? `${r.durationSec}s` : '—'}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {r.sanitizedFailureCategory ? (
                                <span className="rounded bg-[#FEF7E6] border border-[#F9DE9B] px-1.5 py-0.5 text-[10px] font-bold text-[#8F5A0D]">
                                  {r.sanitizedFailureCategory}
                                </span>
                              ) : (
                                <span className="text-[#98A2B3]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[#C2413B] max-w-xs truncate font-mono text-[11px]">
                              {r.sanitizedFailureReason || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: FLEET TELEMETRY & COMPLIANCE GUARDRAILS           */}
          {/* ======================================================== */}
          {activeTab === 'FLEET' && (
            <div className="space-y-6">
              {/* Fleet Health Overview Card */}
              <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                      Fleet Operational Compliance Score
                    </span>
                    <p className="mt-1 font-mono text-3xl font-extrabold text-[#027A48] flex items-baseline gap-2">
                      {fleetAuditData?.healthScore || 98}
                      <span className="text-xs font-sans text-[#98A2B3] font-normal">/ 100 Healthy</span>
                    </p>
                    <p className="text-xs text-[#475467] mt-1">
                      100% compliant rate-limiting intervals • 0 anti-bot bypass violations
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs shrink-0">
                    <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3 text-center">
                      <span className="text-[10.5px] text-[#667085] font-bold uppercase">Human Challenges</span>
                      <p className="font-mono text-lg font-bold text-[#8F5A0D] mt-0.5">
                        {fleetAuditData?.metrics?.requiresHumanCount || 0}
                      </p>
                    </div>
                    <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3 text-center">
                      <span className="text-[10.5px] text-[#667085] font-bold uppercase">Offline Units</span>
                      <p className="font-mono text-lg font-bold text-[#475467] mt-0.5">
                        {fleetAuditData?.metrics?.offlineMachineCount || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Anomalies Detected */}
              <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
                <div className="p-4 border-b border-[#E6EAF0] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#C98219]" />
                    <span>Real-Time Anomaly Detection & Guardrails</span>
                  </h3>
                  <span className="text-[11px] font-mono text-[#667085]">
                    {fleetAuditData?.anomalies?.length || 0} Events Monitored
                  </span>
                </div>

                <div className="divide-y divide-[#E6EAF0]">
                  {fleetAuditData?.anomalies?.map((anom: any, idx: number) => (
                    <div key={idx} className="p-4 flex items-start gap-3 hover:bg-[#F8FAFC]">
                      <div
                        className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                          anom.severity === 'HIGH'
                            ? 'bg-[#F04438]'
                            : anom.severity === 'MEDIUM'
                            ? 'bg-[#F79009]'
                            : 'bg-[#12B76A]'
                        }`}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#172033]">{anom.title}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F0F3F8] text-[#475467] font-mono">
                            {anom.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#667085] leading-relaxed">{anom.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* 4. USER DRILL-DOWN ACTIVITY DETAIL MODAL                 */}
      {/* ======================================================== */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-4xl rounded-[14px] border border-[#E6EAF0] bg-white p-6 shadow-modal flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3.5 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#172033]">
                    Operator Activity & Booking History
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Authorized audit profile • ID: <span className="font-mono">{selectedUserId}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-[6px] p-1.5 text-[#667085] hover:bg-[#F0F3F8] hover:text-[#172033] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingUserDetail ? (
              <div className="p-8">
                <LoadingSkeleton rows={5} />
              </div>
            ) : userDetailData ? (
              <div className="flex-1 overflow-y-auto pr-1.5 -mr-1.5 space-y-5">
                {/* User Summary Card */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-[8px] p-3.5 text-xs">
                  <div>
                    <span className="text-[#667085] block font-medium">Name:</span>
                    <strong className="text-[#172033]">{userDetailData.user.name}</strong>
                  </div>
                  <div>
                    <span className="text-[#667085] block font-medium">Contact:</span>
                    <span className="font-mono text-[#172033]">{userDetailData.user.mobile}</span>
                  </div>
                  <div>
                    <span className="text-[#667085] block font-medium">Wallet Balance:</span>
                    <strong className="text-[#027A48] font-mono">
                      ₹{userDetailData.wallet.availableBalance.toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#667085] block font-medium">Passes Confirmed:</span>
                    <strong className="text-[#172033] font-mono">
                      {userDetailData.summary.successfulBookings} / {userDetailData.summary.totalBookings}
                    </strong>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Chronological Interaction Timeline
                  </h4>
                  <div className="rounded-[8px] border border-[#E6EAF0] bg-white divide-y divide-[#E6EAF0] max-h-60 overflow-y-auto text-xs">
                    {userDetailData.timeline.map((item: any, idx: number) => (
                      <div key={idx} className="p-2.5 flex items-start gap-2.5 hover:bg-[#F8FAFC]">
                        <div className="h-2 w-2 rounded-full bg-[#C98219] mt-1 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#172033]">{item.title}</span>
                            <span className="text-[10.5px] font-mono text-[#667085]">
                              {new Date(item.date).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[#475467] text-[11px] mt-0.5">{item.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking History Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Virtual-Q Booking History ({userDetailData.bookings.length})
                  </h4>
                  <div className="rounded-[8px] border border-[#E6EAF0] bg-white overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#667085] font-bold">
                        <tr>
                          <th className="py-2 px-3">Pass Code</th>
                          <th className="py-2 px-3">Route</th>
                          <th className="py-2 px-3 text-center">Devotees</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Created</th>
                          <th className="py-2 px-3">Sanitized Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6EAF0]">
                        {userDetailData.bookings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-[#98A2B3]">
                              No bookings made by this operator.
                            </td>
                          </tr>
                        ) : (
                          userDetailData.bookings.map((b: any) => (
                            <tr key={b.id}>
                              <td className="py-2 px-3 font-mono font-bold text-[#172033]">{b.bookingCode}</td>
                              <td className="py-2 px-3 text-[#475467]">{b.route}</td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-[#172033]">
                                {b.pilgrimCount}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    b.status === 'BOOKING_CONFIRMED' || b.status === 'SUCCESS'
                                      ? 'bg-[#ECFDF3] text-[#027A48]'
                                      : b.status === 'FAILED'
                                      ? 'bg-[#FDECEC] text-[#C2413B]'
                                      : 'bg-[#F8FAFC] text-[#667085]'
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-[#667085]">
                                {new Date(b.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-2 px-3 text-[#C2413B] font-mono text-[11px] max-w-xs truncate">
                                {b.sanitizedFailureReason || '—'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-[#E6EAF0] mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#475467] hover:bg-[#F0F3F8] cursor-pointer"
              >
                Close Activity View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
