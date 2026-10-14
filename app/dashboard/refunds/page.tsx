'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, formatTime, cn } from '../../../lib/utils';
import {
  RotateCcw,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Wallet,
  Building,
  CreditCard,
  Copy,
  Eye,
  Check,
  X,
  FileText,
  AlertTriangle,
  ArrowDownLeft,
} from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';

interface RefundItem {
  id: string;
  amount: number | string;
  reason: string;
  upiId?: string | null;
  proofUrl?: string | null;
  status: string;
  reference?: string | null;
  adminNotes?: string | null;
  requestedAt: string;
  processedAt?: string | null;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [amount, setAmount] = useState<number>(500);
  const [upiId, setUpiId] = useState<string>('');
  const [reason, setReason] = useState<string>('Surplus wallet balance payout to UPI');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Proof Modal
  const [selectedProof, setSelectedProof] = useState<RefundItem | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = () => {
    Promise.all([
      api.getRefunds().catch(() => []),
      api.getWallet().catch(() => null),
    ]).then(([rData, wData]) => {
      setRefunds(rData || []);
      setWallet(wData);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isMonthlyLimitReached) {
      setFormError('Monthly refund limit reached. A maximum of 4 refund requests are allowed per calendar month.');
      return;
    }

    const available = Number(wallet?.availableBalance || 0);
    if (amount <= 0) {
      setFormError('Please enter a valid refund amount');
      return;
    }
    if (amount < 100) {
      setFormError('Minimum refund payout request is ₹100');
      return;
    }
    if (amount > available) {
      setFormError(`Insufficient available balance. You can withdraw up to ${formatCurrency(available)}`);
      return;
    }

    const cleanUpi = upiId.trim();
    if (!cleanUpi || !cleanUpi.includes('@')) {
      setFormError('Please enter a valid UPI ID (e.g. mobile@upi or name@okhdfcbank)');
      return;
    }

    setSubmitting(true);
    try {
      await api.requestRefund(amount, reason.trim() || 'Wallet balance payout', cleanUpi);
      setIsModalOpen(false);
      showToast('success', 'Refund request submitted! Admin will verify and disburse to your UPI ID.');
      setAmount(500);
      setReason('Surplus wallet balance payout to UPI');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Refund request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('success', 'Copied to clipboard');
  };

  const now = new Date();
  const currentMonthRefunds = refunds.filter((r) => {
    const d = new Date(r.requestedAt || (r as any).createdAt);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      r.status !== 'REJECTED'
    );
  });

  const MONTHLY_LIMIT = 4;
  const monthlyRefundCount = currentMonthRefunds.length;
  const remainingMonthlyRefunds = Math.max(0, MONTHLY_LIMIT - monthlyRefundCount);
  const isMonthlyLimitReached = monthlyRefundCount >= MONTHLY_LIMIT;

  const pendingRefundsTotal = refunds
    .filter((r) => r.status === 'REQUESTED' || r.status === 'UNDER_REVIEW')
    .reduce((acc, r) => acc + Number(r.amount || 0), 0);

  const settledRefundsTotal = refunds
    .filter((r) => r.status === 'PROCESSED')
    .reduce((acc, r) => acc + Number(r.amount || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-elevated border text-xs font-semibold backdrop-blur-md animate-in fade-in',
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
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E6EAF0]">
        <div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">Wallet Refund Requests</h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Request bank / UPI payout for surplus wallet balance directly to your UPI ID
          </p>
        </div>

        <button
          onClick={() => {
            if (isMonthlyLimitReached) {
              showToast('error', 'Monthly refund limit reached (4/4 used this month). Next reset on 1st of next month.');
              return;
            }
            setFormError(null);
            setIsModalOpen(true);
          }}
          disabled={isMonthlyLimitReached}
          className={cn(
            'flex items-center gap-2 rounded-[7px] px-4 py-2 text-xs font-semibold transition-all shadow-subtle self-start sm:self-auto',
            isMonthlyLimitReached
              ? 'bg-[#E6EAF0] text-[#98A2B3] cursor-not-allowed border border-[#D0D5DD]'
              : 'bg-[#C98219] hover:bg-[#B37316] text-white',
          )}
          title={isMonthlyLimitReached ? 'Monthly refund limit reached (4/4 used)' : 'Request Refund Payout'}
        >
          <Plus className="h-4 w-4" />
          <span>New Refund Request</span>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[10.5px] font-bold font-mono ml-0.5',
              isMonthlyLimitReached ? 'bg-[#D0D5DD] text-[#475467]' : 'bg-[#A76912] text-white',
            )}
          >
            {remainingMonthlyRefunds}/{MONTHLY_LIMIT}
          </span>
        </button>
      </div>

