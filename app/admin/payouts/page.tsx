'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { formatINR, formatDate } from '../../../lib/utils';
import { useSocketStatus, useLiveEvent } from '@/lib/useSocket';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  UploadCloud,
  FileCheck2,
  Users,
  Search,
  RefreshCw,
  X,
  Send,
  Loader2,
  Image as ImageIcon,
  Check,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Settings,
} from 'lucide-react';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(100);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Settle Modal State
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [settling, setSettling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // View Receipt Modal State
  const [viewProofPayout, setViewProofPayout] = useState<any | null>(null);

  // WebSocket Live Updates
  const { isConnected } = useSocketStatus();

  useLiveEvent('admin:payout_requested', (data: any) => {
    console.log('⚡ [Live Event] Admin received new Payout Request:', data);
    setSuccessToast(`🔔 New UPI Payout Request from ${data.partnerName || 'Partner'} for ${formatINR(data.amount)}`);
    loadPayouts();
    setTimeout(() => setSuccessToast(null), 8000);
  });

  useEffect(() => {
    loadPayouts();
  }, [statusFilter]);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const [res, cfg] = await Promise.allSettled([
        api.getAdminPayouts(statusFilter),
        api.getSystemConfig(),
      ]);

      if (res.status === 'fulfilled') {
        setPayouts(res.value?.payouts || []);
      }
      if (cfg.status === 'fulfilled' && cfg.value?.partnerMinWithdrawal !== undefined) {
        setMinWithdrawal(Number(cfg.value.partnerMinWithdrawal));
      }
      setLoading(false);
    } catch (err) {
      console.warn('Failed to load admin payouts:', err);
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Screenshot size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    setErrorMsg(null);
    if (!paymentReference.trim()) {
      setErrorMsg('Please enter Bank UTR / Payment Reference ID');
      return;
    }

    setSettling(true);
    try {
      await api.settlePartnerPayout(selectedPayout.id, {
        paymentReference: paymentReference.trim(),
        screenshotUrl: screenshotUrl || undefined,
        adminNotes: adminNotes.trim() || undefined,
      });

      setSelectedPayout(null);
      setPaymentReference('');
      setScreenshotUrl(null);
      setAdminNotes('');
      setSuccessToast(`Payout #${selectedPayout.id.slice(0, 8)} successfully marked as SETTLED!`);
      loadPayouts();
      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to settle payout');
    } finally {
      setSettling(false);
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.partnerName?.toLowerCase().includes(q) ||
      p.partnerCode?.toLowerCase().includes(q) ||
      p.upiId?.toLowerCase().includes(q) ||
      p.paymentReference?.toLowerCase().includes(q)
    );
  });

  const totalRequested = payouts.reduce((sum, p) => sum + p.amount, 0);
  const totalSettled = payouts.filter((p) => p.status === 'SETTLED').reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payouts.filter((p) => p.status === 'REQUESTED' || p.status === 'PROCESSING').length;

  return (
    <div className="w-full space-y-6">
      {/* Real-time Toast Banner */}
      {successToast && (
        <div className="rounded-[10px] border border-[#C3E6CB] bg-[#EAF7EE] p-4 text-[#106A3B] shadow-subtle flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#198754] shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{successToast}</p>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-xs font-bold text-[#198754] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
            <DollarSign className="h-4 w-4" />
            <span>Financial Settlements & Payout Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            Partner Payout Requests
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Review franchisee withdrawal requests, process UPI bank settlements, and attach transfer proof receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/config"
            className="rounded-[7px] border border-[#E6EAF0] bg-white px-3 py-2 text-xs font-bold text-[#667085] hover:text-[#172033] hover:bg-[#F8FAFC] shadow-subtle transition-colors flex items-center gap-1.5"
            title="Configure Minimum Partner Withdrawal Limit"
          >
            <Settings className="h-3.5 w-3.5 text-[#C98219]" />
            <span>Min Limit: {formatINR(minWithdrawal)}</span>
          </Link>
          <button
            onClick={() => loadPayouts()}
            className="rounded-[7px] border border-[#E6EAF0] bg-white p-2.5 text-[#667085] hover:text-[#172033] hover:bg-[#F8FAFC] shadow-subtle transition-colors"
            title="Refresh Payouts"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
              isConnected
                ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                : 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-[#198754] animate-pulse' : 'bg-[#C98219]'
              }`}
            />
            <span>{isConnected ? 'LIVE WEBSOCKET' : 'CONNECTING...'}</span>
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6] p-5 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8F5A0D] uppercase tracking-wider">
              Pending Payout Actions
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#8F5A0D] mt-1">
              {loading ? '—' : pendingCount} Requests
            </div>
            <p className="text-[11px] text-[#8F5A0D]/80 mt-0.5">Awaiting bank settlement</p>
          </div>
          <div className="rounded-[8px] bg-white p-2.5 text-[#C98219] border border-[#F9DE9B]">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-[10px] border border-[#C3E6CB] bg-[#EAF7EE] p-5 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#198754] uppercase tracking-wider">
              Total Disbursed (Settled)
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#198754] mt-1 font-mono">
              {loading ? '—' : formatINR(totalSettled)}
            </div>
            <p className="text-[11px] text-[#198754]/80 mt-0.5">Completed partner withdrawals</p>
          </div>
          <div className="rounded-[8px] bg-white p-2.5 text-[#198754] border border-[#C3E6CB]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Total Requested Volume
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-1 font-mono">
              {loading ? '—' : formatINR(totalRequested)}
            </div>
            <p className="text-[11px] text-[#667085] mt-0.5">All-time franchise payout demand</p>
          </div>
          <div className="rounded-[8px] bg-[#F7F9FC] p-2.5 text-[#172033] border border-[#E6EAF0]">
            <FileCheck2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A2B3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by partner name, code, UPI ID, or UTR..."
              className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'REQUESTED', 'SETTLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-[7px] px-3.5 py-1.5 text-xs font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-[#C98219] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#475467] border border-[#E6EAF0] hover:bg-[#F0F3F8]'
              }`}
            >
              {st === 'REQUESTED' ? 'PENDING' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Payouts Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        {filteredPayouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">
            <DollarSign className="mx-auto h-8 w-8 text-[#98A2B3] mb-2 opacity-50" />
            <p className="font-bold text-[#172033]">No Payout Requests Found</p>
            <p className="mt-0.5">Partner withdrawal requests will appear here in real time via WebSocket.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#E6EAF0]">
                <tr>
                  <th className="py-3 px-4">Partner Franchise</th>
                  <th className="py-3 px-4">Amount Requested</th>
                  <th className="py-3 px-4">Destination UPI ID</th>
                  <th className="py-3 px-4">Requested Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Bank UTR / Reference</th>
                  <th className="py-3 px-4 text-right">Settlement Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0] bg-white">
                {filteredPayouts.map((p) => {
                  const isSettled = p.status === 'SETTLED';
                  const isPending = p.status === 'REQUESTED' || p.status === 'PROCESSING';

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isPending ? 'bg-[#FEFDF9] hover:bg-[#FDF9ED]' : 'hover:bg-[#FAFBFD]'
                      }`}
                    >
                      {/* Partner */}
                      <td className="py-3 px-4 font-bold text-[#172033]">
                        <p className="text-sm">{p.partnerName || 'Franchise Partner'}</p>
                        <span className="font-mono text-[11px] text-[#8F5A0D] font-semibold">
                          {p.partnerCode || 'PT-001'} • {p.partnerMobile || '—'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-sm text-[#172033]">
                        {formatINR(p.amount)}
                      </td>

                      {/* UPI ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-[#8F5A0D] block">
                          {p.upiId}
                        </span>
                        {p.accountHolder && (
                          <span className="text-[11px] text-[#667085] block">
                            {p.accountHolder}
                          </span>
                        )}
                      </td>

                      {/* Requested Date */}
                      <td className="py-3 px-4 text-[#475467]">
                        {formatDate(p.requestedAt || p.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isSettled ? (
                          <span className="rounded bg-[#EAF7EE] px-2.5 py-1 text-[10.5px] font-bold text-[#198754] border border-[#C3E6CB] inline-flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#198754]" />
                            SETTLED
                          </span>
                        ) : isPending ? (
                          <span className="rounded bg-[#FEF7E6] px-2.5 py-1 text-[10.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B] inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#C98219] animate-spin" />
                            PENDING ACTION
                          </span>
                        ) : (
                          <span className="rounded bg-[#FDECEC] px-2.5 py-1 text-[10.5px] font-bold text-[#C2413B] border border-[#F5C6CB] inline-flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-[#C2413B]" />
                            REJECTED
                          </span>
                        )}
                      </td>

                      {/* Bank Reference */}
                      <td className="py-3 px-4 font-mono text-xs">
                        {p.paymentReference ? (
                          <span className="font-bold text-[#172033] bg-[#F7F9FC] px-2 py-0.5 rounded border border-[#E6EAF0]">
                            {p.paymentReference}
                          </span>
                        ) : (
                          <span className="text-[#98A2B3] italic">Not Settled</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending ? (
                            <button
                              onClick={() => {
                                setSelectedPayout(p);
                                setPaymentReference('');
                                setScreenshotUrl(null);
                                setAdminNotes('');
                                setErrorMsg(null);
                              }}
                              className="rounded-[6px] bg-[#198754] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#157347] shadow-subtle transition-colors inline-flex items-center gap-1.5"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Settle & Send Proof</span>
                            </button>
                          ) : p.screenshotUrl ? (
                            <button
                              onClick={() => setViewProofPayout(p)}
                              className="rounded-[6px] border border-[#C3E6CB] bg-[#EAF7EE] px-2.5 py-1 text-[11px] font-bold text-[#198754] hover:bg-[#D8F3DF] transition-colors inline-flex items-center gap-1"
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                              <span>View Receipt</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#667085] font-medium">Settled</span>
                          )}
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

      {/* SETTLE PAYOUT & UPLOAD RECEIPT MODAL */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#101828]/60 backdrop-blur-sm"
            onClick={() => setSelectedPayout(null)}
          />

          <div className="relative w-full max-w-lg rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-elevated z-10 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-[#EAF7EE] text-[#198754] border border-[#C3E6CB]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Settle Partner Payout</h3>
                  <p className="text-xs text-[#667085]">
                    Transfer funds via UPI & upload bank transaction screenshot
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayout(null)}
                className="text-[#98A2B3] hover:text-[#172033]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-[7px] border border-[#F5C6CB] bg-[#FDECEC] p-3 text-xs text-[#C2413B] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Payout Details Card */}
            <div className="rounded-[8px] border border-[#F9DE9B] bg-[#FEF7E6] p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#8F5A0D] font-medium">Partner Franchise:</span>
                <span className="font-bold text-[#172033] text-sm">
                  {selectedPayout.partnerName} ({selectedPayout.partnerCode})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8F5A0D] font-medium">Payout Amount:</span>
                <span className="font-mono font-extrabold text-[#198754] text-base">
                  {formatINR(selectedPayout.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8F5A0D] font-medium">Destination UPI ID:</span>
                <span className="font-mono font-bold text-[#172033] bg-white px-2 py-0.5 rounded border border-[#F9DE9B]">
                  {selectedPayout.upiId}
                </span>
              </div>
              {selectedPayout.accountHolder && (
                <div className="flex justify-between items-center">
                  <span className="text-[#8F5A0D] font-medium">Beneficiary Name:</span>
                  <span className="font-semibold text-[#172033]">{selectedPayout.accountHolder}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              {/* UTR / Transaction Reference ID */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Bank UTR / Payment Reference ID *
                </label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UPI/529810482910/HDFC or IMPS-202610489"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-sm font-mono text-[#172033] placeholder-[#98A2B3] focus:border-[#198754] focus:outline-none font-semibold"
                />
              </div>

              {/* Upload Screenshot Proof */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Attach Payment Screenshot / Proof Receipt (Optional)
                </label>
                <div className="rounded-[8px] border-2 border-dashed border-[#D0D5DD] hover:border-[#198754] p-4 text-center transition-colors bg-[#F8FAFC]">
                  {screenshotUrl ? (
                    <div className="space-y-2">
                      <img
                        src={screenshotUrl}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded object-contain border border-[#E6EAF0]"
                      />
                      <button
                        type="button"
                        onClick={() => setScreenshotUrl(null)}
                        className="text-xs font-bold text-[#C2413B] hover:underline"
                      >
                        Remove Screenshot
                      </button>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud className="mx-auto h-8 w-8 text-[#98A2B3] mb-1" />
                      <label className="cursor-pointer text-xs font-bold text-[#198754] hover:underline">
                        <span>Click to Upload Payment Screenshot</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-[#667085] mt-0.5">PNG, JPG, or WEBP up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Admin Settlement Notes (Optional)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Transferred via HDFC Current Account"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs text-[#172033] placeholder-[#98A2B3] focus:border-[#198754] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#E6EAF0]">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-[#475467] hover:bg-[#F0F3F8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settling}
                  className="rounded-[7px] bg-[#198754] px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#157347] shadow-subtle transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {settling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Settling Payout...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirm Settlement & Send Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROOF RECEIPT MODAL */}
      {viewProofPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#101828]/60 backdrop-blur-sm"
            onClick={() => setViewProofPayout(null)}
          />

          <div className="relative w-full max-w-lg rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-elevated z-10 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#198754]" />
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Payment Settlement Proof</h3>
                  <p className="text-xs text-[#667085]">
                    Settled to {viewProofPayout.partnerName} ({viewProofPayout.upiId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewProofPayout(null)}
                className="text-[#98A2B3] hover:text-[#172033]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#667085]">Settled Amount:</span>
                <span className="font-mono font-bold text-[#198754] text-sm">{formatINR(viewProofPayout.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Bank Reference (UTR):</span>
                <span className="font-mono font-bold text-[#172033] bg-white px-2 py-0.5 rounded border border-[#E6EAF0]">
                  {viewProofPayout.paymentReference}
                </span>
              </div>
            </div>

            <div className="rounded-[8px] border border-[#E6EAF0] bg-[#172033]/5 p-2 overflow-hidden flex items-center justify-center max-h-[340px]">
              <img
                src={viewProofPayout.screenshotUrl}
                alt="Payment Proof"
                className="max-h-[320px] w-auto rounded object-contain"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewProofPayout(null)}
                className="rounded-[7px] bg-[#172033] px-5 py-2 text-xs font-bold text-white hover:bg-[#2B3B59] transition-colors"
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
