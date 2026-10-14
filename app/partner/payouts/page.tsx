'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import { useSocketStatus, useLiveEvent } from '@/lib/useSocket';
import {
  DollarSign,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  Send,
  Loader2,
  Building2,
  ExternalLink,
  Eye,
  X,
  Sparkles,
  RefreshCw,
  Wallet,
  ShieldCheck,
  Check,
  CreditCard,
  Image as ImageIcon,
} from 'lucide-react';

export default function PartnerPayoutsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<any | null>(null);

  // Form State
  const [amount, setAmount] = useState<number | string>('');
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Real-time WebSocket Status & Listener
  const { isConnected } = useSocketStatus();

  useLiveEvent('partner:payout_settled', (evt: any) => {
    console.log('⚡ [Live Event] Partner Payout Settled:', evt);
    setSuccessMsg(`🎉 Payout of ${formatINR(evt.amount)} has been SETTLED by Admin! UTR: ${evt.paymentReference}`);
    loadPayouts();
    setTimeout(() => setSuccessMsg(null), 8000);
  });

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      const res = await api.getPartnerPayouts();
      setData(res);
      setLoading(false);
    } catch (err) {
      console.warn('Failed to load partner payouts:', err);
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const minWithdrawal = Number(data?.minWithdrawal || 100);
    const numAmount = Number(amount);
    if (!numAmount || numAmount < minWithdrawal) {
      setErrorMsg(`Minimum withdrawal amount is ₹${minWithdrawal}`);
      return;
    }

    if (numAmount > (data?.availableBalance || 0)) {
      setErrorMsg(`Withdrawal amount cannot exceed available balance (${formatINR(data?.availableBalance || 0)})`);
      return;
    }

    if (!upiId.trim() || !upiId.includes('@')) {
      setErrorMsg('Please enter a valid UPI ID (e.g. 9842918291@okaxis or name@upi)');
      return;
    }

    setSubmitting(true);
    try {
      await api.requestPartnerPayout({
        amount: numAmount,
        upiId: upiId.trim(),
        accountHolder: accountHolder.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setIsModalOpen(false);
      setAmount('');
      setNotes('');
      setSuccessMsg('Withdrawal request submitted successfully! Admin will process the transfer and upload the receipt proof.');
      loadPayouts();
      setTimeout(() => setSuccessMsg(null), 7000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const availableBalance = data?.availableBalance || 0;
  const minWithdrawal = Number(data?.minWithdrawal || 100);
  const totalEarned = data?.totalEarned || 0;
  const totalSettled = data?.totalSettled || 0;
  const pendingWithdrawal = data?.pendingWithdrawal || 0;
  const payouts = data?.payouts || [];

  return (
    <div className="w-full space-y-6">
      {/* Real-time Notification Banner */}
      {successMsg && (
        <div className="rounded-[10px] border border-[#C3E6CB] bg-[#EAF7EE] p-4 text-[#106A3B] shadow-subtle flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#198754] shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
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
            <span>Partner Revenue & Settlement Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            Partner Payout & UPI Withdrawals
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Track your franchisee earnings, request instant UPI payouts, and verify official bank settlement transfer proofs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadPayouts()}
            className="rounded-[7px] border border-[#E6EAF0] bg-white p-2.5 text-[#667085] hover:text-[#172033] hover:bg-[#F8FAFC] shadow-subtle transition-colors"
            title="Refresh Payouts"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setErrorMsg(null);
              setIsModalOpen(true);
            }}
            disabled={availableBalance < minWithdrawal}
            title={availableBalance < minWithdrawal ? `Minimum withdrawal limit is ${formatINR(minWithdrawal)}` : undefined}
            className="rounded-[7px] bg-[#C98219] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowDownToLine className="h-4 w-4" />
            <span>Withdraw Funds (UPI)</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6] p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8F5A0D] uppercase tracking-wider">
              Available to Withdraw
            </span>
            <div className="rounded-[8px] bg-white p-2 text-[#C98219] border border-[#F9DE9B]">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#8F5A0D] font-mono">
              {loading ? '—' : formatINR(availableBalance)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#8F5A0D]/80 mt-1">
              <span>Instant UPI payout</span>
              <span className="font-semibold bg-[#F9DE9B]/50 px-1.5 py-0.5 rounded text-[10px]">Min: {formatINR(minWithdrawal)}</span>
            </div>
          </div>
        </div>

        {/* Total Earned */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Total Revenue Earned
            </span>
            <div className="rounded-[8px] bg-[#F7F9FC] p-2 text-[#172033] border border-[#E6EAF0]">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#172033] font-mono">
              {loading ? '—' : formatINR(totalEarned)}
            </p>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Franchise commissions & passes
            </p>
          </div>
        </div>

        {/* Total Settled */}
        <div className="rounded-[10px] border border-[#C3E6CB] bg-[#EAF7EE] p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#198754] uppercase tracking-wider">
              Total Settled (Bank / UPI)
            </span>
            <div className="rounded-[8px] bg-white p-2 text-[#198754] border border-[#C3E6CB]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#198754] font-mono">
              {loading ? '—' : formatINR(totalSettled)}
            </p>
            <p className="text-[11px] text-[#198754]/80 mt-0.5">
              Completed bank transfers
            </p>
          </div>
        </div>

        {/* Pending In-Process */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Pending Admin Transfer
            </span>
            <div className="rounded-[8px] bg-[#F7F9FC] p-2 text-[#667085] border border-[#E6EAF0]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#172033] font-mono">
              {loading ? '—' : formatINR(pendingWithdrawal)}
            </p>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Under processing queue
            </p>
          </div>
        </div>
      </div>

      {/* Payout Requests History */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#172033]">
              Withdrawal & Settlement Ledger ({payouts.length})
            </h3>
            <p className="text-xs text-[#667085]">
              Real-time records of all requested and settled UPI payouts with official payment proof screenshots.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${
              isConnected ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]' : 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-[#198754] animate-pulse' : 'bg-[#C98219]'}`} />
            {isConnected ? 'Live WebSocket' : 'Connecting'}
          </span>
        </div>

        {payouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">
            <DollarSign className="mx-auto h-8 w-8 text-[#98A2B3] mb-2 opacity-50" />
            <p className="font-bold text-[#172033]">No Withdrawal Requests Yet</p>
            <p className="mt-0.5">Use the "Withdraw Funds (UPI)" button to submit your first payout request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#E6EAF0]">
                <tr>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4">Withdrawal Amount</th>
                  <th className="py-3 px-4">Destination UPI ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Bank UTR / Reference</th>
                  <th className="py-3 px-4 text-right">Payment Receipt Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0] bg-white">
                {payouts.map((p: any) => {
                  const isSettled = p.status === 'SETTLED';
                  const isRequested = p.status === 'REQUESTED' || p.status === 'PROCESSING';

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isSettled ? 'hover:bg-[#FAFDFB]' : 'hover:bg-[#FAFBFD]'
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 font-medium text-[#172033]">
                        {formatDate(p.requestedAt || p.createdAt)}
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

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isSettled ? (
                          <span className="rounded bg-[#EAF7EE] px-2.5 py-1 text-[10.5px] font-bold text-[#198754] border border-[#C3E6CB] inline-flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#198754]" />
                            SETTLED
                          </span>
                        ) : isRequested ? (
                          <span className="rounded bg-[#FEF7E6] px-2.5 py-1 text-[10.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B] inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#C98219] animate-spin" />
                            PENDING TRANSFER
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
                          <span className="text-[#98A2B3] italic">Pending assignment</span>
                        )}
                      </td>

                      {/* Proof Action */}
                      <td className="py-3 px-4 text-right">
                        {p.screenshotUrl ? (
                          <button
                            onClick={() => setSelectedProof(p)}
                            className="rounded-[6px] border border-[#C3E6CB] bg-[#EAF7EE] px-3 py-1.5 text-[11px] font-bold text-[#198754] hover:bg-[#D8F3DF] transition-colors inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            <span>View Proof Receipt</span>
                          </button>
                        ) : isSettled ? (
                          <span className="text-[11px] text-[#667085]">Direct Settlement</span>
                        ) : (
                          <span className="text-[11px] text-[#98A2B3] italic">Awaiting transfer</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WITHDRAWAL REQUEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#101828]/50 backdrop-blur-[2px]"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-elevated z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
                  <ArrowDownToLine className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Request UPI Withdrawal</h3>
                  <p className="text-xs text-[#667085]">Transfer earnings directly to your UPI ID</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#98A2B3] hover:text-[#172033]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-[7px] border border-[#F5C6CB] bg-[#FDECEC] p-3 text-xs text-[#C2413B] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleWithdraw} className="mt-4 space-y-4">
              {/* Available Balance Reminder */}
              <div className="rounded-[8px] border border-[#F9DE9B] bg-[#FEF7E6] p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#8F5A0D] font-medium block">Available Balance:</span>
                  <span className="text-[11px] text-[#8F5A0D]/80 font-semibold">Minimum withdrawal: {formatINR(minWithdrawal)}</span>
                </div>
                <span className="text-sm font-extrabold text-[#8F5A0D] font-mono">
                  {formatINR(availableBalance)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Withdrawal Amount (₹) *
                </label>
                <input
                  type="number"
                  min={minWithdrawal}
                  max={availableBalance}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ${minWithdrawal}`}
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-sm font-mono font-bold text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                />
                <div className="mt-2 flex items-center gap-2">
                  {Array.from(new Set([minWithdrawal, Math.max(minWithdrawal * 2, 500), Math.max(minWithdrawal * 5, 1000)]))
                    .filter((preset) => preset <= availableBalance)
                    .map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        className="rounded-[5px] border border-[#E6EAF0] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-bold text-[#172033] hover:border-[#C98219] hover:bg-[#FEF7E6] transition-colors"
                      >
                        ₹{preset}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => setAmount(availableBalance)}
                    className="rounded-[5px] border border-[#F9DE9B] bg-[#FEF7E6] px-2.5 py-1 text-[11px] font-bold text-[#8F5A0D] hover:bg-[#F9DE9B] transition-colors"
                  >
                    Max ({formatINR(availableBalance)})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Your UPI ID *
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. 9876543210@paytm / name@okaxis"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-sm font-mono text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Account / Beneficiary Name (Optional)
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Monthly franchise payout"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E6EAF0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] px-4 py-2.5 text-xs font-bold text-[#475467] hover:bg-[#F0F3F8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-[7px] bg-[#C98219] px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Payout Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROOF SCREENSHOT PREVIEW MODAL */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#101828]/60 backdrop-blur-sm"
            onClick={() => setSelectedProof(null)}
          />

          <div className="relative w-full max-w-lg rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-elevated z-10 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#198754]" />
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Bank Transfer Proof Receipt</h3>
                  <p className="text-xs text-[#667085]">Verified payment settlement from Administrator</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-[#98A2B3] hover:text-[#172033]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#667085]">Settled Amount:</span>
                <span className="font-mono font-bold text-[#198754] text-sm">{formatINR(selectedProof.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Destination UPI:</span>
                <span className="font-mono font-semibold text-[#172033]">{selectedProof.upiId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Bank UTR / Reference:</span>
                <span className="font-mono font-bold text-[#172033] bg-white px-2 py-0.5 rounded border border-[#E6EAF0]">
                  {selectedProof.paymentReference}
                </span>
              </div>
              {selectedProof.settledAt && (
                <div className="flex justify-between">
                  <span className="text-[#667085]">Settlement Timestamp:</span>
                  <span className="font-medium text-[#172033]">{formatDate(selectedProof.settledAt)}</span>
                </div>
              )}
            </div>

            {/* Proof Image Render */}
            <div className="rounded-[8px] border border-[#E6EAF0] bg-[#172033]/5 p-2 overflow-hidden flex items-center justify-center max-h-[340px]">
              <img
                src={selectedProof.screenshotUrl}
                alt="Bank Transfer Receipt"
                className="max-h-[320px] w-auto rounded object-contain shadow-xs"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProof(null)}
                className="rounded-[7px] bg-[#172033] px-5 py-2 text-xs font-bold text-white hover:bg-[#2B3B59] transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