      {/* Monthly Limit Banner */}
      {isMonthlyLimitReached ? (
        <div className="rounded-[10px] border border-amber-300 bg-amber-50/90 p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Monthly Refund Quota Reached (4 of 4 Requests Used)
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Platform policy allows a maximum of 4 refund requests per calendar month. You have utilized all 4 requests for this month. Your quota will reset automatically on the 1st of next month.
              </p>
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
            Resets Next Month
          </span>
        </div>
      ) : (
        <div className="rounded-[8px] bg-purple-50/70 border border-purple-200/80 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-purple-900">
            <RotateCcw className="h-3.5 w-3.5 text-purple-600" />
            <span className="font-semibold">Monthly Refund Allowance:</span>
            <span className="text-purple-700">Maximum 4 requests allowed per calendar month.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-purple-900">
              {monthlyRefundCount} of {MONTHLY_LIMIT} Used
            </span>
            <span className="text-[11px] text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200 font-medium">
              {remainingMonthlyRefunds} remaining
            </span>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Available for Refund */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Available for Refund
            </span>
            <p className="font-mono text-2xl font-bold text-[#172033] mt-1">
              {wallet ? formatCurrency(wallet.availableBalance) : '₹0.00'}
            </p>
          </div>
          <p className="text-[11px] text-[#667085] mt-2">Free balance eligible for payout</p>
        </div>

        {/* Card 2: Monthly Quota (Max 4) */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                Monthly Quota
              </span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                  isMonthlyLimitReached
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-purple-100 text-purple-800 border border-purple-200',
                )}
              >
                {monthlyRefundCount} / 4 Used
              </span>
            </div>
            <p className="font-mono text-2xl font-bold text-[#172033] mt-1 flex items-baseline gap-1.5">
              <span>{remainingMonthlyRefunds}</span>
              <span className="text-xs font-normal text-[#667085]">left this month</span>
            </p>
          </div>
          <div className="mt-2">
            <div className="w-full bg-[#F2F4F7] h-1.5 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  isMonthlyLimitReached ? 'bg-red-600' : 'bg-purple-600',
                )}
                style={{ width: `${Math.min(100, (monthlyRefundCount / 4) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#98A2B3] mt-1.5">
              {isMonthlyLimitReached ? 'Quota full for this month' : 'Max 4 requests per calendar month'}
            </p>
          </div>
        </div>

        {/* Card 3: Active Booking Holds */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Active Booking Holds
            </span>
            <p className="font-mono text-2xl font-bold text-amber-700 mt-1">
              {wallet ? formatCurrency(wallet.reservedBalance) : '₹0.00'}
            </p>
          </div>
          <p className="text-[11px] text-[#667085] mt-2">Reserved for queue watchers</p>
        </div>

        {/* Card 4: Pending Disbursal */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Pending Disbursal
            </span>
            <p className="font-mono text-2xl font-bold text-amber-600 mt-1">
              {formatCurrency(pendingRefundsTotal)}
            </p>
          </div>
          <p className="text-[11px] text-[#667085] mt-2">Awaiting Admin approval</p>
        </div>

        {/* Card 5: Total Settled & Paid */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Total Settled
            </span>
            <p className="font-mono text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(settledRefundsTotal)}
            </p>
          </div>
          <p className="text-[11px] text-[#667085] mt-2">Transferred via UPI</p>
        </div>
      </div>

      {/* Refunds History Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
          <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
            Refund & Payout Ledger
          </h2>
          <span className="text-xs text-[#667085] font-medium">
            {refunds.length} total request{refunds.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={4} />
          </div>
        ) : refunds.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No refund requests filed"
              description="You have not requested any wallet refunds yet. Any eligible available balance can be withdrawn to your UPI ID at any time."
              action={{
                label: 'Request Refund',
                onClick: () => setIsModalOpen(true),
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E6EAF0] text-[#667085] bg-[#F8FAFC] uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-4 font-semibold">Requested At</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Transfer to UPI ID</th>
                  <th className="py-3 px-4 font-semibold">Reason / Description</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Bank UTR / Ref</th>
                  <th className="py-3 px-4 font-semibold text-center">Settlement Proof</th>
                  <th className="py-3 px-4 font-semibold">Admin Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0]">
                {refunds.map((r) => {
                  const isProcessed = r.status === 'PROCESSED';
                  const isRejected = r.status === 'REJECTED';
                  const isPending = r.status === 'REQUESTED' || r.status === 'UNDER_REVIEW';

                  return (
                    <tr key={r.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3.5 px-4 text-[#475467] font-mono whitespace-nowrap">
                        <div>{formatDate(r.requestedAt)}</div>
                        <div className="text-[10px] text-[#98A2B3]">{formatTime(r.requestedAt)}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#172033]">
                        {formatCurrency(r.amount)}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {r.upiId ? (
                          <div className="flex items-center gap-1.5 font-bold text-[#172033]">
                            <span>{r.upiId}</span>
                            <button
                              onClick={() => copyText(r.upiId!, `upi-${r.id}`)}
                              className="text-[#98A2B3] hover:text-[#172033]"
                              title="Copy UPI ID"
                            >
                              {copiedId === `upi-${r.id}` ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#98A2B3] italic">Registered Account</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#475467] max-w-xs truncate" title={r.reason}>
                        {r.reason}
                      </td>

                      <td className="py-3.5 px-4">
                        {isProcessed && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Settled & Disbursed
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Awaiting Payout
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-800 border border-red-200">
                            <AlertCircle className="h-3 w-3 text-red-600" />
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#344054]">
                        {r.reference ? (
                          <span className="font-semibold text-[#172033]">{r.reference}</span>
                        ) : (
                          <span className="text-[11px] text-[#98A2B3] italic">Under Verification</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {r.proofUrl ? (
                          <button
                            onClick={() => setSelectedProof(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5 text-blue-600" />
                            <span>View Proof</span>
                          </button>
                        ) : isProcessed ? (
                          <span className="text-[11px] text-[#667085]">Disbursed (No file attached)</span>
                        ) : (
                          <span className="text-[11px] text-[#98A2B3] italic">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#667085] max-w-xs truncate" title={r.adminNotes || ''}>
                        {r.adminNotes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: NEW REFUND REQUEST */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-[12px] border border-[#E6EAF0] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#C98219] text-white">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">Request Wallet Refund</h3>
                  <p className="text-xs text-[#667085]">Payout to your direct UPI account</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#98A2B3] hover:text-[#172033] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRequestRefund} className="p-6 space-y-4 text-xs overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-[7px] bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Monthly Quota Indicator */}
              <div className="p-3 rounded-[8px] bg-purple-50/70 border border-purple-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-purple-900 font-semibold">
                  <RotateCcw className="h-3.5 w-3.5 text-purple-600" />
                  <span>Monthly Allowance:</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-purple-900">{monthlyRefundCount} of {MONTHLY_LIMIT} Used</span>
                  <span className="text-[10.5px] text-purple-700 ml-1">({remainingMonthlyRefunds} remaining)</span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block font-semibold text-[#344054] mb-1">
                  Refund Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#667085] font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min={100}
                    max={wallet ? Number(wallet.availableBalance) : 100000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-[7px] border border-[#D0D5DD] pl-7 pr-3 py-2 text-xs font-mono font-bold text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-[#667085]">
                  <span>Minimum request: ₹100</span>
                  <span>
                    Available: <strong className="font-mono text-[#172033]">{wallet ? formatCurrency(wallet.availableBalance) : '₹0.00'}</strong>
                  </span>
                </div>

                {/* Quick amount chips */}
                <div className="flex items-center gap-2 mt-2">
                  {[500, 1000, 2000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E6EAF0] text-[11px] font-mono font-semibold text-[#344054] hover:bg-[#F2F4F7]"
                    >
                      ₹{val}
                    </button>
                  ))}
                  {wallet && Number(wallet.availableBalance) > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(Number(wallet.availableBalance))}
                      className="px-2.5 py-1 rounded bg-[#FDF7ED] border border-[#F9DE9B] text-[11px] font-semibold text-[#8F5A0D] hover:bg-[#FBEED7]"
                    >
                      Max Available
                    </button>
                  )}
                </div>
              </div>

              {/* UPI ID */}
              <div>
                <label className="block font-semibold text-[#344054] mb-1">
                  Direct UPI ID for Payout <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-[#98A2B3]" />
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. 9443100001@paytm, user@okhdfcbank"
                    className="w-full rounded-[7px] border border-[#D0D5DD] pl-9 pr-3 py-2 text-xs font-mono font-bold text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                  />
                </div>
                <p className="text-[11px] text-[#667085] mt-1">
                  Ensure the UPI ID is correct. Admin will disburse the refund amount directly to this ID.
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-semibold text-[#344054] mb-1">
                  Reason for Refund
                </label>
                <textarea
                  required
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Surplus wallet balance withdrawal to UPI"
                  className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                />
              </div>

              {/* SLA Notice */}
              <div className="rounded-[8px] bg-neutral-50 p-3 border border-[#E6EAF0] text-[11px] text-[#475467] space-y-1">
                <div className="flex justify-between">
                  <span>Settlement Method:</span>
                  <strong className="text-[#172033]">Instant UPI Transfer</strong>
                </div>
                <div className="flex justify-between">
                  <span>Disbursal SLA:</span>
                  <strong className="text-[#172033]">Within 24 Business Hours</strong>
                </div>
                <div className="flex justify-between border-t border-[#E6EAF0] pt-1">
                  <span>Monthly Allowance:</span>
                  <strong className="text-[#172033]">Max 4 Requests / Month ({remainingMonthlyRefunds} Left)</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E6EAF0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-[7px] border border-[#D0D5DD] text-[#344054] hover:bg-[#F2F4F7] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || isMonthlyLimitReached || (wallet && amount > Number(wallet.availableBalance))}
                  className="px-5 py-2 rounded-[7px] bg-[#C98219] hover:bg-[#B37316] text-white text-xs font-bold disabled:opacity-50 shadow-subtle transition-all"
                >
                  {submitting ? 'Submitting...' : isMonthlyLimitReached ? 'Monthly Limit Reached' : 'Submit Refund Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW SETTLEMENT PROOF */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-[12px] border border-[#E6EAF0] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">Refund Settlement Proof</h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Amount: <strong className="font-mono text-emerald-700">{formatCurrency(selectedProof.amount)}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-[#98A2B3] hover:text-[#172033] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3 rounded-lg border border-[#E6EAF0]">
                <div>
                  <span className="text-[#667085]">Bank Reference / UTR:</span>
                  <p className="font-mono font-bold text-[#172033] mt-0.5">
                    {selectedProof.reference || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Disbursed to UPI ID:</span>
                  <p className="font-mono font-bold text-[#172033] mt-0.5">
                    {selectedProof.upiId || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Settled Timestamp:</span>
                  <p className="text-[#475467] mt-0.5">
                    {selectedProof.processedAt ? `${formatDate(selectedProof.processedAt)} ${formatTime(selectedProof.processedAt)}` : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085]">Admin Notes:</span>
                  <p className="text-[#475467] mt-0.5">
                    {selectedProof.adminNotes || 'Payment disbursed'}
                  </p>
                </div>
              </div>

              {/* Proof Image Display */}
              <div className="border border-[#E6EAF0] rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center min-h-[220px] max-h-[420px]">
                {selectedProof.proofUrl ? (
                  <img
                    src={selectedProof.proofUrl}
                    alt="Refund Settlement Receipt Proof"
                    className="max-h-[400px] w-auto object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-xs text-[#667085]">
                    <FileText className="h-8 w-8 text-[#98A2B3] mx-auto mb-2" />
                    No screenshot image attached
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#E6EAF0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setSelectedProof(null)}
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
