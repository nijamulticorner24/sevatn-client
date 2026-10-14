'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, formatTime, cn } from '../../../lib/utils';
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Download,
  Eye,
  Check,
  X,
  CreditCard,
  Building2,
  TrendingUp,
  Receipt,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Coins,
  FileCheck2,
  FileText,
  RotateCcw,
  Upload,
} from 'lucide-react';

interface LedgerOverviewData {
  summary: {
    grandTotalCollections: number;
    grandPlatformRevenue: number;
    workerSettlement: number;
    totalCaptured: number;
    capturedCount: number;
    totalWaitingItemsCount: number;
    totalWaitingAmount: number;
    networkHoldings: {
      totalAvailableBalance: number;
      totalReservedBalance: number;
      walletsCount: number;
    };
  };
  collectionsBreakdown: {
    walletTopups: {
      completedAmount: number;
      completedCount: number;
      pendingAmount: number;
      pendingCount: number;
    };
    servicePassCaptures: {
      totalAmount: number;
      totalCount: number;
      platformShare: number;
      workerShare: number;
    };
    centreRegistrations: {
      collectedAmount: number;
      collectedCount: number;
      pendingCount: number;
      pendingAmount: number;
    };
    partnerFranchise: {
      collectedAmount: number;
      collectedCount: number;
      pendingCount: number;
      pendingAmount?: number;
    };
  };
  escrowLifecycle: {
    totalTopupsCompleted: number;
    totalReserved: number;
    totalCaptured: number;
    totalReleased: number;
    totalRefunded: number;
    activeReservedInQueue: number;
    activeAvailableInWallets: number;
  };
  waitingActionItems: {
    pendingTopupsCount: number;
    pendingTopupsAmount: number;
    pendingCentresCount: number;
    pendingCentresAmount: number;
    pendingPartnersCount?: number;
    pendingPartnersAmount?: number;
    pendingPayoutsCount: number;
    pendingPayoutsAmount: number;
    pendingRefundsCount: number;
    pendingRefundsAmount: number;
    recentWaitingTopups: any[];
    pendingCentres: any[];
    pendingPartners?: any[];
    approvedPartnersRecent?: any[];
    approvedCentresRecent?: any[];
  };
}

interface TransactionItem {
  id: string;
  type: string;
  amount: number | string;
  yuktronShare?: number | string;
  workerShare?: number | string;
  status: string;
  reference?: string;
  metadata?: any;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    mobile: string;
    email: string;
    centre?: {
      id: string;
      centreName: string;
      centreCode: string;
      district: string;
      taluk: string;
    } | null;
  };
  booking?: {
    id: string;
    bookingCode: string;
    route: string;
    requestedDateStr?: string;
    status: string;
  } | null;
}

interface RefundItem {
  id: string;
  amount: number | string;
  reason: string;
  upiId?: string | null;
  proofUrl?: string | null;
  status: string;
  reference?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  processedAt?: string | null;
  user?: {
    name: string;
    email: string;
    mobile: string;
    centre?: {
      centreName: string;
      centreCode?: string;
      district?: string;
    } | null;
  };
}

