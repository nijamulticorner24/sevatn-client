'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  Wallet,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Copy,
  Check,
  Calendar,
  Ticket,
} from 'lucide-react';

interface WalletTx {
  id: string;
  type: string;
  amount: string | number;
  status: string;
  reference?: string | null;
  metadata?: any;
  createdAt: string;
  booking?: {
    bookingCode: string;
    route: string;
    requestedDate: string;
  } | null;
}

export default function DistributorWalletHistoryPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | '7D' | '30D'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Clipboard copy state
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const user = api.getUser();
    if (user && user.role !== 'DISTRIBUTOR' && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard/wallet');
      return;
    }
    loadData(1);
  }, []);

  const loadData = async (targetPage = page) => {
    try {
      setRefreshing(true);
      const [wData, tData] = await Promise.all([
        api.getWallet().catch(() => null),
        api.getTransactions(targetPage, 50, selectedType !== 'ALL' ? selectedType : undefined, search).catch(() => ({
          transactions: [],
          total: 0,
          totalPages: 1,
        })),
      ]);

      if (wData) setWallet(wData);
      if (tData) {
        setTransactions(tData.transactions || []);
        setTotalPages(tData.totalPages || 1);
        setTotalCount(tData.total || 0);
        setPage(targetPage);
      }
    } catch (err) {
      console.error('Failed to load wallet transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Client-side filtering for status and date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Status filter
      if (selectedStatus !== 'ALL' && tx.status !== selectedStatus) {
        return false;
      }

      // Date range filter
      if (timeFilter !== 'ALL') {
        const txDate = new Date(tx.createdAt).getTime();
        const now = Date.now();
        if (timeFilter === 'TODAY') {
          const startOfDay = new Date().setHours(0, 0, 0, 0);
          if (txDate < startOfDay) return false;
        } else if (timeFilter === '7D') {
          if (now - txDate > 7 * 24 * 3600 * 1000) return false;
        } else if (timeFilter === '30D') {
          if (now - txDate > 30 * 24 * 3600 * 1000) return false;
        }
      }

      // Local search refinement (centre name, notes)
      if (search.trim()) {
        const q = search.toLowerCase();
        const refMatch = (tx.reference || '').toLowerCase().includes(q);
        const bookingMatch = (tx.booking?.bookingCode || '').toLowerCase().includes(q);
        const centreMatch =
          tx.metadata?.centreName?.toLowerCase().includes(q) ||
          tx.metadata?.centreCode?.toLowerCase().includes(q);
        const notesMatch = (tx.metadata?.notes || '').toLowerCase().includes(q);
        return refMatch || bookingMatch || centreMatch || notesMatch;
      }

      return true;
    });
  }, [transactions, selectedStatus, timeFilter, search]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalTopups = 0;
    let totalShared = 0;
    let totalBookings = 0;
    let sharedCount = 0;

    transactions.forEach((tx) => {
      const amt = Math.abs(Number(tx.amount) || 0);
      if (tx.status === 'COMPLETED') {
        if (tx.type === 'TOPUP') {
          totalTopups += amt;
        } else if (tx.metadata?.kind === 'WALLET_SHARE_OUT' || (Number(tx.amount) < 0 && tx.metadata?.centreId)) {
          totalShared += amt;
          sharedCount++;
        } else if (tx.type === 'CAPTURE' || tx.type === 'RESERVE' || tx.booking) {
          totalBookings += amt;
        }
      }
    });

    return { totalTopups, totalShared, totalBookings, sharedCount };
  }, [transactions]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['Date', 'Reference / UTR', 'Type', 'Centre / Beneficiary', 'Amount (INR)', 'Status', 'Notes'];
    const rows = filteredTransactions.map((tx) => {
      const isCredit = Number(tx.amount) > 0;
      const centreStr = tx.metadata?.centreName
        ? `${tx.metadata.centreName} (${tx.metadata.centreCode || ''})`
        : tx.booking
        ? `Booking: ${tx.booking.bookingCode}`
        : 'Platform';
      const notes = tx.metadata?.notes || tx.metadata?.reason || '';
      return [
        new Date(tx.createdAt).toLocaleString('en-IN'),
        `"${tx.reference || tx.id}"`,
        tx.metadata?.kind === 'WALLET_SHARE_OUT' ? 'TRANSFER_TO_CENTRE' : tx.type,
        `"${centreStr}"`,
        `${isCredit ? '+' : '-'}${Math.abs(Number(tx.amount)).toFixed(2)}`,
        tx.status,
        `"${notes.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `distributor_wallet_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted) return null;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#667085] mb-1">
              <Link href="/distributor" className="hover:text-[#172033]">
                Distributor Portal
              </Link>
              <span>/</span>
              <Link href="/distributor/wallet" className="hover:text-[#172033]">
                Wallet
              </Link>
              <span>/</span>
              <span className="text-[#C98219] font-semibold">Ledger History</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] flex items-center gap-2.5">
              <span>Dedicated Wallet History</span>
              <span className="text-xs bg-[#FEF7E6] text-[#8F5A0D] border border-[#F9DE9B] px-2.5 py-0.5 rounded-full font-bold">
                {totalCount} Total Entries
              </span>
            </h1>
            <p className="text-xs text-[#667085] mt-0.5">
              Complete audit ledger of distributor wallet balance recharges, centre share transfers, and booking debits.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadData(page)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F8FAFC] shadow-2xs transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#C98219]' : 'text-[#667085]'}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F8FAFC] shadow-2xs transition-all disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 text-[#667085]" />
              <span>Export CSV</span>
            </button>

            <Link
              href="/distributor/wallet"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] text-xs font-bold text-white shadow-subtle transition-all"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Manage Wallet</span>
            </Link>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
            <div className="flex items-center justify-between text-[#667085] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Current Balance</span>
              <Wallet className="h-4 w-4 text-[#C98219]" />
            </div>
            <div className="text-xl font-bold text-[#172033] tabular-nums">
              {wallet ? formatINR(wallet.availableBalance) : '🪙 0.00'}
            </div>
            <p className="text-[10.5px] text-[#667085] mt-1">Available for sharing &amp; tickets</p>
          </div>

          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
            <div className="flex items-center justify-between text-[#667085] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Shared to Centres</span>
              <ArrowRightLeft className="h-4 w-4 text-[#175CD3]" />
            </div>
            <div className="text-xl font-bold text-[#175CD3] tabular-nums">
              {formatINR(metrics.totalShared)}
            </div>
            <p className="text-[10.5px] text-[#667085] mt-1">{metrics.sharedCount} centre transfers executed</p>
          </div>

          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
            <div className="flex items-center justify-between text-[#667085] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Wallet Top-Ups</span>
              <ArrowDownLeft className="h-4 w-4 text-[#198754]" />
            </div>
            <div className="text-xl font-bold text-[#198754] tabular-nums">
              {formatINR(metrics.totalTopups)}
            </div>
            <p className="text-[10.5px] text-[#667085] mt-1">Successful balance recharges</p>
          </div>

          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
            <div className="flex items-center justify-between text-[#667085] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Ticket Deductions</span>
              <Ticket className="h-4 w-4 text-[#C98219]" />
            </div>
            <div className="text-xl font-bold text-[#C98219] tabular-nums">
              {formatINR(metrics.totalBookings)}
            </div>
            <p className="text-[10.5px] text-[#667085] mt-1">Automated booking charges</p>
          </div>
        </div>

        {/* Ledger Filter Toolbar */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#98A2B3]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference, UTR, centre name, code, or booking..."
                className="w-full rounded-[8px] border border-[#D0D5DD] pl-9 pr-3 py-1.5 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none focus:ring-1 focus:ring-[#C98219]"
              />
            </div>

            {/* Quick Time Presets */}
            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-[7px] border border-[#E6EAF0]">
              {(['ALL', 'TODAY', '7D', '30D'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeFilter(t)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-[5px] transition-all ${
                    timeFilter === t
                      ? 'bg-white text-[#C98219] shadow-2xs font-bold'
                      : 'text-[#667085] hover:text-[#172033]'
                  }`}
                >
                  {t === 'ALL' ? 'All Time' : t === 'TODAY' ? 'Today' : t === '7D' ? 'Last 7 Days' : 'Last 30 Days'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-[8px] border border-[#D0D5DD] px-3 py-1.5 text-xs text-[#172033] font-medium bg-white focus:border-[#C98219] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Type Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#E6EAF0]">
            <span className="text-[11px] font-bold text-[#667085] mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Operations' },
              { id: 'TOPUP', label: 'Wallet Top-Ups' },
              { id: 'ADJUSTMENT', label: 'Centre Shares & Adjustments' },
              { id: 'CAPTURE', label: 'Booking Charges' },
              { id: 'REFUND', label: 'Refunds' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedType(tab.id);
                  loadData(1);
                }}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                  selectedType === tab.id
                    ? 'border-[#C98219] bg-[#FEF7E6] text-[#8F5A0D] font-bold shadow-2xs'
                    : 'border-[#E6EAF0] bg-white text-[#475467] hover:bg-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#667085] uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date &amp; Time</th>
                  <th className="px-4 py-3">Reference / UTR</th>
                  <th className="px-4 py-3">Operation &amp; Direction</th>
                  <th className="px-4 py-3">Target Centre / Details</th>
                  <th className="px-4 py-3 text-right">Amount (Chips)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#667085]">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#C98219]" />
                      <p className="text-xs font-semibold">Loading wallet transactions ledger...</p>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#667085]">
                      <Wallet className="h-8 w-8 mx-auto mb-2 text-[#98A2B3]" />
                      <p className="text-sm font-bold text-[#172033]">No transactions found</p>
                      <p className="text-xs text-[#667085] mt-0.5">Try clearing your search query or filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const rawAmt = Number(tx.amount) || 0;
                    const isCredit = rawAmt > 0;
                    const isShareOut = tx.metadata?.kind === 'WALLET_SHARE_OUT' || (rawAmt < 0 && tx.metadata?.centreId);
                    const isShareIn = tx.metadata?.kind === 'WALLET_SHARE_IN';

                    return (
                      <tr key={tx.id} className="hover:bg-[#F8FAFC] transition-colors">
                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-[#475467]">
                          <div className="font-semibold text-[#172033]">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-[#98A2B3]">
                            {new Date(tx.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        </td>

                        {/* Reference / UTR */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-[#172033] bg-[#F2F4F7] px-2 py-0.5 rounded">
                              {tx.reference || tx.id.slice(0, 12)}
                            </span>
                            {tx.reference && (
                              <button
                                type="button"
                                onClick={() => handleCopy(tx.reference!)}
                                className="text-[#98A2B3] hover:text-[#C98219] transition-colors"
                                title="Copy Reference"
                              >
                                {copiedRef === tx.reference ? (
                                  <Check className="h-3 w-3 text-[#198754]" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Operation Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isShareOut ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF] px-2.5 py-0.5 text-[11px] font-bold">
                              <ArrowRightLeft className="h-3 w-3" /> Shared to Centre
                            </span>
                          ) : isShareIn ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5] px-2.5 py-0.5 text-[11px] font-bold">
                              <ArrowDownLeft className="h-3 w-3" /> Received Transfer
                            </span>
                          ) : tx.type === 'TOPUP' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5] px-2.5 py-0.5 text-[11px] font-bold">
                              <ArrowDownLeft className="h-3 w-3" /> Wallet Top-Up
                            </span>
                          ) : tx.type === 'CAPTURE' || tx.type === 'RESERVE' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF7E6] text-[#8F5A0D] border border-[#F9DE9B] px-2.5 py-0.5 text-[11px] font-bold">
                              <Ticket className="h-3 w-3" /> Ticket Booking
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F2F4F7] text-[#344054] px-2.5 py-0.5 text-[11px] font-bold">
                              {tx.type}
                            </span>
                          )}
                        </td>

                        {/* Beneficiary / Centre / Notes */}
                        <td className="px-4 py-3">
                          {isShareOut && tx.metadata?.centreName ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-[#172033] flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-[#175CD3]" />
                                {tx.metadata.centreName}
                              </span>
                              <span className="text-[10px] text-[#667085]">
                                Code: <span className="font-mono font-bold text-[#475467]">{tx.metadata.centreCode || 'N/A'}</span>
                                {tx.metadata.notes ? ` • "${tx.metadata.notes}"` : ''}
                              </span>
                            </div>
                          ) : tx.booking ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-[#172033] flex items-center gap-1">
                                <Ticket className="h-3 w-3 text-[#C98219]" />
                                {tx.booking.bookingCode}
                              </span>
                              <span className="text-[10px] text-[#667085]">
                                Route: {tx.booking.route} • Date: {tx.booking.requestedDate}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#667085]">
                              {tx.metadata?.reason || tx.metadata?.notes || 'Direct Balance Operation'}
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isCredit ? 'text-[#198754]' : 'text-[#172033]'
                            }`}
                          >
                            {isCredit ? '+' : '-'}{formatINR(Math.abs(rawAmt))}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {tx.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] text-[#027A48] px-2 py-0.5 text-[10.5px] font-bold">
                              <CheckCircle2 className="h-3 w-3" /> Success
                            </span>
                          ) : tx.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF7E6] text-[#B54708] px-2 py-0.5 text-[10.5px] font-bold">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3F2] text-[#B42318] px-2 py-0.5 text-[10.5px] font-bold">
                              <AlertCircle className="h-3 w-3" /> Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E6EAF0] px-4 py-3 bg-[#F8FAFC]">
              <span className="text-xs text-[#667085]">
                Showing page <span className="font-bold text-[#172033]">{page}</span> of{' '}
                <span className="font-bold text-[#172033]">{totalPages}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => loadData(Math.max(1, page - 1))}
                  disabled={page <= 1 || loading}
                  className="p-1 rounded border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F2F4F7] disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => loadData(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages || loading}
                  className="p-1 rounded border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F2F4F7] disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
