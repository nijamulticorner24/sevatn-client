'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, formatDate, formatTime } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import {
  Wallet,
  Plus,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  QrCode,
  ShieldCheck,
  X,
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  Eye,
  RefreshCw,
  Share2,
  Download,
  CirclePlus,
  ArrowRight,
  Sparkles,
  Building2,
  Phone,
  PhoneCall,
} from 'lucide-react';

export default function WalletPage() {
  const [mounted, setMounted] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [myCentre, setMyCentre] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Top-up Modal states
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(1000);
  const [topupMethod, setTopupMethod] = useState<'ONLINE' | 'OFFLINE_QR'>('OFFLINE_QR');
  const [paymentRef, setPaymentRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Receipt upload states
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptFileSize, setReceiptFileSize] = useState<number>(0);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  // Success Confirmation Modal states
  const [confirmedTopup, setConfirmedTopup] = useState<{
    amount: number;
    reference: string;
    method: 'ONLINE' | 'OFFLINE_QR';
    receiptUrl?: string | null;
    fileName?: string;
    status: string;
    date: string;
  } | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Receipt Lightbox Viewer states
  const [viewingReceipt, setViewingReceipt] = useState<{
    url: string;
    fileName?: string;
    reference?: string;
    amount?: number;
    date?: string;
    status?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    Promise.all([
      api.getWallet().catch(() => null),
      api.getTransactions(1, 50).catch(() => ({ transactions: [] })),
      api.getPublicPaymentConfig().catch(() => null),
      api.getMyCentre().catch(() => null),
    ])
      .then(([wData, tData, pCfg, cData]) => {
        if (wData) setWallet(wData);
        if (tData?.transactions) setTransactions(tData.transactions);
        if (cData) setMyCentre(cData);
        if (pCfg) {
          setPaymentConfig(pCfg);
          const onlineOn = pCfg.onlinePaymentEnabled !== false;
          const offlineOn = pCfg.offlinePaymentEnabled !== false;
          if (!offlineOn && onlineOn) {
            setTopupMethod('ONLINE');
          } else if (offlineOn) {
            setTopupMethod('OFFLINE_QR');
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load wallet data:', err);
        setLoading(false);
      });
  };

  const onlineEnabled = paymentConfig ? paymentConfig.onlinePaymentEnabled !== false : true;
  const offlineEnabled = paymentConfig ? paymentConfig.offlinePaymentEnabled !== false : true;
  const anyPaymentEnabled = onlineEnabled || offlineEnabled;

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const handleMethodChange = (method: 'ONLINE' | 'OFFLINE_QR') => {
    if (method === 'ONLINE' && !onlineEnabled) return;
    if (method === 'OFFLINE_QR' && !offlineEnabled) return;
    setTopupMethod(method);
    setReceiptError(null);
    setFormError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptError(null);
    setFormError(null);

    const validMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

    if (!validMimes.includes(file.type.toLowerCase()) && !validExtensions.includes(extension || '')) {
      setReceiptError('Invalid file type. Only JPG, PNG, and PDF files are accepted.');
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setReceiptError('File size exceeds the 5 MB limit. Please upload a smaller file.');
      return;
    }

    setReceiptFile(file);
    setReceiptFileName(file.name);
    setReceiptFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setReceiptUrl(dataUrl);
      if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(extension || '')) {
        setReceiptPreview(dataUrl);
      } else {
        setReceiptPreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptUrl(null);
    setReceiptFileName('');
    setReceiptFileSize(0);
    setReceiptPreview(null);
    setReceiptError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTopup = async () => {
    setFormError(null);
    setReceiptError(null);

    if (!anyPaymentEnabled) {
      setFormError('All payment methods are currently disabled by the platform administrator.');
      return;
    }

    if (topupMethod === 'ONLINE' && !onlineEnabled) {
      setFormError('Online payment gateway is currently disabled by the administrator.');
      return;
    }

    if (topupMethod === 'OFFLINE_QR' && !offlineEnabled) {
      setFormError('Offline QR / UPI payment is currently disabled by the administrator.');
      return;
    }

    if (!topupAmount || topupAmount < 100) {
      setFormError('Topup amount must be at least ₹100.');
      return;
    }

    if (topupMethod === 'OFFLINE_QR') {
      if (!receiptUrl || !receiptFile) {
        const errorMsg = 'Please upload your UPI payment screenshot / receipt before submitting.';
        setReceiptError(errorMsg);
        setFormError(errorMsg);
        return;
      }
      if (!paymentRef.trim()) {
        const errorMsg = 'Please enter the 12-digit UPI / UTR Transaction Reference number.';
        setFormError(errorMsg);
        return;
      }
    }

    setTopupLoading(true);
    try {
      const ref =
        topupMethod === 'OFFLINE_QR'
          ? paymentRef.trim() || `UPI-${Date.now().toString().slice(-8)}`
          : `GW-${Date.now()}`;

      await api.topupWallet(topupAmount, ref, {
        paymentMethod: topupMethod,
        receiptUrl: topupMethod === 'OFFLINE_QR' ? receiptUrl : undefined,
        receiptFileName: topupMethod === 'OFFLINE_QR' ? receiptFileName : undefined,
        receiptFileSize: topupMethod === 'OFFLINE_QR' ? receiptFileSize : undefined,
      });

      // Prepare confirmation record
      setConfirmedTopup({
        amount: topupAmount,
        reference: ref,
        method: topupMethod,
        receiptUrl: topupMethod === 'OFFLINE_QR' ? receiptUrl : undefined,
        fileName: receiptFileName,
        status: topupMethod === 'OFFLINE_QR' ? 'PENDING' : 'COMPLETED',
        date: new Date().toISOString(),
      });

      setIsTopupModalOpen(false);
      handleRemoveReceipt();
      setPaymentRef('');
      loadData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wallet-refresh'));
      }
    } catch (err: any) {
      setFormError(err.message || 'Topup request failed. Please verify details and try again.');
    } finally {
      setTopupLoading(false);
    }
  };

  const copyUpi = () => {
    if (paymentConfig?.offlineUpiId) {
      navigator.clipboard.writeText(paymentConfig.offlineUpiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const shareConfirmation = async () => {
    if (!confirmedTopup) return;
    const text = `SevaTN Top-Up Proof\nAmount: ${formatINR(confirmedTopup.amount)}\nUTR / Ref: ${confirmedTopup.reference}\nStatus: ${confirmedTopup.status === 'COMPLETED' ? 'Verified & Credited' : 'Awaiting Verification'}\nDate: ${formatDate(confirmedTopup.date)}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Top-Up Payment Receipt',
          text,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    }
  };

  const downloadReceiptImage = (dataUrl: string, filename = 'receipt.png') => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isCreditTx = (tx: any) => {
    if (tx.type === 'TOPUP' || tx.type === 'RELEASE' || tx.type === 'REFUND' || tx.type === 'CREDIT') {
      return true;
    }
    if (tx.type === 'CAPTURE' || tx.type === 'RESERVE' || tx.type === 'DEBIT') {
      return false;
    }
    if (tx.type === 'ADJUSTMENT') {
      return tx.metadata?.action === 'CREDIT' || Number(tx.amount) > 0;
    }
    return Number(tx.amount) > 0;
  };

  const getTxTypeBadge = (tx: any) => {
    switch (tx.type) {
      case 'TOPUP':
        return (
          <span className="inline-flex items-center rounded-full bg-[#EAF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#198754] border border-[#C3E6CB]">
            + TOP-UP
          </span>
        );
      case 'CREDIT':
        return (
          <span className="inline-flex items-center rounded-full bg-[#EAF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#198754] border border-[#C3E6CB]">
            + CREDIT
          </span>
        );
      case 'RESERVE':
        return (
          <span className="inline-flex items-center rounded-full bg-[#FEF7E6] px-2.5 py-0.5 text-[11px] font-bold text-[#B7791F] border border-[#FCE0A6]">
            HOLD
          </span>
        );
      case 'CAPTURE':
        return (
          <span className="inline-flex items-center rounded-full bg-[#FDECEC] px-2.5 py-0.5 text-[11px] font-bold text-[#C2413B] border border-[#F8C4C2]">
            - CAPTURE
          </span>
        );
      case 'RELEASE':
        return (
          <span className="inline-flex items-center rounded-full bg-[#EAF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#198754] border border-[#C3E6CB]">
            + RELEASE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-[#F2F4F7] px-2.5 py-0.5 text-[11px] font-medium text-[#344054]">
            {tx.type}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF7E6] px-2.5 py-0.5 text-[11px] font-semibold text-[#B7791F] border border-[#FCE0A6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B7791F] animate-pulse" />
            Awaiting Verification
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center rounded-full bg-[#EAF7EE] px-2.5 py-0.5 text-[11px] font-semibold text-[#198754] border border-[#C3E6CB]">
            Verified
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center rounded-full bg-[#FDECEC] px-2.5 py-0.5 text-[11px] font-semibold text-[#C2413B] border border-[#F5C6CB]">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-[#F2F4F7] px-2 py-0.5 text-[11px] font-medium text-[#344054]">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={4} />;
  }

  const availableBalance = Number(wallet?.availableBalance || 0);
  const reservedBalance = Number(wallet?.reservedBalance || 0);
  const totalBalance = availableBalance + reservedBalance;

  return (
    <div className="space-y-6">
      {/* Header & Centre Working Capital */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B2DDFF] bg-[#EFF8FF] px-3 py-1 text-xs text-[#175CD3] font-bold mb-2.5">
              <Wallet className="h-3.5 w-3.5 text-[#175CD3]" />
              <span>Centre Operating Capital &amp; Booking Balance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
              Centre Wallet &amp; Top-Up
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Top up your operating balance with instant UPI QR receipts. Use your balance to book tickets directly for devotees or maintain reserve liquidity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setFormError(null);
                setReceiptError(null);
                setIsTopupModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] px-4 py-2.5 text-xs font-bold text-white shadow-subtle transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Money / Top Up</span>
            </button>

            <Link
              href="/dashboard/bookings/new"
              className="inline-flex items-center gap-2 rounded-[8px] bg-[#175CD3] hover:bg-[#154EB5] px-4 py-2.5 text-xs font-bold text-white shadow-subtle transition-all"
            >
              <CirclePlus className="h-4 w-4" />
              <span>Book Tickets</span>
            </Link>

            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              title="Refresh Balance"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#667085]" />
            </button>
          </div>
        </div>

        {/* Balance Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#E6EAF0]">
          <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-4">
            <div className="flex items-center justify-between text-xs text-[#667085]">
              <span>Available Balance</span>
              <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754]">Ready to Book</span>
            </div>
            <div className="text-2xl font-black text-[#172033] mt-2">
              {formatINR(availableBalance)}
            </div>
            <p className="text-[11px] text-[#667085] mt-1">Available for new ticket bookings</p>
          </div>

          <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-4">
            <div className="flex items-center justify-between text-xs text-[#667085]">
              <span>Reserved in Escrow</span>
              <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-[10px] font-bold text-[#B7791F]">On Hold</span>
            </div>
            <div className="text-2xl font-black text-[#B7791F] mt-2">
              {formatINR(reservedBalance)}
            </div>
            <p className="text-[11px] text-[#667085] mt-1">Held for active in-flight booking jobs</p>
          </div>

          <div className="rounded-[8px] bg-[#EFF8FF] border border-[#B2DDFF] p-4">
            <div className="flex items-center justify-between text-xs text-[#175CD3] font-semibold">
              <span>Total Working Balance</span>
              <ShieldCheck className="h-4 w-4 text-[#175CD3]" />
            </div>
            <div className="text-2xl font-black text-[#175CD3] mt-2">
              {formatINR(totalBalance)}
            </div>
            <p className="text-[11px] text-[#175CD3]/80 mt-1">Available + Reserved escrow capital</p>
          </div>
        </div>
      </div>

      {/* Quick Booking CTA Banner */}
      <div className="rounded-[10px] border border-[#B2DDFF] bg-gradient-to-r from-[#EFF8FF] to-[#F8FAFC] p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-white text-[#175CD3] border border-[#B2DDFF] shadow-sm shrink-0">
            <Sparkles className="h-6 w-6 text-[#175CD3]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#175CD3]">Direct Ticket Booking Active</h3>
            <p className="text-xs text-[#475467] mt-0.5">
              As an authorized centre operator, your ticket bookings are backed by your wallet balance with automatic release on cancellation.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="inline-flex items-center justify-center gap-2 rounded-[7px] bg-[#175CD3] hover:bg-[#154EB5] px-5 py-2.5 text-xs font-bold text-white shadow-subtle transition-all shrink-0"
        >
          <span>Create New Booking</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Transaction History Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-[#E6EAF0]">
          <div>
            <h2 className="text-base font-bold text-[#172033]">Wallet Ledger &amp; Top-Up History</h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Complete transaction log with UTR references, payment receipts, and audit trail
            </p>
          </div>
          <span className="text-xs text-[#667085] font-medium">
            {transactions.length} record{transactions.length === 1 ? '' : 's'}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No transactions recorded yet"
              description="Your wallet transactions and top-up receipts will appear here once submitted."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-operational">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Description / Reference</th>
                  <th>Booking ID</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th className="text-center">Receipt Screenshot</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isPositive = isCreditTx(tx);
                  const displayAmount = Math.abs(Number(tx.amount || 0));
                  const receiptImg = tx.metadata?.receiptUrl;

                  return (
                    <tr key={tx.id}>
                      <td className="text-[#667085] text-[12px]">
                        <span className="font-medium text-[#172033] block">{formatDate(tx.createdAt)}</span>
                        <span>{formatTime(tx.createdAt)}</span>
                      </td>
                      <td className="font-medium text-[#172033]">
                        {tx.type === 'TOPUP' && 'Wallet Top-up'}
                        {tx.type === 'CREDIT' && 'Manual Admin Credit'}
                        {tx.type === 'RESERVE' && 'Booking Hold'}
                        {tx.type === 'CAPTURE' && 'Booking Fee Capture'}
                        {tx.type === 'DEBIT' && 'Admin Debit'}
                        {tx.type === 'RELEASE' && 'Released Hold'}
                        {tx.type === 'REFUND' && 'Surplus Payout'}
                        {tx.type === 'ADJUSTMENT' && (isPositive ? 'Balance Credit' : 'Balance Debit')}
                        <span className="block text-[11px] text-[#667085] font-mono">
                          {tx.reference || '—'}
                        </span>
                      </td>
                      <td className="font-mono text-[#344054] text-[12px]">
                        {tx.booking?.bookingCode || '—'}
                      </td>
                      <td>{getTxTypeBadge(tx)}</td>
                      <td className="text-right tabular-nums text-[13.5px]">
                        <span
                          className={`inline-block font-bold px-2.5 py-0.5 rounded-[5px] border ${
                            isPositive
                              ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                              : 'bg-[#FEF3F2] text-[#D92D20] border-[#FDA29B]'
                          }`}
                        >
                          {isPositive ? '+' : '-'} {formatINR(displayAmount)}
                        </span>
                      </td>
                      <td>{getStatusBadge(tx.status)}</td>
                      <td className="text-center">
                        {receiptImg ? (
                          <button
                            type="button"
                            onClick={() =>
                              setViewingReceipt({
                                url: receiptImg,
                                fileName: tx.metadata?.receiptFileName || 'receipt.png',
                                reference: tx.reference,
                                amount: displayAmount,
                                date: tx.createdAt,
                                status: tx.status,
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#B2DDFF] bg-[#EFF8FF] px-2.5 py-1 text-xs font-semibold text-[#175CD3] hover:bg-[#D1E9FF] transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-[#98A2B3] text-xs font-mono">—</span>
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

      {/* TOP-UP MODAL (Notice: Contact Provider Only) */}
      {isTopupModalOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#101828]/70 backdrop-blur-[3px] p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsTopupModalOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-[12px] bg-white p-5 sm:p-6 shadow-elevated border border-[#E6EAF0] my-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B] shrink-0">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Contact Your Provider</h3>
                  <p className="text-xs text-[#667085]">Centre Wallet Top-Up Notice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTopupModalOpen(false)}
                className="rounded-full p-1 text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054] transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 pt-1">
              {/* Informational Message Banner */}
              <div className="rounded-[10px] bg-[#EFF8FF] border border-[#B2DDFF] p-4 flex items-start gap-3">
                <Building2 className="h-5 w-5 text-[#175CD3] shrink-0 mt-0.5" />
                <div className="text-xs text-[#175CD3] leading-relaxed">
                  <p className="font-bold text-sm text-[#102A43] mb-1">
                    Direct top-up is managed by your provider
                  </p>
                  <p className="text-[#344054]">
                    Centre wallets are credited directly by your assigned Distributor or Franchise Provider. Please contact your provider to recharge your centre wallet balance.
                  </p>
                </div>
              </div>

              {/* Provider Contact Card */}
              {myCentre?.distributor ? (
                <div className="rounded-[10px] bg-[#F8FAFC] border border-[#E6EAF0] p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2">
                    <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider">
                      Assigned Regional Provider
                    </span>
                    <span className="font-mono text-[10.5px] font-bold text-[#C98219] bg-[#FEF7E6] px-2 py-0.5 rounded border border-[#F9DE9B]">
                      {myCentre.distributor.distributorCode}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#172033]">{myCentre.distributor.name}</p>
                    {myCentre.distributor.businessName && (
                      <p className="text-[11.5px] text-[#667085]">{myCentre.distributor.businessName}</p>
                    )}
                  </div>
                  <div className="pt-1 space-y-1.5 border-t border-[#E6EAF0]">
                    {myCentre.distributor.mobile && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#667085]">Phone / Mobile:</span>
                        <a
                          href={`tel:${myCentre.distributor.mobile}`}
                          className="font-mono font-bold text-[#175CD3] hover:underline"
                        >
                          {myCentre.distributor.mobile}
                        </a>
                      </div>
                    )}
                    {myCentre.distributor.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#667085]">Email:</span>
                        <a
                          href={`mailto:${myCentre.distributor.email}`}
                          className="font-mono text-[#475467] hover:underline"
                        >
                          {myCentre.distributor.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-[10px] bg-[#FAFBFD] border border-[#E6EAF0] p-4 text-xs text-[#475467] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#172033]">
                    <ShieldCheck className="h-4 w-4 text-[#C98219]" />
                    <span>Authorized Support Assistance</span>
                  </div>
                  <p className="leading-relaxed">
                    Please reach out to your regional distributor or the SevaTN support desk to top up your wallet.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E6EAF0]">
                {myCentre?.distributor?.mobile && (
                  <a
                    href={`tel:${myCentre.distributor.mobile}`}
                    className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#198754] hover:bg-[#157347] px-4 py-2 text-xs font-bold text-white transition-all shadow-subtle"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call Provider</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsTopupModalOpen(false)}
                  className="rounded-[7px] bg-[#172033] hover:bg-[#2A3750] px-4 py-2 text-xs font-bold text-white transition-all shadow-subtle"
                >
                  Understood, Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* CONFIRMED TOP-UP / RECEIPT SCREENSHOT MODAL (Portal) */}
      {confirmedTopup && mounted && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#101828]/75 backdrop-blur-[3px] p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmedTopup(null);
          }}
        >
          <div className="relative w-full max-w-lg rounded-[12px] bg-white p-5 sm:p-6 shadow-elevated border border-[#E6EAF0] my-auto">
            {/* Success Header */}
            <div className="text-center pb-4 border-b border-[#E6EAF0]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF7EE] text-[#198754] border border-[#C3E6CB] mb-2.5">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#172033]">
                {confirmedTopup.status === 'COMPLETED' ? 'Top-Up Credited Successfully!' : 'Top-Up Request Submitted!'}
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                {confirmedTopup.status === 'COMPLETED'
                  ? 'Your centre wallet balance has been updated immediately.'
                  : 'Your UPI receipt screenshot has been saved and submitted for administrator verification.'}
              </p>
            </div>

            {/* Transaction Summary Card */}
            <div className="my-4 rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#667085]">Top-Up Amount:</span>
                <span className="text-base font-extrabold text-[#198754]">+{formatINR(confirmedTopup.amount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E6EAF0] pt-2">
                <span className="text-[#667085]">Payment Reference / UTR:</span>
                <span className="font-mono font-bold text-[#172033]">{confirmedTopup.reference}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E6EAF0] pt-2">
                <span className="text-[#667085]">Payment Method:</span>
                <span className="font-semibold text-[#172033]">
                  {confirmedTopup.method === 'OFFLINE_QR' ? 'Offline UPI QR' : 'Online Payment Gateway'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E6EAF0] pt-2">
                <span className="text-[#667085]">Verification Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    confirmedTopup.status === 'COMPLETED'
                      ? 'bg-[#EAF7EE] text-[#198754]'
                      : 'bg-[#FEF7E6] text-[#B7791F]'
                  }`}
                >
                  {confirmedTopup.status === 'COMPLETED' ? 'VERIFIED' : 'AWAITING APPROVAL'}
                </span>
              </div>
            </div>

            {/* Uploaded Screenshot Proof Preview */}
            {confirmedTopup.receiptUrl && (
              <div className="my-3 rounded-[8px] border border-[#E6EAF0] bg-white p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#172033]">Uploaded Payment Proof:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        downloadReceiptImage(confirmedTopup.receiptUrl!, confirmedTopup.fileName || 'upi_receipt.png')
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#175CD3] hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={shareConfirmation}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C98219] hover:underline ml-2"
                    >
                      <Share2 className="h-3 w-3" />
                      <span>{copiedShareLink ? 'Copied!' : 'Share Proof'}</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto rounded border border-[#E6EAF0] bg-[#F8FAFC] p-2 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={confirmedTopup.receiptUrl}
                    alt="Payment Proof Screenshot"
                    className="max-h-52 w-auto object-contain rounded"
                  />
                </div>
              </div>
            )}

            {/* Modal Next Actions */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-[#E6EAF0]">
              <button
                type="button"
                onClick={() => setConfirmedTopup(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-[#667085] hover:text-[#172033]"
              >
                Close
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/dashboard/bookings/new"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#175CD3] hover:bg-[#154EB5] px-4 py-2 text-xs font-bold text-white shadow-subtle transition-all"
                >
                  <CirclePlus className="h-3.5 w-3.5" />
                  <span>Book Tickets</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmedTopup(null)}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-[8px] bg-[#C98219] hover:bg-[#B57414] px-4 py-2 text-xs font-bold text-white shadow-subtle transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* RECEIPT LIGHTBOX MODAL (Full Resolution Proof Inspection) */}
      {viewingReceipt && mounted && createPortal(
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-[#101828]/85 backdrop-blur-[4px] p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingReceipt(null);
          }}
        >
          <div className="relative w-full max-w-2xl rounded-[12px] bg-white p-5 sm:p-6 shadow-elevated border border-[#E6EAF0] my-auto">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#172033]">Payment Receipt Screenshot</h3>
                <p className="text-xs text-[#667085]">
                  Reference: <span className="font-mono font-bold text-[#172033]">{viewingReceipt.reference || '—'}</span>
                  {viewingReceipt.amount && ` • Amount: ${formatINR(viewingReceipt.amount)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadReceiptImage(viewingReceipt.url, viewingReceipt.fileName || 'receipt.png')
                  }
                  className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#D0D5DD] bg-white px-2.5 py-1 text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB]"
                  title="Download Image"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  className="rounded-full p-1 text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="my-4 max-h-[70vh] overflow-auto rounded-[8px] border border-[#E6EAF0] bg-[#101828]/5 p-2 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingReceipt.url}
                alt="Payment Receipt Full Proof"
                className="max-h-[65vh] w-auto object-contain rounded shadow"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#667085] pt-2 border-t border-[#E6EAF0]">
              <span>Status: <strong className="text-[#172033]">{viewingReceipt.status || 'SUBMITTED'}</strong></span>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-1.5 rounded-[6px] bg-[#172033] text-white font-bold hover:bg-[#25324B]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