export default function FinancialLedgerPage() {
  const [overview, setOverview] = useState<LedgerOverviewData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [counts, setCounts] = useState<{ all: number; pending: number; completed: number; failed: number }>({
    all: 0,
    pending: 0,
    completed: 0,
    failed: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED' | 'ALL' | 'FAILED' | 'REGISTRATIONS' | 'REFUNDS'>('PENDING');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  // Refunds State
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>('ALL');

  // Refund Settlement Modal
  const [settlingRefund, setSettlingRefund] = useState<RefundItem | null>(null);
  const [settleReference, setSettleReference] = useState<string>('');
  const [settleProofUrl, setSettleProofUrl] = useState<string | null>(null);
  const [settleNotes, setSettleNotes] = useState<string>('');
  const [submittingSettlement, setSubmittingSettlement] = useState(false);

  // Refund Rejection Modal
  const [rejectingRefund, setRejectingRefund] = useState<RefundItem | null>(null);
  const [rejectRefundNotes, setRejectRefundNotes] = useState<string>('');
  const [submittingRefundReject, setSubmittingRefundReject] = useState(false);

  // Proof Viewer Modal for Refund
  const [viewingRefundProof, setViewingRefundProof] = useState<RefundItem | null>(null);

  // Modals & Action States
  const [selectedProof, setSelectedProof] = useState<{
    txId?: string;
    title: string;
    amount: number;
    reference?: string;
    receiptUrl?: string;
    fileName?: string;
    centreName?: string;
    partnerName?: string;
    contact?: string;
    jurisdiction?: string;
    date: string;
    type: 'TOPUP' | 'CENTRE_FEE' | 'PARTNER_FEE';
    targetId: string;
  } | null>(null);

  const [rejectingTarget, setRejectingTarget] = useState<{
    id: string;
    type: 'TOPUP' | 'CENTRE_FEE' | 'PARTNER_FEE';
    title: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Onboarding Sub-Tab & Filter State
  const [onboardingSubTab, setOnboardingSubTab] = useState<'ALL' | 'PARTNERS' | 'CENTRES' | 'HISTORY'>('ALL');
  const [onboardingSearch, setOnboardingSearch] = useState<string>('');

  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadOverview = async () => {
    try {
      const data = await api.getLedgerOverview();
      setOverview(data);
    } catch (err: any) {
      console.error('Failed to load ledger overview:', err);
      showToast('error', err.message || 'Failed to load financial summary');
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadTransactions = async (page = 1) => {
    setLoadingTx(true);
    try {
      let statusParam: string | undefined = undefined;
      if (activeTab === 'PENDING') statusParam = 'PENDING';
      else if (activeTab === 'COMPLETED') statusParam = 'COMPLETED';
      else if (activeTab === 'FAILED') statusParam = 'FAILED';

      let dateFrom: string | undefined;
      let dateTo: string | undefined;
      const now = new Date();

      if (dateFilter === 'TODAY') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFrom = today.toISOString();
      } else if (dateFilter === '7DAYS') {
        const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFrom = last7.toISOString();
      } else if (dateFilter === 'MONTH') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFrom = firstDay.toISOString();
      }

      const res = await api.getLedgerTransactions({
        page,
        limit: pagination.limit,
        status: statusParam,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        search: searchQuery.trim() || undefined,
        dateFrom,
        dateTo,
      });

      setTransactions(res?.transactions || []);
      setPagination(res?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      if (res?.counts) {
        setCounts(res.counts);
      }
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      showToast('error', err.message || 'Failed to load transactions');
    } finally {
      setLoadingTx(false);
    }
  };

  const loadRefunds = async () => {
    setLoadingRefunds(true);
    try {
      const data = await api.getRefunds(refundStatusFilter !== 'ALL' ? refundStatusFilter : undefined);
      setRefunds(data || []);
    } catch (err: any) {
      console.error('Failed to load refunds:', err);
      showToast('error', err.message || 'Failed to load refund requests');
    } finally {
      setLoadingRefunds(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadOverview(),
      activeTab === 'REFUNDS' ? loadRefunds() : loadTransactions(pagination.page),
    ]);
    setRefreshing(false);
    showToast('success', 'Financial ledger updated with live data');
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'REFUNDS') {
      loadRefunds();
    } else if (activeTab !== 'REGISTRATIONS') {
      loadTransactions(1);
    }
  }, [activeTab, typeFilter, dateFilter, refundStatusFilter]);

  const handleOpenSettleRefund = (refund: RefundItem) => {
    setSettlingRefund(refund);
    setSettleReference('');
    setSettleProofUrl(null);
    setSettleNotes('');
  };

  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Screenshot size must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettleProofUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitSettleRefund = async () => {
    if (!settlingRefund) return;
    if (!settleReference.trim()) {
      showToast('error', 'Please enter the Bank UTR / Reference ID');
      return;
    }
    setSubmittingSettlement(true);
    try {
      await api.processRefund(settlingRefund.id, 'APPROVE', {
        reference: settleReference.trim(),
        proofUrl: settleProofUrl || undefined,
        adminNotes: settleNotes.trim() || undefined,
      });
      showToast('success', `Refund of ${formatCurrency(settlingRefund.amount)} settled and approved!`);
      setSettlingRefund(null);
      await Promise.all([loadOverview(), loadRefunds()]);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to settle refund: ' + err.message);
    } finally {
      setSubmittingSettlement(false);
    }
  };

  const handleSubmitRejectRefund = async () => {
    if (!rejectingRefund) return;
    if (!rejectRefundNotes.trim()) {
      showToast('error', 'Please provide a reason for rejecting the refund');
      return;
    }
    setSubmittingRefundReject(true);
    try {
      await api.processRefund(rejectingRefund.id, 'REJECT', {
        adminNotes: rejectRefundNotes.trim(),
      });
      showToast('success', 'Refund request rejected.');
      setRejectingRefund(null);
      setRejectRefundNotes('');
      await Promise.all([loadOverview(), loadRefunds()]);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reject refund');
    } finally {
      setSubmittingRefundReject(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTransactions(1);
  };

  const handleApproveTopup = async (txId: string) => {
    setProcessingAction(txId);
    try {
      await api.verifyLedgerTopup(txId);
      showToast('success', 'Top-up approved successfully! Centre wallet credited.');
      if (selectedProof?.txId === txId) setSelectedProof(null);
      await Promise.all([loadOverview(), loadTransactions(pagination.page)]);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve top-up');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingTarget) return;
    setProcessingAction(rejectingTarget.id);
    try {
      if (rejectingTarget.type === 'TOPUP') {
        await api.rejectLedgerTopup(rejectingTarget.id, rejectReason || undefined);
        showToast('success', 'Top-up payment rejected.');
      } else if (rejectingTarget.type === 'CENTRE_FEE') {
        await api.rejectLedgerCentreFee(rejectingTarget.id, rejectReason || undefined);
        showToast('success', 'Centre registration payment rejected.');
      } else if (rejectingTarget.type === 'PARTNER_FEE') {
        await api.rejectLedgerPartnerFee(rejectingTarget.id, rejectReason || undefined);
        showToast('success', 'Partner franchise fee rejected.');
      }
      setRejectingTarget(null);
      setRejectReason('');
      if (selectedProof) setSelectedProof(null);
      await Promise.all([loadOverview(), loadTransactions(pagination.page)]);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reject transaction');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleApproveCentreFee = async (centreId: string) => {
    setProcessingAction(centreId);
    try {
      await api.verifyLedgerCentreFee(centreId);
      showToast('success', 'Centre registration verified and centre account activated!');
      if (selectedProof?.targetId === centreId) setSelectedProof(null);
      await Promise.all([loadOverview(), loadTransactions(pagination.page)]);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to verify centre registration');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleApprovePartnerFee = async (partnerId: string, notes?: string) => {
    setProcessingAction(partnerId);
    try {
      await api.verifyLedgerPartnerFee(partnerId, notes);
      showToast('success', 'Partner franchise fee verified and partner account activated!');
      if (selectedProof?.targetId === partnerId) setSelectedProof(null);
      await Promise.all([loadOverview(), loadTransactions(pagination.page)]);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to verify partner franchise');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast('error', 'No transactions available to export in current filter');
      return;
    }

    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Reference / UTR',
      'Centre Name',
      'Centre Code',
      'District',
      'User Mobile',
      'Type',
      'Payment Method',
      'Amount (INR)',
      'Yuktron Share',
      'Worker Share',
      'Status',
    ];

    const rows = transactions.map((t) => [
      `"${t.id}"`,
      `"${formatDate(t.createdAt)}"`,
      `"${formatTime(t.createdAt)}"`,
      `"${t.reference || ''}"`,
      `"${t.user?.centre?.centreName || ''}"`,
      `"${t.user?.centre?.centreCode || ''}"`,
      `"${t.user?.centre?.district || ''}"`,
      `"${t.user?.mobile || ''}"`,
      `"${t.type}"`,
      `"${t.metadata?.paymentMethod || 'SYSTEM'}"`,
      Number(t.amount || 0).toFixed(2),
      Number(t.yuktronShare || 0).toFixed(2),
      Number(t.workerShare || 0).toFixed(2),
      `"${t.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial-ledger-${activeTab.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Ledger statement exported successfully');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', `${label} copied to clipboard`);
  };

  const pendingCentresList = overview?.waitingActionItems?.pendingCentres || [];
  const pendingPartnersList = overview?.waitingActionItems?.pendingPartners || [];
  const approvedPartnersRecent = overview?.waitingActionItems?.approvedPartnersRecent || [];
  const approvedCentresRecent = overview?.waitingActionItems?.approvedCentresRecent || [];
  const totalPendingOnboardings = pendingCentresList.length + pendingPartnersList.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-elevated transition-all border text-xs font-semibold backdrop-blur-md',
            toastMessage.type === 'success'
              ? 'bg-emerald-900/90 text-white border-emerald-500'
              : 'bg-red-900/90 text-white border-red-500',
          )}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E6EAF0]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDF7ED] text-[#C98219] border border-[#F9DE9B]">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                Financial Ledger & Collections
              </h1>
              <p className="text-xs text-[#667085] mt-0.5">
                Real-time collection metrics, waiting payment verifications, and double-entry transaction audit
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-[7px] border border-[#E6EAF0] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F8FAFC] hover:text-[#172033] transition-all shadow-subtle"
            title="Download CSV Statement"
          >
            <Download className="h-3.5 w-3.5 text-[#667085]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-[7px] border border-[#C98219]/30 bg-[#FDF7ED] text-xs font-semibold text-[#8F5A0D] hover:bg-[#FBEED7] transition-all shadow-subtle disabled:opacity-50"
            title="Refresh Live Financial Ledger"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-[#C98219]', refreshing && 'animate-spin')} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Action Required: Waiting Payments Alert Banner */}
      {overview && overview.summary.totalWaitingItemsCount > 0 && (
        <div className="rounded-[10px] border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/50 to-white p-4 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm mt-0.5">
              <Clock className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Priority Action Required
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                  {overview.summary.totalWaitingItemsCount} Pending
                </span>
              </div>
              <p className="text-sm font-semibold text-[#172033] mt-0.5">
                {overview.summary.totalWaitingItemsCount} Payment(s) Awaiting Approval & Verification ({formatCurrency(overview.summary.totalWaitingAmount)})
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {overview.waitingActionItems.pendingTopupsCount > 0 && (
                  <button
                    onClick={() => setActiveTab('PENDING')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-xs font-medium text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
                  >
                    <span>{overview.waitingActionItems.pendingTopupsCount} Wallet Top-up(s)</span>
                    <span className="font-mono font-bold">({formatCurrency(overview.waitingActionItems.pendingTopupsAmount)})</span>
                  </button>
                )}
                {Number(overview.waitingActionItems.pendingPartnersCount || 0) > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab('REGISTRATIONS');
                      setOnboardingSubTab('PARTNERS');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-xs font-medium text-amber-900 border border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    <span>{overview.waitingActionItems.pendingPartnersCount} Partner Onboarding(s)</span>
                    <span className="font-mono font-bold">({formatCurrency(overview.waitingActionItems.pendingPartnersAmount || 0)})</span>
                  </button>
                )}
                {overview.waitingActionItems.pendingCentresCount > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab('REGISTRATIONS');
                      setOnboardingSubTab('CENTRES');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-xs font-medium text-blue-900 border border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    <span>{overview.waitingActionItems.pendingCentresCount} Centre Registration(s)</span>
                    <span className="font-mono font-bold">({formatCurrency(overview.waitingActionItems.pendingCentresAmount)})</span>
                  </button>
                )}
                {overview.waitingActionItems.pendingRefundsCount > 0 && (
                  <button
                    onClick={() => setActiveTab('REFUNDS')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-xs font-medium text-purple-900 border border-purple-200 hover:bg-purple-50 transition-colors"
                  >
                    <span>{overview.waitingActionItems.pendingRefundsCount} Refund Request(s)</span>
                    <span className="font-mono font-bold">({formatCurrency(overview.waitingActionItems.pendingRefundsAmount)})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab(totalPendingOnboardings > 0 ? 'REGISTRATIONS' : 'PENDING')}
            className="flex items-center gap-1.5 h-9 px-4 rounded-[7px] bg-[#C98219] hover:bg-[#B37316] text-white text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Review Waiting Payments</span>
          </button>
        </div>
      )}

      {/* KPI Cards: Total Collections & Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Collections */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#667085] uppercase">
              Total Collections
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#FDF7ED] text-[#C98219]">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-bold text-[#172033]">
              {loadingOverview ? '—' : formatCurrency(overview?.summary?.grandTotalCollections || 0)}
            </div>
            <p className="text-[11px] text-[#667085] mt-1">
              Top-ups ({formatCurrency(overview?.collectionsBreakdown?.walletTopups?.completedAmount || 0)}) + Onboarding ({formatCurrency((overview?.collectionsBreakdown?.centreRegistrations?.collectedAmount || 0) + (overview?.collectionsBreakdown?.partnerFranchise?.collectedAmount || 0))})
            </p>
          </div>
        </div>

        {/* Metric 2: Realized Platform Revenue */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#667085] uppercase">
              Realized Platform Revenue
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-bold text-emerald-700">
              {loadingOverview ? '—' : formatCurrency(overview?.summary?.grandPlatformRevenue || 0)}
            </div>
            <p className="text-[11px] text-[#667085] mt-1">
              Confirmed e-Pass captures + Onboarding fees
            </p>
          </div>
        </div>

        {/* Metric 3: Waiting Payments */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#667085] uppercase">
              Waiting Payment Verification
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-bold text-amber-600 flex items-baseline gap-2">
              <span>{loadingOverview ? '—' : formatCurrency(overview?.summary?.totalWaitingAmount || 0)}</span>
              {!loadingOverview && overview?.summary?.totalWaitingItemsCount! > 0 && (
                <span className="text-xs font-sans font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  {overview?.summary?.totalWaitingItemsCount} pending
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#667085] mt-1">
              Top-up & onboarding proofs awaiting review
            </p>
          </div>
        </div>

        {/* Metric 4: Active Escrow Holdings */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#667085] uppercase">
              Active Escrow Holdings
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-blue-50 text-blue-600">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-mono font-bold text-blue-800">
              {loadingOverview ? '—' : formatCurrency(overview?.summary?.networkHoldings?.totalAvailableBalance || 0)}
            </div>
            <p className="text-[11px] text-[#667085] mt-1">
              Available in centre wallets + {formatCurrency(overview?.summary?.networkHoldings?.totalReservedBalance || 0)} in queue holds
            </p>
          </div>
        </div>
      </div>

      {/* Financial Streams Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Stream 1: Inbound Top-ups */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F7]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475467]">
                Centre Wallet Top-Ups
              </span>
              <Wallet className="h-3.5 w-3.5 text-[#667085]" />
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Completed / Credited:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatCurrency(overview?.collectionsBreakdown?.walletTopups?.completedAmount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Waiting Approval:</span>
                <span className="font-mono font-bold text-amber-600">
                  {formatCurrency(overview?.collectionsBreakdown?.walletTopups?.pendingAmount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Completed Transactions:</span>
                <span className="font-mono text-[#172033]">
                  {overview?.collectionsBreakdown?.walletTopups?.completedCount || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#F2F4F7] text-[10.5px] text-[#98A2B3]">
            Pre-funded via UPI QR / Bank transfer
          </div>
        </div>

        {/* Stream 2: Verified Pass Captures */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F7]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475467]">
                Service Fee Captures
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Total Captured:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatCurrency(overview?.collectionsBreakdown?.servicePassCaptures?.totalAmount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Platform Share (80%):</span>
                <span className="font-mono font-bold text-[#C98219]">
                  {formatCurrency(overview?.collectionsBreakdown?.servicePassCaptures?.platformShare || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Operator Share (20%):</span>
                <span className="font-mono font-bold text-blue-700">
                  {formatCurrency(overview?.collectionsBreakdown?.servicePassCaptures?.workerShare || 0)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#F2F4F7] text-[10.5px] text-[#98A2B3]">
            ₹100 captured per confirmed e-Pass
          </div>
        </div>

        {/* Stream 3: Centre Onboarding */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F7]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475467]">
                Centre Onboarding (₹249)
              </span>
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Fees Collected:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatCurrency(overview?.collectionsBreakdown?.centreRegistrations?.collectedAmount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Paid Active Centres:</span>
                <span className="font-mono text-[#172033]">
                  {overview?.collectionsBreakdown?.centreRegistrations?.collectedCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Pending Verification:</span>
                <span className={cn('font-mono font-bold', (overview?.collectionsBreakdown?.centreRegistrations?.pendingCount || 0) > 0 ? 'text-blue-600' : 'text-[#667085]')}>
                  {overview?.collectionsBreakdown?.centreRegistrations?.pendingCount || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#F2F4F7] text-[10.5px] text-[#98A2B3]">
            1-year access licence per CSC/e-Sevai
          </div>
        </div>

        {/* Stream 4: Partner Franchise Onboarding */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F7]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475467]">
                Partner Franchise (₹599)
              </span>
              <Building2 className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Fees Collected:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatCurrency(overview?.collectionsBreakdown?.partnerFranchise?.collectedAmount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Active Franchisees:</span>
                <span className="font-mono text-[#172033]">
                  {overview?.collectionsBreakdown?.partnerFranchise?.collectedCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Pending Verification:</span>
                <span className={cn('font-mono font-bold', (overview?.collectionsBreakdown?.partnerFranchise?.pendingCount || 0) > 0 ? 'text-amber-600' : 'text-[#667085]')}>
                  {overview?.collectionsBreakdown?.partnerFranchise?.pendingCount || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#F2F4F7] text-[10.5px] text-[#98A2B3]">
            Franchise licence per regional network
          </div>
        </div>

        {/* Stream 5: Queue Holds & Escrow */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F7]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475467]">
                Escrow & Releases
              </span>
              <Lock className="h-3.5 w-3.5 text-[#667085]" />
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Active Queue Holds:</span>
                <span className="font-mono font-bold text-blue-700">
                  {formatCurrency(overview?.escrowLifecycle?.activeReservedInQueue || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Holds Released (No Slot):</span>
                <span className="font-mono font-bold text-[#475467]">
                  {formatCurrency(overview?.escrowLifecycle?.totalReleased || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Total Refunded:</span>
                <span className="font-mono font-bold text-[#667085]">
                  {formatCurrency(overview?.escrowLifecycle?.totalRefunded || 0)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#F2F4F7] text-[10.5px] text-[#98A2B3]">
            Zero charge if e-Pass is unconfirmed
          </div>
        </div>
      </div>

      {/* Main Ledger Management Section */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#E6EAF0] px-4 pt-3 gap-2 bg-[#F8FAFC]">
          <div className="flex items-center gap-1 overflow-x-auto pb-[-1px]">
            {/* Tab: Waiting Approval */}
            <button
              onClick={() => setActiveTab('PENDING')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all',
                activeTab === 'PENDING'
                  ? 'border-[#C98219] text-[#172033] bg-white rounded-t-[6px] shadow-sm'
                  : 'border-transparent text-[#667085] hover:text-[#172033]',
              )}
            >
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Waiting Approval</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10.5px] font-bold',
                  counts.pending > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : 'bg-[#F2F4F7] text-[#667085]',
                )}
              >
                {counts.pending}
              </span>
            </button>

            {/* Tab: Successful Payments */}
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all',
                activeTab === 'COMPLETED'
                  ? 'border-emerald-600 text-[#172033] bg-white rounded-t-[6px] shadow-sm'
                  : 'border-transparent text-[#667085] hover:text-[#172033]',
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Successful Payments</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {counts.completed}
              </span>
            </button>

            {/* Tab: All Transactions */}
            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all',
                activeTab === 'ALL'
                  ? 'border-[#172033] text-[#172033] bg-white rounded-t-[6px] shadow-sm'
                  : 'border-transparent text-[#667085] hover:text-[#172033]',
              )}
            >
              <Receipt className="h-3.5 w-3.5 text-[#475467]" />
              <span>All Transactions</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#F2F4F7] text-[#475467]">
                {counts.all}
              </span>
            </button>

            {/* Tab: Failed / Rejected */}
            <button
              onClick={() => setActiveTab('FAILED')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all',
                activeTab === 'FAILED'
                  ? 'border-red-600 text-[#172033] bg-white rounded-t-[6px] shadow-sm'
                  : 'border-transparent text-[#667085] hover:text-[#172033]',
              )}
            >
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span>Failed / Rejected</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10.5px] font-bold bg-red-50 text-red-800 border border-red-200">
                {counts.failed}
              </span>
            </button>

            {/* Tab: Onboarding Verifications (Partner & Centre) */}
            <button
              onClick={() => setActiveTab('REGISTRATIONS')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all',
                activeTab === 'REGISTRATIONS'
                  ? 'border-blue-600 text-[#172033] bg-white rounded-t-[6px] shadow-sm'
                  : 'border-transparent text-[#667085] hover:text-[#172033]',
              )}
            >
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Onboarding Verifications</span>
              {totalPendingOnboardings > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                  {totalPendingOnboardings}
                </span>
              ) : (
                (approvedPartnersRecent.length + approvedCentresRecent.length > 0) && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#F2F4F7] text-[#667085]">
                    {approvedPartnersRecent.length + approvedCentresRecent.length}
                  </span>
                )
              )}
            </button>

            {/* Tab: Refund Requests */}
            <button
              onClick={() => setActiveTab('REFUNDS')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all',
                activeTab === 'REFUNDS'
                  ? 'border-purple-600 text-[#172033] bg-white rounded-t-[6px] shadow-sm'
                  : 'border-transparent text-[#667085] hover:text-[#172033]',
              )}
            >
              <RotateCcw className="h-3.5 w-3.5 text-purple-600" />
              <span>Refund Requests</span>
              {(overview?.waitingActionItems?.pendingRefundsCount || 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-100 text-purple-900 border border-purple-200 animate-pulse">
                  {overview?.waitingActionItems?.pendingRefundsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters Toolbar for Standard Transactions */}
        {activeTab !== 'REGISTRATIONS' && activeTab !== 'REFUNDS' && (
          <div className="p-4 border-b border-[#E6EAF0] bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A2B3]" />
              <input
                type="text"
                placeholder="Search by UTR, Ref ID, Centre name, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-[7px] border border-[#D0D5DD] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219] focus:border-[#C98219] transition-all"
              />
            </form>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 px-3 rounded-[7px] border border-[#D0D5DD] bg-white text-xs font-medium text-[#344054] focus:outline-none focus:ring-1 focus:ring-[#C98219]"
              >
                <option value="ALL">All Categories</option>
                <option value="TOPUP">Wallet Top-Ups</option>
                <option value="CAPTURE">Service Captures (₹100)</option>
                <option value="RESERVE">Queue Holds (₹100)</option>
                <option value="RELEASE">Queue Releases</option>
                <option value="REFUND">Refunds</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 px-3 rounded-[7px] border border-[#D0D5DD] bg-white text-xs font-medium text-[#344054] focus:outline-none focus:ring-1 focus:ring-[#C98219]"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="7DAYS">Last 7 Days</option>
                <option value="MONTH">This Month</option>
              </select>

              {(searchQuery || typeFilter !== 'ALL' || dateFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('ALL');
                    setDateFilter('ALL');
                  }}
                  className="h-9 px-2.5 text-xs text-red-600 hover:text-red-800 font-semibold transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filters Toolbar for Refunds Tab */}
        {activeTab === 'REFUNDS' && (
          <div className="p-4 border-b border-[#E6EAF0] bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#667085]">Filter Status:</span>
              <div className="inline-flex rounded-[7px] border border-[#D0D5DD] p-0.5 bg-[#F8FAFC]">
                {(['ALL', 'REQUESTED', 'PROCESSED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setRefundStatusFilter(st)}
                    className={cn(
                      'px-3 py-1 rounded-[5px] text-xs font-semibold transition-all',
                      refundStatusFilter === st
                        ? 'bg-white text-[#172033] shadow-xs'
                        : 'text-[#667085] hover:text-[#172033]',
                    )}
                  >
                    {st === 'ALL'
                      ? 'All Requests'
                      : st === 'REQUESTED'
                      ? 'Waiting Settlement'
                      : st === 'PROCESSED'
                      ? 'Settled'
                      : 'Rejected'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-[#667085]">
              Showing <span className="font-semibold text-[#172033]">{refunds.length}</span> refund request(s)
            </div>
          </div>
        )}

        {/* Content View: Standard Transactions vs Onboarding Verifications */}
        {activeTab === 'REGISTRATIONS' ? (
          /* ONBOARDING VERIFICATIONS TAB: Partner Franchise & Centre Onboarding */
          <div className="space-y-0">
            {/* Sub-Tabs & Search Toolbar */}
            <div className="p-4 border-b border-[#E6EAF0] bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setOnboardingSubTab('ALL')}
                  className={cn(
                    'px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all flex items-center gap-1.5',
                    onboardingSubTab === 'ALL'
                      ? 'bg-[#172033] text-white shadow-xs'
                      : 'bg-[#F2F4F7] text-[#475467] hover:bg-[#E4E7EC]',
                  )}
                >
                  <span>All Onboardings</span>
                  {totalPendingOnboardings > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-[#172033]">
                      {totalPendingOnboardings}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setOnboardingSubTab('PARTNERS')}
                  className={cn(
                    'px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all flex items-center gap-1.5',
                    onboardingSubTab === 'PARTNERS'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100',
                  )}
                >
                  <Building2 className="h-3 w-3 text-amber-600" />
                  <span>Partner Franchise (₹599)</span>
                  {pendingPartnersList.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      {pendingPartnersList.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setOnboardingSubTab('CENTRES')}
                  className={cn(
                    'px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all flex items-center gap-1.5',
                    onboardingSubTab === 'CENTRES'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100',
                  )}
                >
                  <Building2 className="h-3 w-3 text-blue-600" />
                  <span>Centre Registration (₹249)</span>
                  {pendingCentresList.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                      {pendingCentresList.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setOnboardingSubTab('HISTORY')}
                  className={cn(
                    'px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all flex items-center gap-1.5',
                    onboardingSubTab === 'HISTORY'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100',
                  )}
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>Verified History</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                    {approvedPartnersRecent.length + approvedCentresRecent.length}
                  </span>
                </button>
              </div>

              {/* Search Filter Input */}
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#98A2B3]" />
                <input
                  type="text"
                  placeholder="Search partner, centre, UTR, phone..."
                  value={onboardingSearch}
                  onChange={(e) => setOnboardingSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-[6px] border border-[#D0D5DD] bg-white focus:outline-none focus:ring-1 focus:ring-[#C98219]"
                />
                {onboardingSearch && (
                  <button
                    onClick={() => setOnboardingSearch('')}
                    className="absolute right-2.5 top-2 text-[#98A2B3] hover:text-[#172033]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List / Table Content */}
            <div className="overflow-x-auto">
              {onboardingSubTab === 'HISTORY' ? (
                /* HISTORY SUB-TAB */
                (approvedPartnersRecent.length === 0 && approvedCentresRecent.length === 0) ? (
                  <div className="py-16 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                    <h3 className="text-sm font-bold text-[#172033]">No Recent Approvals</h3>
                    <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
                      Activated partners and centres will appear here once their onboarding fee is verified.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E6EAF0] bg-[#F8FAFC] text-[#667085] uppercase tracking-wider text-[10.5px]">
                        <th className="py-3 px-4 font-semibold">Activated Date</th>
                        <th className="py-3 px-4 font-semibold">Entity Type</th>
                        <th className="py-3 px-4 font-semibold">Name & Code</th>
                        <th className="py-3 px-4 font-semibold">Jurisdiction</th>
                        <th className="py-3 px-4 font-semibold">Contact</th>
                        <th className="py-3 px-4 font-semibold">Fee Paid</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EAF0]">
                      {approvedPartnersRecent.map((partner: any) => (
                        <tr key={partner.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3 px-4 font-mono text-[#475467] whitespace-nowrap">
                            <div>{partner.updatedAt ? formatDate(partner.updatedAt) : 'Active'}</div>
                            <div className="text-[10px] text-[#98A2B3]">{partner.updatedAt ? formatTime(partner.updatedAt) : ''}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              <Building2 className="h-3 w-3 text-amber-600" />
                              Partner Franchise
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#172033]">{partner.partnerName}</div>
                            <div className="text-[11px] font-mono text-amber-800 font-semibold">{partner.partnerCode}</div>
                          </td>
                          <td className="py-3 px-4 text-[#475467]">
                            {partner.district ? `${partner.district}${partner.taluk ? ` / ${partner.taluk}` : ''}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-[#475467]">
                            <div className="text-[11px] font-mono">{partner.user?.mobile || '—'}</div>
                            <div className="text-[10.5px] text-[#667085]">{partner.user?.email || '—'}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                            {formatCurrency(partner.franchiseFee || 599)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Active & Fee Paid
                            </span>
                          </td>
                        </tr>
                      ))}

                      {approvedCentresRecent.map((centre: any) => (
                        <tr key={centre.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3 px-4 font-mono text-[#475467] whitespace-nowrap">
                            <div>{centre.updatedAt ? formatDate(centre.updatedAt) : 'Active'}</div>
                            <div className="text-[10px] text-[#98A2B3]">{centre.updatedAt ? formatTime(centre.updatedAt) : ''}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                              <Building2 className="h-3 w-3 text-blue-600" />
                              Centre CSC
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#172033]">{centre.centreName}</div>
                            <div className="text-[11px] font-mono text-blue-800 font-semibold">{centre.centreCode}</div>
                          </td>
                          <td className="py-3 px-4 text-[#475467]">
                            {centre.district ? `${centre.district}${centre.taluk ? ` / ${centre.taluk}` : ''}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-[#475467]">
                            <div className="text-[11px] font-mono">{centre.user?.mobile || '—'}</div>
                            <div className="text-[10.5px] text-[#667085]">{centre.user?.email || '—'}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                            {formatCurrency(centre.registrationFee || 249)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Active & Fee Paid
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                /* PENDING ONBOARDING ROWS (PARTNERS & CENTRES) */
                (() => {
                  const showPartners = onboardingSubTab === 'ALL' || onboardingSubTab === 'PARTNERS';
                  const showCentres = onboardingSubTab === 'ALL' || onboardingSubTab === 'CENTRES';

                  const displayedPartners = showPartners
                    ? pendingPartnersList.filter((p: any) => {
                        if (!onboardingSearch.trim()) return true;
                        const s = onboardingSearch.toLowerCase();
                        return (
                          p.partnerName?.toLowerCase().includes(s) ||
                          p.partnerCode?.toLowerCase().includes(s) ||
                          p.district?.toLowerCase().includes(s) ||
                          p.taluk?.toLowerCase().includes(s) ||
                          p.paymentReference?.toLowerCase().includes(s) ||
                          p.user?.email?.toLowerCase().includes(s) ||
                          p.user?.mobile?.toLowerCase().includes(s)
                        );
                      })
                    : [];

                  const displayedCentres = showCentres
                    ? pendingCentresList.filter((c: any) => {
                        if (!onboardingSearch.trim()) return true;
                        const s = onboardingSearch.toLowerCase();
                        return (
                          c.centreName?.toLowerCase().includes(s) ||
                          c.centreCode?.toLowerCase().includes(s) ||
                          c.district?.toLowerCase().includes(s) ||
                          c.taluk?.toLowerCase().includes(s) ||
                          c.feeTransactionId?.toLowerCase().includes(s) ||
                          c.user?.name?.toLowerCase().includes(s) ||
                          c.user?.mobile?.toLowerCase().includes(s)
                        );
                      })
                    : [];

                  const hasAny = displayedPartners.length > 0 || displayedCentres.length > 0;

                  if (!hasAny) {
                    return (
                      <div className="py-16 text-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                        <h3 className="text-sm font-bold text-[#172033]">All Onboarding Payments Verified</h3>
                        <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
                          {onboardingSearch
                            ? 'No onboarding submissions match your search query.'
                            : 'There are currently no partner franchise or centre registrations awaiting payment verification. All registered accounts are active.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-[#E6EAF0] bg-[#F8FAFC] text-[#667085] uppercase tracking-wider text-[10.5px]">
                          <th className="py-3 px-4 font-semibold">Onboard Type</th>
                          <th className="py-3 px-4 font-semibold">Submitted At</th>
                          <th className="py-3 px-4 font-semibold">Applicant & Entity</th>
                          <th className="py-3 px-4 font-semibold">Jurisdiction</th>
                          <th className="py-3 px-4 font-semibold">Contact Info</th>
                          <th className="py-3 px-4 font-semibold">Fee Amount</th>
                          <th className="py-3 px-4 font-semibold">UTR / Reference</th>
                          <th className="py-3 px-4 font-semibold text-center">Payment Proof</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6EAF0]">
                        {/* PARTNER FRANCHISE ROWS */}
                        {displayedPartners.map((partner: any) => (
                          <tr key={`partner-${partner.id}`} className="hover:bg-amber-50/30 transition-colors bg-white">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                <Building2 className="h-3 w-3 text-amber-700" />
                                <span>Partner Franchise</span>
                              </span>
                              <div className="text-[11px] font-mono text-[#8F5A0D] font-bold mt-1">
                                {partner.partnerCode}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-[#475467] font-mono whitespace-nowrap">
                              <div>{formatDate(partner.createdAt)}</div>
                              <div className="text-[10px] text-[#98A2B3]">{formatTime(partner.createdAt)}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#172033] text-[13px]">{partner.partnerName}</div>
                              <div className="text-[10.5px] text-amber-800 font-semibold mt-0.5">Franchise Applicant</div>
                            </td>

                            <td className="py-3.5 px-4 text-[#475467]">
                              <div className="font-medium text-[#172033]">
                                {partner.district ? `${partner.district}${partner.taluk ? ` / ${partner.taluk}` : ''}` : '—'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-[#475467]">
                              <div className="font-mono text-[#172033] font-semibold">{partner.user?.mobile || '—'}</div>
                              <div className="text-[11px] text-[#667085]">{partner.user?.email || '—'}</div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-amber-900 text-sm whitespace-nowrap">
                              <div className="bg-amber-50 border border-amber-200 px-2 py-1 rounded text-center">
                                {formatCurrency(partner.franchiseFee || 599)}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-semibold text-[#172033]">
                              {partner.paymentReference ? (
                                <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2 py-1 rounded border border-[#E6EAF0]">
                                  <span className="truncate max-w-[140px]" title={partner.paymentReference}>
                                    {partner.paymentReference}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(partner.paymentReference, 'Reference / UTR')}
                                    title="Copy Reference"
                                    className="text-[#98A2B3] hover:text-[#172033]"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[#98A2B3] italic">No Reference</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {partner.paymentProofUrl ? (
                                <div className="flex items-center justify-center gap-2">
                                  <img
                                    src={partner.paymentProofUrl}
                                    alt="Proof thumbnail"
                                    className="h-9 w-9 rounded object-cover border border-amber-200 shadow-2xs"
                                  />
                                  <button
                                    onClick={() =>
                                      setSelectedProof({
                                        targetId: partner.id,
                                        title: `Partner Franchise Payment Proof - ${partner.partnerName}`,
                                        amount: Number(partner.franchiseFee || 599),
                                        reference: partner.paymentReference,
                                        receiptUrl: partner.paymentProofUrl,
                                        partnerName: partner.partnerName,
                                        contact: `${partner.user?.email || ''} | ${partner.user?.mobile || ''}`,
                                        jurisdiction: `${partner.district || ''} ${partner.taluk ? `/ ${partner.taluk}` : ''}`,
                                        date: partner.createdAt,
                                        type: 'PARTNER_FEE',
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-amber-700" />
                                    <span>Proof</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#98A2B3] italic">No Receipt Uploaded</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() =>
                                    setRejectingTarget({
                                      id: partner.id,
                                      type: 'PARTNER_FEE',
                                      title: `Partner ${partner.partnerName} (${partner.partnerCode})`,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-[6px] border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleApprovePartnerFee(partner.id)}
                                  disabled={processingAction === partner.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>{processingAction === partner.id ? 'Activating...' : 'Verify & Approve'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {/* CENTRE REGISTRATION ROWS */}
                        {displayedCentres.map((centre: any) => (
                          <tr key={`centre-${centre.id}`} className="hover:bg-blue-50/30 transition-colors bg-white">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs">
                                <Building2 className="h-3 w-3 text-blue-700" />
                                <span>Centre CSC</span>
                              </span>
                              <div className="text-[11px] font-mono text-blue-900 font-bold mt-1">
                                {centre.centreCode}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-[#475467] font-mono whitespace-nowrap">
                              <div>{formatDate(centre.createdAt)}</div>
                              <div className="text-[10px] text-[#98A2B3]">{formatTime(centre.createdAt)}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#172033] text-[13px]">{centre.centreName}</div>
                              <div className="text-[10.5px] text-[#667085] mt-0.5">Operator: {centre.user?.name || '—'}</div>
                            </td>

                            <td className="py-3.5 px-4 text-[#475467]">
                              <div className="font-medium text-[#172033]">
                                {centre.district ? `${centre.district}${centre.taluk ? ` / ${centre.taluk}` : ''}` : '—'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-[#475467]">
                              <div className="font-mono text-[#172033] font-semibold">{centre.user?.mobile || '—'}</div>
                              <div className="text-[11px] text-[#667085]">{centre.user?.email || '—'}</div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-blue-900 text-sm whitespace-nowrap">
                              <div className="bg-blue-50 border border-blue-200 px-2 py-1 rounded text-center">
                                {formatCurrency(centre.registrationFee || 249)}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-semibold text-[#172033]">
                              {centre.feeTransactionId ? (
                                <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2 py-1 rounded border border-[#E6EAF0]">
                                  <span className="truncate max-w-[140px]" title={centre.feeTransactionId}>
                                    {centre.feeTransactionId}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(centre.feeTransactionId, 'Reference')}
                                    title="Copy Reference"
                                    className="text-[#98A2B3] hover:text-[#172033]"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[#98A2B3] italic">No UTR Entered</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {centre.paymentProofUrl ? (
                                <div className="flex items-center justify-center gap-2">
                                  <img
                                    src={centre.paymentProofUrl}
                                    alt="Proof thumbnail"
                                    className="h-9 w-9 rounded object-cover border border-blue-200 shadow-2xs"
                                  />
                                  <button
                                    onClick={() =>
                                      setSelectedProof({
                                        targetId: centre.id,
                                        title: `Centre Registration Fee Proof - ${centre.centreName}`,
                                        amount: Number(centre.registrationFee || 249),
                                        reference: centre.feeTransactionId,
                                        receiptUrl: centre.paymentProofUrl,
                                        centreName: centre.centreName,
                                        contact: `${centre.user?.name || ''} | ${centre.user?.mobile || ''}`,
                                        jurisdiction: `${centre.district || ''} ${centre.taluk ? `/ ${centre.taluk}` : ''}`,
                                        date: centre.createdAt,
                                        type: 'CENTRE_FEE',
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Proof</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#98A2B3] italic">No Receipt Uploaded</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() =>
                                    setRejectingTarget({
                                      id: centre.id,
                                      type: 'CENTRE_FEE',
                                      title: `Centre ${centre.centreName} (${centre.centreCode})`,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-[6px] border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleApproveCentreFee(centre.id)}
                                  disabled={processingAction === centre.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>{processingAction === centre.id ? 'Activating...' : 'Verify & Approve'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()
              )}
            </div>
          </div>
        ) : activeTab === 'REFUNDS' ? (
          /* REFUNDS TAB: Wallet Balance Payout Requests */
          <div className="overflow-x-auto">
            {loadingRefunds ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                <p className="text-xs text-[#667085]">Loading refund requests...</p>
              </div>
            ) : refunds.length === 0 ? (
              <div className="py-16 text-center">
                <RotateCcw className="h-10 w-10 text-purple-400 mx-auto mb-2 opacity-50" />
                <h3 className="text-sm font-bold text-[#172033]">No Refund Requests Found</h3>
                <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
                  {refundStatusFilter === 'REQUESTED'
                    ? 'No refund payouts currently awaiting admin settlement.'
                    : 'No refund requests match the selected status filter.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E6EAF0] bg-[#F8FAFC] text-[#667085] uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-4 font-semibold">Requested At</th>
                    <th className="py-3 px-4 font-semibold">Centre / Operator</th>
                    <th className="py-3 px-4 font-semibold">Refund Amount</th>
                    <th className="py-3 px-4 font-semibold">Target UPI ID</th>
                    <th className="py-3 px-4 font-semibold">Reason</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Settlement / Proof</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EAF0]">
                  {refunds.map((refund) => {
                    const isRequested = refund.status === 'REQUESTED' || refund.status === 'UNDER_REVIEW';
                    const isProcessed = refund.status === 'PROCESSED';
                    const isRejected = refund.status === 'REJECTED';

                    return (
                      <tr key={refund.id} className="hover:bg-[#F9FAFB] transition-colors">
                        {/* Requested At */}
                        <td className="py-3.5 px-4 font-mono text-[#475467] whitespace-nowrap">
                          <div>{formatDate(refund.createdAt)}</div>
                          <div className="text-[10px] text-[#98A2B3]">{formatTime(refund.createdAt)}</div>
                        </td>

                        {/* Centre / Operator */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#172033]">
                              {refund.user?.centre?.centreName || refund.user?.name || 'Operator'}
                            </span>
                            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded font-medium">
                              Max 4/mo
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-[#667085] flex items-center gap-1.5 mt-0.5">
                            <span>{refund.user?.mobile || '—'}</span>
                            {refund.user?.centre?.district && (
                              <span className="text-[#98A2B3]">({refund.user.centre.district})</span>
                            )}
                          </div>
                        </td>

                        {/* Refund Amount */}
                        <td className="py-3.5 px-4 font-mono font-bold text-sm text-purple-700">
                          {formatCurrency(refund.amount)}
                        </td>

                        {/* Target UPI ID */}
                        <td className="py-3.5 px-4">
                          {refund.upiId ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono font-bold text-xs">
                              <span>{refund.upiId}</span>
                              <button
                                onClick={() => copyToClipboard(refund.upiId!, 'UPI ID')}
                                title="Copy Target UPI ID"
                                className="text-emerald-700 hover:text-emerald-950 p-0.5 rounded hover:bg-emerald-100 transition-colors"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#98A2B3] italic text-xs">Not specified</span>
                          )}
                        </td>

                        {/* Reason */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div className="text-xs text-[#344054] truncate" title={refund.reason}>
                            {refund.reason || 'Wallet balance payout'}
                          </div>
                          {refund.adminNotes && (
                            <div className="text-[10.5px] text-[#667085] italic truncate" title={`Admin Notes: ${refund.adminNotes}`}>
                              Admin: {refund.adminNotes}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isRequested && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Awaiting Settlement
                            </span>
                          )}
                          {isProcessed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Settled & Transferred
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-800 border border-red-200">
                              <XCircle className="h-3 w-3 text-red-600" />
                              Rejected
                            </span>
                          )}
                        </td>

                        {/* Settlement Proof / UTR */}
                        <td className="py-3.5 px-4">
                          {isProcessed ? (
                            <div className="space-y-1">
                              <div className="font-mono text-[11px] font-semibold text-[#172033] flex items-center gap-1">
                                <span>{refund.reference || 'N/A'}</span>
                                {refund.reference && (
                                  <button
                                    onClick={() => copyToClipboard(refund.reference!, 'UTR')}
                                    className="text-[#98A2B3] hover:text-[#172033]"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              {refund.proofUrl && (
                                <button
                                  onClick={() => setViewingRefundProof(refund)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>View Proof Receipt</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#98A2B3] italic text-xs">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isRequested ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setRejectingRefund(refund);
                                  setRejectRefundNotes('');
                                }}
                                className="px-2.5 py-1.5 rounded-[6px] border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleOpenSettleRefund(refund)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Settle & Approve</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#98A2B3]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* STANDARD TRANSACTIONS TABLE */
          <div className="overflow-x-auto">
            {activeTab === 'PENDING' && totalPendingOnboardings > 0 && (
              <div className="m-4 p-3 bg-amber-50/90 border border-amber-200 rounded-[8px] flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-amber-700" />
                  </div>
                  <span className="text-xs text-amber-950 font-medium">
                    You have <strong className="text-amber-900 font-bold">{totalPendingOnboardings}</strong> onboarding fee verification(s) waiting for approval ({pendingPartnersList.length} Partner franchise, {pendingCentresList.length} Centre registration).
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('REGISTRATIONS')}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-[6px] transition-colors shadow-xs"
                >
                  Review Onboardings →
                </button>
              </div>
            )}
            {loadingTx ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C98219] border-t-transparent" />
                <p className="text-xs text-[#667085]">Loading financial ledger records...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-16 text-center">
                <Receipt className="h-10 w-10 text-[#98A2B3] mx-auto mb-2 opacity-50" />
                <h3 className="text-sm font-bold text-[#172033]">No Transactions Found</h3>
                <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
                  {activeTab === 'PENDING'
                    ? 'No pending payments are currently waiting for approval. All requests have been processed.'
                    : 'No transactions match the selected filters.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E6EAF0] bg-[#F8FAFC] text-[#667085] uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Reference / UTR</th>
                    <th className="py-3 px-4 font-semibold">Centre / User</th>
                    <th className="py-3 px-4 font-semibold">Financial Stream</th>
                    <th className="py-3 px-4 font-semibold">Channel</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-center">Proof / Receipt</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EAF0]">
                  {transactions.map((tx) => {
                    const isPending = tx.status === 'PENDING';
                    const isCompleted = tx.status === 'COMPLETED';
                    const isFailed = tx.status === 'FAILED';
                    const isTopup = tx.type === 'TOPUP';
                    const hasReceipt = !!tx.metadata?.receiptUrl;

                    return (
                      <tr key={tx.id} className="hover:bg-[#F9FAFB] transition-colors">
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 font-mono text-[#475467] whitespace-nowrap">
                          <div>{formatDate(tx.createdAt)}</div>
                          <div className="text-[10px] text-[#98A2B3]">{formatTime(tx.createdAt)}</div>
                        </td>

                        {/* Reference / UTR */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5 font-bold text-[#172033]">
                            <span>{tx.reference || `TX-${tx.id.slice(0, 8)}`}</span>
                            {tx.reference && (
                              <button
                                onClick={() => copyToClipboard(tx.reference!, 'UTR Reference')}
                                title="Copy UTR"
                                className="text-[#98A2B3] hover:text-[#172033]"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          {tx.booking && (
                            <div className="text-[10px] text-[#C98219] font-medium mt-0.5">
                              Booking: {tx.booking.bookingCode}
                            </div>
                          )}
                        </td>

                        {/* Centre / User */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#172033]">
                            {tx.user?.centre?.centreName || tx.user?.name || 'Platform User'}
                          </div>
                          <div className="text-[11px] text-[#667085] flex items-center gap-1.5 font-mono">
                            {tx.user?.centre?.centreCode && (
                              <span className="font-semibold text-[#C98219]">{tx.user.centre.centreCode}</span>
                            )}
                            <span>{tx.user?.mobile}</span>
                          </div>
                        </td>

                        {/* Financial Stream */}
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold',
                              tx.type === 'TOPUP' && 'bg-blue-50 text-blue-800 border border-blue-200',
                              tx.type === 'CAPTURE' && 'bg-emerald-50 text-emerald-800 border border-emerald-200',
                              tx.type === 'RESERVE' && 'bg-amber-50 text-amber-800 border border-amber-200',
                              tx.type === 'RELEASE' && 'bg-neutral-100 text-neutral-700 border border-neutral-300',
                              tx.type === 'REFUND' && 'bg-purple-50 text-purple-800 border border-purple-200',
                            )}
                          >
                            {tx.type === 'TOPUP' && <Wallet className="h-3 w-3" />}
                            {tx.type === 'CAPTURE' && <CheckCircle2 className="h-3 w-3" />}
                            {tx.type === 'RESERVE' && <Lock className="h-3 w-3" />}
                            {tx.type === 'RELEASE' && <ArrowDownLeft className="h-3 w-3" />}
                            {tx.type}
                          </span>
                        </td>

                        {/* Payment Channel */}
                        <td className="py-3.5 px-4 text-[#475467] font-medium">
                          {tx.metadata?.paymentMethod === 'OFFLINE_QR' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#344054]">
                              <CreditCard className="h-3 w-3 text-[#667085]" />
                              UPI QR Transfer
                            </span>
                          ) : tx.metadata?.paymentMethod === 'ONLINE' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-blue-700">
                              <CreditCard className="h-3 w-3 text-blue-600" />
                              Online Gateway
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#667085]">
                              {tx.metadata?.paymentMethod || 'Wallet Escrow'}
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-mono font-bold text-sm">
                          <span
                            className={cn(
                              tx.type === 'TOPUP' && 'text-emerald-700',
                              tx.type === 'CAPTURE' && 'text-[#172033]',
                              tx.type === 'RESERVE' && 'text-amber-800',
                              tx.type === 'RELEASE' && 'text-[#667085]',
                            )}
                          >
                            {tx.type === 'TOPUP' ? '+' : ''}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Awaiting Approval
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Settled
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-800 border border-red-200">
                              <XCircle className="h-3 w-3 text-red-600" />
                              Rejected
                            </span>
                          )}
                        </td>

                        {/* Proof / Receipt */}
                        <td className="py-3.5 px-4 text-center">
                          {hasReceipt ? (
                            <button
                              onClick={() =>
                                setSelectedProof({
                                  txId: tx.id,
                                  targetId: tx.id,
                                  title: 'Wallet Top-Up Payment Proof',
                                  amount: Number(tx.amount),
                                  reference: tx.reference,
                                  receiptUrl: tx.metadata.receiptUrl,
                                  fileName: tx.metadata.receiptFileName,
                                  centreName: tx.user?.centre?.centreName || tx.user?.name,
                                  date: tx.createdAt,
                                  type: 'TOPUP',
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#FDF7ED] text-[#8F5A0D] border border-[#F9DE9B] text-xs font-semibold hover:bg-[#FBEED7] transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5 text-[#C98219]" />
                              <span>View Receipt</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#98A2B3] italic">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && isTopup ? (
                              <>
                                <button
                                  onClick={() => handleApproveTopup(tx.id)}
                                  disabled={processingAction === tx.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                                  title="Approve & Credit Wallet"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setRejectingTarget({
                                      type: 'TOPUP',
                                      id: tx.id,
                                      title: `Top-up ${tx.reference || tx.id}`,
                                    })
                                  }
                                  disabled={processingAction === tx.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-all disabled:opacity-50"
                                  title="Reject Top-up Payment"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setSelectedTxDetail(tx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#E6EAF0] bg-white text-[#475467] hover:text-[#172033] hover:bg-[#F8FAFC] text-xs font-medium transition-all"
                              >
                                <span>Details</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination Toolbar */}
        {activeTab !== 'REGISTRATIONS' && activeTab !== 'REFUNDS' && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-between">
            <span className="text-xs text-[#667085]">
              Showing <span className="font-semibold text-[#172033]">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-semibold text-[#172033]">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-[#172033]">{pagination.total}</span> entries
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => loadTransactions(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E6EAF0] bg-white text-[#475467] hover:bg-[#F2F4F7] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-xs font-semibold text-[#172033]">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => loadTransactions(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E6EAF0] bg-white text-[#475467] hover:bg-[#F2F4F7] disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Receipt / Payment Proof Preview Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-elevated max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">{selectedProof.title}</h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  {selectedProof.type === 'PARTNER_FEE' ? (
                    <>
                      Partner: <span className="font-semibold text-[#172033]">{selectedProof.partnerName}</span>{' '}
                      {selectedProof.contact && <span className="text-[#667085]">({selectedProof.contact})</span>}
                    </>
                  ) : (
                    <>
                      Centre: <span className="font-semibold text-[#172033]">{selectedProof.centreName}</span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="p-1 rounded text-[#98A2B3] hover:text-[#172033]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Proof Details summary */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8FAFC] p-3 rounded-lg border border-[#E6EAF0]">
                <div>
                  <span className="text-[#667085]">Claimed Amount:</span>
                  <p className="font-mono font-bold text-emerald-800 text-sm">
                    {formatCurrency(selectedProof.amount)}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">UTR / Reference:</span>
                  <p className="font-mono font-bold text-[#172033]">
                    {selectedProof.reference || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Submission Date:</span>
                  <p className="text-[#475467]">
                    {formatDate(selectedProof.date)} {formatTime(selectedProof.date)}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">
                    {selectedProof.type === 'PARTNER_FEE' ? 'Jurisdiction:' : 'Receipt Filename:'}
                  </span>
                  <p className="text-[#475467] truncate" title={selectedProof.jurisdiction || selectedProof.fileName}>
                    {selectedProof.jurisdiction || selectedProof.fileName || 'Payment Receipt Proof'}
                  </p>
                </div>
              </div>

              {/* Receipt Image Display */}
              <div className="border border-[#E6EAF0] rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center min-h-[220px] max-h-[420px]">
                {selectedProof.receiptUrl ? (
                  <img
                    src={selectedProof.receiptUrl}
                    alt="Payment receipt proof"
                    className="max-h-[400px] w-auto object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-xs text-[#667085]">
                    <FileText className="h-8 w-8 text-[#98A2B3] mx-auto mb-2" />
                    No image file attached
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedProof(null)}
                className="px-3.5 py-2 rounded-[7px] border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7]"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedProof.type === 'TOPUP' && selectedProof.txId && (
                  <>
                    <button
                      onClick={() => {
                        setRejectingTarget({
                          id: selectedProof.txId!,
                          type: 'TOPUP',
                          title: `Top-up ${selectedProof.reference || ''}`,
                        });
                      }}
                      className="px-3 py-2 rounded-[7px] border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveTopup(selectedProof.txId!)}
                      disabled={processingAction === selectedProof.txId}
                      className="px-4 py-2 rounded-[7px] bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{processingAction === selectedProof.txId ? 'Processing...' : 'Approve & Credit Wallet'}</span>
                    </button>
                  </>
                )}

                {selectedProof.type === 'CENTRE_FEE' && (
                  <>
                    <button
                      onClick={() => {
                        setRejectingTarget({
                          id: selectedProof.targetId,
                          type: 'CENTRE_FEE',
                          title: `Centre ${selectedProof.centreName || ''}`,
                        });
                      }}
                      className="px-3 py-2 rounded-[7px] border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveCentreFee(selectedProof.targetId)}
                      disabled={processingAction === selectedProof.targetId}
                      className="px-4 py-2 rounded-[7px] bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{processingAction === selectedProof.targetId ? 'Activating...' : 'Verify Fee & Activate Centre'}</span>
                    </button>
                  </>
                )}

                {selectedProof.type === 'PARTNER_FEE' && (
                  <>
                    <button
                      onClick={() => {
                        setRejectingTarget({
                          id: selectedProof.targetId,
                          type: 'PARTNER_FEE',
                          title: `Partner ${selectedProof.partnerName || ''} (${selectedProof.reference || ''})`,
                        });
                      }}
                      className="px-3 py-2 rounded-[7px] border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={() => handleApprovePartnerFee(selectedProof.targetId)}
                      disabled={processingAction === selectedProof.targetId}
                      className="px-4 py-2 rounded-[7px] bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{processingAction === selectedProof.targetId ? 'Activating...' : 'Verify Fee & Activate Partner'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Unified Reject Reason Modal */}
      {rejectingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-elevated max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-[#E6EAF0] bg-red-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h3 className="text-sm font-bold text-red-900">
                  {rejectingTarget.type === 'PARTNER_FEE'
                    ? 'Reject Partner Franchise Payment'
                    : rejectingTarget.type === 'CENTRE_FEE'
                    ? 'Reject Centre Registration Payment'
                    : 'Reject Top-up Payment'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setRejectingTarget(null);
                  setRejectReason('');
                }}
                className="p-1 rounded text-[#98A2B3] hover:text-[#172033]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-[#475467] leading-relaxed">
                Are you sure you want to reject this payment for{' '}
                <span className="font-semibold text-red-700">{rejectingTarget.title}</span>?
                {rejectingTarget.type === 'PARTNER_FEE'
                  ? ' The partner status will be set to DISABLED.'
                  : rejectingTarget.type === 'CENTRE_FEE'
                  ? ' The centre status will be set to SUSPENDED.'
                  : ' No balance will be credited to the centre wallet.'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Rejection Reason (Optional):
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. UTR reference not reflected in bank account, invalid receipt screenshot, incorrect amount..."
                  className="w-full text-xs p-2.5 rounded-[7px] border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingTarget(null);
                  setRejectReason('');
                }}
                className="px-3.5 py-2 rounded-[7px] border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processingAction === rejectingTarget.id}
                className="px-4 py-2 rounded-[7px] bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-sm disabled:opacity-50"
              >
                {processingAction === rejectingTarget.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Transaction Detail Drawer */}
      {selectedTxDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-elevated max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">Transaction Audit Breakdown</h3>
                <p className="text-[11px] font-mono text-[#667085] mt-0.5">{selectedTxDetail.id}</p>
              </div>
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="p-1 rounded text-[#98A2B3] hover:text-[#172033]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3 rounded-lg border border-[#E6EAF0]">
                <div>
                  <span className="text-[#667085]">Stream Type:</span>
                  <p className="font-bold text-[#172033] mt-0.5">{selectedTxDetail.type}</p>
                </div>
                <div>
                  <span className="text-[#667085]">Amount:</span>
                  <p className="font-mono font-bold text-sm text-[#172033] mt-0.5">
                    {formatCurrency(selectedTxDetail.amount)}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Status:</span>
                  <p className="font-bold mt-0.5">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px]',
                        selectedTxDetail.status === 'COMPLETED' && 'bg-emerald-100 text-emerald-800',
                        selectedTxDetail.status === 'PENDING' && 'bg-amber-100 text-amber-900',
                        selectedTxDetail.status === 'FAILED' && 'bg-red-100 text-red-900',
                      )}
                    >
                      {selectedTxDetail.status}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Reference / UTR:</span>
                  <p className="font-mono font-bold text-[#172033] mt-0.5">
                    {selectedTxDetail.reference || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Yuktron Share:</span>
                  <p className="font-mono font-semibold text-[#C98219] mt-0.5">
                    {formatCurrency(selectedTxDetail.yuktronShare || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Worker Fleet Share:</span>
                  <p className="font-mono font-semibold text-blue-700 mt-0.5">
                    {formatCurrency(selectedTxDetail.workerShare || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Date & Time:</span>
                  <p className="text-[#475467] mt-0.5">
                    {formatDate(selectedTxDetail.createdAt)} {formatTime(selectedTxDetail.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Channel:</span>
                  <p className="text-[#475467] mt-0.5">
                    {selectedTxDetail.metadata?.paymentMethod || 'Wallet Double-Entry'}
                  </p>
                </div>
              </div>

              {selectedTxDetail.user && (
                <div className="border border-[#E6EAF0] p-3 rounded-lg space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                    Associated Centre & Operator
                  </span>
                  <p className="font-bold text-[#172033]">
                    {selectedTxDetail.user.centre?.centreName || selectedTxDetail.user.name}
                  </p>
                  <p className="font-mono text-[#667085]">
                    Code: {selectedTxDetail.user.centre?.centreCode || 'N/A'} | Mobile: {selectedTxDetail.user.mobile} | District: {selectedTxDetail.user.centre?.district || 'N/A'}
                  </p>
                </div>
              )}

              {selectedTxDetail.metadata && (
                <div className="border border-[#E6EAF0] p-3 rounded-lg space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                    Metadata & Audit Payload
                  </span>
                  <pre className="font-mono text-[10.5px] bg-[#F8FAFC] p-2 rounded overflow-x-auto text-[#475467]">
                    {JSON.stringify(selectedTxDetail.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#E6EAF0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="px-4 py-2 rounded-[7px] border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Refund Settlement Modal */}
      {settlingRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-elevated max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E6EAF0] bg-emerald-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">Settle Refund Payout</h3>
                  <p className="text-[11px] text-emerald-700">Approve payout and upload transfer receipt proof</p>
                </div>
              </div>
              <button
                onClick={() => setSettlingRefund(null)}
                className="p-1 rounded text-[#98A2B3] hover:text-[#172033]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Settlement Summary Card */}
              <div className="bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#667085]">Payable Amount:</span>
                  <span className="font-mono text-base font-bold text-emerald-800">
                    {formatCurrency(settlingRefund.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-[#E6EAF0] pt-2">
                  <span className="text-[#667085]">Target UPI ID:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs bg-white px-2.5 py-1 rounded border border-emerald-300 text-emerald-900">
                    <span>{settlingRefund.upiId || 'N/A'}</span>
                    {settlingRefund.upiId && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settlingRefund.upiId!, 'UPI ID')}
                        className="text-emerald-700 hover:text-emerald-950"
                        title="Copy UPI ID"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#E6EAF0] pt-2 text-[11px]">
                  <span className="text-[#667085]">Beneficiary Centre:</span>
                  <span className="font-semibold text-[#172033]">
                    {settlingRefund.user?.centre?.centreName || settlingRefund.user?.name} ({settlingRefund.user?.mobile})
                  </span>
                </div>
              </div>

              {/* Input: Bank UTR Reference */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Bank Transfer Reference / UTR Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settleReference}
                  onChange={(e) => setSettleReference(e.target.value)}
                  placeholder="e.g. 428719283741 or UPI/428719283741"
                  className="w-full text-xs font-mono p-2.5 rounded-[7px] border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-[10.5px] text-[#667085] mt-1">
                  Enter the 12-digit UTR from your bank or UPI transfer application
                </p>
              </div>

              {/* Input: Proof Receipt Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Settlement Proof Screenshot / Receipt
                </label>
                <div className="border border-dashed border-[#D0D5DD] rounded-lg p-3 bg-[#F8FAFC] text-center">
                  {settleProofUrl ? (
                    <div className="space-y-2">
                      <img
                        src={settleProofUrl}
                        alt="Settlement proof preview"
                        className="max-h-48 mx-auto rounded border border-[#E6EAF0] object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setSettleProofUrl(null)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold"
                      >
                        Remove & Replace Image
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-2">
                      <Upload className="h-6 w-6 text-[#98A2B3] mx-auto mb-1" />
                      <span className="text-xs font-semibold text-emerald-700 hover:underline">
                        Click to upload bank transfer screenshot
                      </span>
                      <p className="text-[10px] text-[#98A2B3] mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Input: Admin Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Admin Settlement Notes (Optional):
                </label>
                <textarea
                  rows={2}
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. Settled via GPay to verified UPI handle"
                  className="w-full text-xs p-2.5 rounded-[7px] border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-end gap-2">
              <button
                onClick={() => setSettlingRefund(null)}
                className="px-3.5 py-2 rounded-[7px] border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSettleRefund}
                disabled={submittingSettlement || !settleReference.trim()}
                className="px-4 py-2 rounded-[7px] bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{submittingSettlement ? 'Settling...' : 'Confirm Settlement & Approve'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Refund Rejection Modal */}
      {rejectingRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-elevated max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-[#E6EAF0] bg-red-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h3 className="text-sm font-bold text-red-900">Reject Refund Request</h3>
              </div>
              <button
                onClick={() => {
                  setRejectingRefund(null);
                  setRejectRefundNotes('');
                }}
                className="p-1 rounded text-[#98A2B3] hover:text-[#172033]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-[#475467] leading-relaxed">
                Are you sure you want to reject this refund request for{' '}
                <span className="font-bold text-[#172033]">{formatCurrency(rejectingRefund.amount)}</span>?
                The centre wallet balance will not be deducted.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Reason for Rejection <span className="text-red-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  value={rejectRefundNotes}
                  onChange={(e) => setRejectRefundNotes(e.target.value)}
                  placeholder="e.g. Invalid UPI ID provided, wallet balance discrepancy, active reserved slots..."
                  className="w-full text-xs p-2.5 rounded-[7px] border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingRefund(null);
                  setRejectRefundNotes('');
                }}
                className="px-3.5 py-2 rounded-[7px] border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRejectRefund}
                disabled={submittingRefundReject || !rejectRefundNotes.trim()}
                className="px-4 py-2 rounded-[7px] bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-sm disabled:opacity-50"
              >
                {submittingRefundReject ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Proof Preview Modal for Settled Refund */}
      {viewingRefundProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-elevated max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">Refund Settlement Proof Receipt</h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Beneficiary:{' '}
                  <span className="font-semibold text-[#172033]">
                    {viewingRefundProof.user?.centre?.centreName || viewingRefundProof.user?.name}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setViewingRefundProof(null)}
                className="p-1 rounded text-[#98A2B3] hover:text-[#172033]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8FAFC] p-3 rounded-lg border border-[#E6EAF0]">
                <div>
                  <span className="text-[#667085]">Settled Amount:</span>
                  <p className="font-mono font-bold text-purple-800 text-sm">
                    {formatCurrency(viewingRefundProof.amount)}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Bank Reference / UTR:</span>
                  <p className="font-mono font-bold text-[#172033]">
                    {viewingRefundProof.reference || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Target UPI ID:</span>
                  <p className="font-mono font-semibold text-emerald-700">
                    {viewingRefundProof.upiId || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Processed Date:</span>
                  <p className="text-[#475467]">
                    {viewingRefundProof.processedAt
                      ? `${formatDate(viewingRefundProof.processedAt)} ${formatTime(viewingRefundProof.processedAt)}`
                      : 'Completed'}
                  </p>
                </div>
                {viewingRefundProof.adminNotes && (
                  <div className="col-span-2 pt-1 border-t border-[#E6EAF0]">
                    <span className="text-[#667085]">Admin Notes:</span>
                    <p className="text-[#344054] italic">{viewingRefundProof.adminNotes}</p>
                  </div>
                )}
              </div>

              <div className="border border-[#E6EAF0] rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center min-h-[220px] max-h-[420px]">
                {viewingRefundProof.proofUrl ? (
                  <img
                    src={viewingRefundProof.proofUrl}
                    alt="Refund settlement receipt proof"
                    className="max-h-[400px] w-auto object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-xs text-[#667085]">
                    <FileText className="h-8 w-8 text-[#98A2B3] mx-auto mb-2" />
                    No image receipt uploaded
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#E6EAF0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setViewingRefundProof(null)}
                className="px-4 py-2 rounded-[7px] border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
