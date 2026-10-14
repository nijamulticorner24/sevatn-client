'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { formatINR, formatDate, formatTime } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  RotateCcw,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Scale,
  X,
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

export default function WalletPage() {
  const [mounted, setMounted] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [serviceFee, setServiceFee] = useState<number>(100);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState(1000);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupMethod, setTopupMethod] = useState<'ONLINE' | 'OFFLINE_QR'>('OFFLINE_QR');
  const [paymentRef, setPaymentRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Receipt upload states
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptFileSize, setReceiptFileSize] = useState<number>(0);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    Promise.all([
      api.getWallet(),
      api.getTransactions(1, 50),
      api.getBookingConfig().catch(() => null),
      api.getPublicPaymentConfig().catch(() => null),
    ])
      .then(([wData, tData, cfg, pCfg]) => {
        setWallet(wData);
        if (tData?.transactions) setTransactions(tData.transactions);
        if (cfg?.serviceFee) setServiceFee(Number(cfg.serviceFee));
        if (pCfg) {
          setPaymentConfig(pCfg);
          if (!pCfg.offlinePaymentEnabled && pCfg.onlinePaymentEnabled) {
            setTopupMethod('ONLINE');
          } else {
            setTopupMethod('OFFLINE_QR');
          }
        }
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const handleMethodChange = (method: 'ONLINE' | 'OFFLINE_QR') => {
    setTopupMethod(method);
    setReceiptError(null);
    setFormError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptError(null);
    setFormError(null);

    // Validate allowed file types: JPG, JPEG, PNG, PDF
    const validMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

    if (!validMimes.includes(file.type.toLowerCase()) && !validExtensions.includes(extension || '')) {
      setReceiptError('Invalid file type. Only JPG, PNG, and PDF files are accepted.');
      return;
    }

    // Validate file size: Max 5 MB
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

    if (!topupAmount || topupAmount < 100) {
      setFormError('Topup amount must be at least ₹100.');
      return;
    }

    if (topupMethod === 'OFFLINE_QR') {
      if (!receiptUrl || !receiptFile) {
        const errorMsg = 'Please upload your UPI payment receipt before submitting your wallet top-up request.';
        setReceiptError(errorMsg);
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

      const res: any = await api.topupWallet(topupAmount, ref, {
        paymentMethod: topupMethod,
        receiptUrl: topupMethod === 'OFFLINE_QR' ? receiptUrl : undefined,
        receiptFileName: topupMethod === 'OFFLINE_QR' ? receiptFileName : undefined,
        receiptFileSize: topupMethod === 'OFFLINE_QR' ? receiptFileSize : undefined,
      });

      if (topupMethod === 'OFFLINE_QR') {
        setSuccessMsg(
          res?.message ||
            'Top-up request submitted for verification. Your wallet will be credited once your receipt is verified.',
        );
      } else {
        setSuccessMsg(`Successfully added ${formatINR(topupAmount)} to centre wallet balance.`);
      }

      setIsTopupModalOpen(false);
      handleRemoveReceipt();
      setPaymentRef('');
      loadData();
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      setFormError(err.message || 'Topup failed. Please verify details and try again.');
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

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'TOPUP':
        return (
          <span className="inline-flex items-center rounded-full bg-[#EAF7EE] px-2 py-0.5 text-[11px] font-semibold text-[#198754] border border-[#C3E6CB]">
            TOP-UP
          </span>
        );
      case 'RESERVE':
        return (
          <span className="inline-flex items-center rounded-full bg-[#FEF7E6] px-2 py-0.5 text-[11px] font-semibold text-[#B7791F] border border-[#FCE0A6]">
            HOLD
          </span>
        );
      case 'CAPTURE':
        return (
          <span className="inline-flex items-center rounded-full bg-[#EDF4FC] px-2 py-0.5 text-[11px] font-semibold text-[#3568A8] border border-[#BEE5EB]">
            CAPTURED
          </span>
        );
      case 'RELEASE':
        return (
          <span className="inline-flex items-center rounded-full bg-[#F0F3F8] px-2 py-0.5 text-[11px] font-semibold text-[#475467] border border-[#D0D5DD]">
            RELEASED
          </span>
        );
      case 'REFUND':
        return (
          <span className="inline-flex items-center rounded-full bg-[#FDECEC] px-2 py-0.5 text-[11px] font-semibold text-[#C2413B] border border-[#F5C6CB]">
            REFUND
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-[#F2F4F7] px-2 py-0.5 text-[11px] font-medium text-[#344054]">
            {type}
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
      case 'REVERSED':
        return (
          <span className="inline-flex items-center rounded-full bg-[#F2F4F7] px-2.5 py-0.5 text-[11px] font-semibold text-[#475467] border border-[#D0D5DD]">
            Reversed
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
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-32" />
        <LoadingSkeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E6EAF0]">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-bold text-[#172033] tracking-tight">
            Centre Wallet & Financial Ledger
          </h1>
          <p className="mt-0.5 text-[13px] text-[#667085]">
            Immutable double-entry accounting with automated {formatINR(serviceFee)} hold, verified capture, and instant release
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setReceiptError(null);
            setIsTopupModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-[7px] bg-[#C98219] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle"
        >
          <Plus className="h-4 w-4" />
          <span>Add Money to Wallet</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-[8px] border border-[#A6F4C5] bg-[#EAF7EE] p-3.5 text-[13px] font-semibold text-[#106A3B]">
          <CheckCircle2 className="h-4 w-4 text-[#198754] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="rounded-[10px] border border-[#E8D5B7] bg-[#FDF7ED] p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-[#8F5A0D] uppercase tracking-wider">
              Available Balance
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-white text-[#C98219] border border-[#E8D5B7]">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold text-[#172033] tabular-nums leading-none">
            {wallet ? formatINR(wallet.availableBalance) : '₹0.00'}
          </p>
          <p className="mt-2 text-[12px] text-[#7A4A12]">
            Ready for new bookings (~{wallet ? Math.floor(Number(wallet.availableBalance) / serviceFee) : 0} requests capacity)
          </p>
        </div>

        {/* Reserved Balance on Hold */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold text-[#667085] uppercase tracking-wider">
              Reserved on Active Hold
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#F2F4F7] text-[#667085]">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-[28px] font-bold text-[#475467] tabular-nums leading-none">
            {wallet ? formatINR(wallet.reservedBalance) : '₹0.00'}
          </p>
          <p className="mt-2 text-[12px] text-[#667085]">
            Held during queue monitoring. Released if unsuccessful.
          </p>
        </div>

        {/* Per Booking Settlement Rule */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold text-[#667085] uppercase tracking-wider">
              Assistance Service Fee
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#EAF7EE] text-[#198754]">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[18px] font-bold text-[#172033] tabular-nums">{formatINR(serviceFee)}</span>
            <span className="text-[12px] text-[#667085] ml-1.5">per verified pass</span>
          </div>
          <div className="mt-2 border-t border-[#F0F3F7] pt-2 text-[11.5px] text-[#475467]">
            <span>Zero advance risk • 100% refunded if pass unconfirmed</span>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E6EAF0]">
          <h2 className="text-[15px] font-bold text-[#172033]">Financial Transaction Ledger</h2>
          <p className="text-[12px] text-[#667085]">
            Auditable double-entry history of topups, holds, captures, and releases
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No transactions yet"
              description="Your wallet transactions will appear here once you top up or submit bookings."
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
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isPositive = tx.type === 'TOPUP' || tx.type === 'RELEASE';
                  return (
                    <tr key={tx.id}>
                      <td className="text-[#667085] text-[12px]">
                        <span className="font-medium text-[#172033] block">{formatDate(tx.createdAt)}</span>
                        <span>{formatTime(tx.createdAt)}</span>
                      </td>
                      <td className="font-medium text-[#172033]">
                        {tx.type === 'TOPUP' && 'Wallet Top-up'}
                        {tx.type === 'RESERVE' && 'Booking Reservation Hold'}
                        {tx.type === 'CAPTURE' && 'Verified Booking Fee Capture'}
                        {tx.type === 'RELEASE' && 'Unreserved Hold Released'}
                        {tx.type === 'REFUND' && 'Surplus Wallet Payout'}
                        <span className="block text-[11px] text-[#667085] font-mono">
                          {tx.reference || '—'}
                        </span>
                      </td>
                      <td className="font-mono text-[#344054] text-[12px]">
                        {tx.booking?.bookingCode || '—'}
                      </td>
                      <td>{getTxTypeBadge(tx.type)}</td>
                      <td
                        className={`text-right font-bold tabular-nums text-[13.5px] ${
                          isPositive ? 'text-[#198754]' : 'text-[#172033]'
                        }`}
                      >
                        {isPositive ? '+' : '-'} {formatINR(tx.amount)}
                      </td>
                      <td>{getStatusBadge(tx.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Money Modal (Full-screen Portal: covers entire viewport including header & sidebar) */}
      {isTopupModalOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#101828]/70 backdrop-blur-[3px] p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsTopupModalOpen(false);
              setFormError(null);
              setReceiptError(null);
            }
          }}
        >
          <div
            className="w-full max-w-[880px] my-auto flex flex-col rounded-[16px] bg-white shadow-modal border border-[#E6EAF0] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6EAF0] shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#172033]">Add Money to Wallet</h3>
                  <p className="text-[12px] text-[#667085]">Instant automated gateway or verified UPI payment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTopupModalOpen(false);
                  setFormError(null);
                  setReceiptError(null);
                }}
                className="rounded-[6px] p-1.5 text-[#98A2B3] hover:text-[#172033] hover:bg-[#F2F4F7] transition-colors"
                aria-label="Close Add Money modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto space-y-4">
              {/* Form Validation Error Banner */}
              {formError && (
                <div className="flex items-start gap-2.5 rounded-[8px] border border-[#FDA29B] bg-[#FEF3F2] p-3 text-[13px] font-medium text-[#B42318]">
                  <AlertCircle className="h-4 w-4 text-[#D92D20] shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Payment Method Selector */}
              {paymentConfig?.onlinePaymentEnabled && paymentConfig?.offlinePaymentEnabled && (
                <div>
                  <label className="block text-[12px] font-semibold text-[#344054] mb-1.5">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleMethodChange('OFFLINE_QR')}
                      className={`rounded-[8px] border p-2.5 sm:p-3 text-left transition-all ${
                        topupMethod === 'OFFLINE_QR'
                          ? 'border-[#C98219] bg-[#FEF7E6] text-[#8F5A0D] shadow-xs ring-1 ring-[#C98219]'
                          : 'border-[#E6EAF0] bg-white text-[#667085] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-[13px]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#C98219]" />
                        <span>UPI / QR Code</span>
                      </div>
                      <p className="text-[11px] mt-0.5 text-[#667085]">Scan QR & upload payment receipt</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMethodChange('ONLINE')}
                      className={`rounded-[8px] border p-2.5 sm:p-3 text-left transition-all ${
                        topupMethod === 'ONLINE'
                          ? 'border-[#175CD3] bg-[#EFF8FF] text-[#175CD3] shadow-xs ring-1 ring-[#175CD3]'
                          : 'border-[#E6EAF0] bg-white text-[#667085] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-[13px]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#175CD3]" />
                        <span>Online Gateway</span>
                      </div>
                      <p className="text-[11px] mt-0.5 text-[#667085]">
                        {paymentConfig.onlineGatewayProvider || 'Instant PG'} (Automated Verification)
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Amount Selection Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#344054] mb-1.5">
                    Select Pre-Set Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[500, 1000, 2000, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setTopupAmount(amt);
                          setFormError(null);
                        }}
                        className={`rounded-[7px] border py-1.5 sm:py-2 text-[12.5px] font-bold tabular-nums transition-colors ${
                          topupAmount === amt
                            ? 'border-[#C98219] bg-[#FDF7ED] text-[#7A4A12] ring-1 ring-[#C98219]'
                            : 'border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#344054] mb-1.5">
                    Custom Top-up Amount (INR)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={topupAmount}
                    onChange={(e) => {
                      setTopupAmount(Number(e.target.value));
                      setFormError(null);
                    }}
                    className="w-full px-3.5 py-1.5 sm:py-2 text-[13px] font-bold tabular-nums rounded-[7px] border border-[#D0D5DD] focus:border-[#C98219] focus:outline-none"
                  />
                </div>
              </div>

              {/* OFFLINE QR CODE & RECEIPT UPLOAD SECTION: 2-COLUMN BALANCED GRID */}
              {topupMethod === 'OFFLINE_QR' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {/* Left Column: QR Code & Balance Projection */}
                  <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6]/70 p-3.5 flex flex-col justify-between space-y-3">
                    {/* QR Details */}
                    <div className="flex items-center gap-3 bg-white rounded-[8px] p-2.5 border border-[#E8D5B7]">
                      {paymentConfig?.offlineQrImageUrl ? (
                        <img
                          src={paymentConfig.offlineQrImageUrl}
                          alt="Payment QR"
                          className="h-20 w-20 object-contain rounded-[6px] border border-[#E6EAF0] bg-white p-1 shrink-0"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-[6px] bg-[#FDF7ED] border border-[#F9DE9B] flex items-center justify-center text-[#8F5A0D] shrink-0">
                          <CreditCard className="h-7 w-7 text-[#C98219]" />
                        </div>
                      )}

                      <div className="space-y-1 flex-1 min-w-0">
                        <div>
                          <span className="text-[10.5px] text-[#8F5A0D] font-bold block">Official UPI ID:</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono font-bold text-xs text-[#172033] truncate">
                              {paymentConfig?.offlineUpiId || 'pay.ticketassist@okaxis'}
                            </span>
                            <button
                              type="button"
                              onClick={copyUpi}
                              className="rounded px-2 py-0.5 text-[10.5px] font-bold text-[#8F5A0D] bg-[#FEF7E6] border border-[#F9DE9B] hover:bg-[#FDF7ED] shrink-0 transition-colors"
                            >
                              {copiedUpi ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        <p className="text-[10.5px] text-[#667085] leading-tight truncate">
                          Account: <span className="font-semibold text-[#344054]">{paymentConfig?.offlineAccountName || 'TicketAssist Services & Network'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Quick Guidance */}
                    <p className="text-[11px] text-[#8F5A0D] leading-relaxed">
                      Scan the QR using GPay, PhonePe, Paytm, or BHIM, complete the payment, then enter the UTR and upload the receipt on the right.
                    </p>

                    {/* Balance Projection Box */}
                    <div className="rounded-[8px] border border-[#E6EAF0] bg-white p-2.5 text-[11.5px] space-y-1">
                      <div className="flex justify-between text-[#667085]">
                        <span>Current Available Balance:</span>
                        <span className="font-semibold text-[#172033] tabular-nums">
                          {wallet ? formatINR(wallet.availableBalance) : '₹0'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#172033] font-bold border-t border-[#EEF2F6] pt-1">
                        <span>Balance After Top-up:</span>
                        <span className="text-[#198754] tabular-nums">
                          {formatINR((Number(wallet?.availableBalance) || 0) + topupAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: UTR Reference & Receipt Upload */}
                  <div className="rounded-[10px] border border-[#E6EAF0] bg-[#F8FAFC] p-3.5 flex flex-col justify-between space-y-3">
                    {/* UPI / UTR Reference Number Field (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11.5px] font-bold text-[#172033]">
                          UPI / UTR Transaction Reference Number
                        </label>
                        <span className="text-[10.5px] font-medium text-[#667085]">Optional</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 429381048291 (optional)"
                        value={paymentRef}
                        onChange={(e) => {
                          setPaymentRef(e.target.value);
                          setFormError(null);
                        }}
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs font-mono text-[#172033] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>

                    {/* Receipt Upload Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11.5px] font-bold text-[#344054]">
                          Payment Transaction Receipt <span className="text-[#D92D20]">*</span>
                        </label>
                        <span className="text-[10px] text-[#667085]">JPG, PNG, PDF (Max 5 MB)</span>
                      </div>

                      <input
                        ref={fileInputRef}
                        id="receipt-file-input"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {!receiptFile ? (
                        <div>
                          <label
                            htmlFor="receipt-file-input"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current?.click();
                              }
                            }}
                            className={`flex flex-col items-center justify-center gap-1.5 rounded-[8px] border-2 border-dashed py-3 px-2 cursor-pointer transition-colors ${
                              receiptError
                                ? 'border-[#FDA29B] bg-[#FEF3F2]'
                                : 'border-[#D0D5DD] bg-white hover:bg-[#FDF7ED] hover:border-[#C98219]'
                            }`}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEF7E6] text-[#C98219] shadow-xs border border-[#F9DE9B]">
                              <Upload className="h-4 w-4" />
                            </div>
                            <div className="text-center">
                              <span className="text-[12px] font-bold text-[#C98219]">Click to choose receipt file</span>
                              <span className="text-[10.5px] text-[#667085] block mt-0.5">JPG, JPEG, PNG, or PDF</span>
                            </div>
                          </label>

                          {receiptError && (
                            <p className="mt-1 text-[11px] font-semibold text-[#D92D20] flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>{receiptError}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-[8px] border border-[#E6EAF0] bg-white p-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
                                {receiptFile.type.startsWith('image/') ? (
                                  <Eye className="h-3.5 w-3.5" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-[#172033] truncate">
                                  {receiptFileName}
                                </p>
                                <p className="text-[10.5px] text-[#667085]">
                                  {(receiptFileSize / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-1 rounded-[5px] border border-[#D0D5DD] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#344054] hover:bg-[#F8FAFC] transition-colors"
                              >
                                <RefreshCw className="h-2.5 w-2.5" />
                                <span>Replace</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveReceipt}
                                className="inline-flex items-center gap-1 rounded-[5px] border border-[#FECDCA] bg-[#FEF3F2] px-2 py-0.5 text-[11px] font-semibold text-[#B42318] hover:bg-[#FEE4E2] transition-colors"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          {/* Image preview for supported image types */}
                          {receiptPreview && (
                            <div className="relative rounded-[5px] border border-[#E6EAF0] bg-[#F8FAFC] p-1.5 flex justify-center max-h-[90px] overflow-hidden">
                              <img
                                src={receiptPreview}
                                alt="Receipt Preview"
                                className="max-h-[80px] w-auto object-contain rounded"
                              />
                            </div>
                          )}

                          {/* PDF Document Notice */}
                          {(receiptFile.type === 'application/pdf' || receiptFileName.toLowerCase().endsWith('.pdf')) && (
                            <div className="flex items-center gap-2 rounded-[5px] bg-[#F8FAFC] border border-[#E6EAF0] p-1.5 text-[11px] text-[#475467]">
                              <FileText className="h-3.5 w-3.5 text-[#C98219] shrink-0" />
                              <span className="truncate">PDF receipt attached and ready.</span>
                            </div>
                          )}

                          {receiptError && (
                            <p className="text-[11px] font-semibold text-[#D92D20] flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>{receiptError}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Online Mode: Balance Projection + Notice */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3 text-[12px] space-y-1.5">
                    <div className="flex justify-between text-[#667085]">
                      <span>Current Available Balance:</span>
                      <span className="font-semibold text-[#172033] tabular-nums">
                        {wallet ? formatINR(wallet.availableBalance) : '₹0'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#172033] font-bold border-t border-[#EEF2F6] pt-1.5">
                      <span>Balance After Top-up:</span>
                      <span className="text-[#198754] tabular-nums">
                        {formatINR((Number(wallet?.availableBalance) || 0) + topupAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-[8px] border border-[#BFDBFE] bg-[#EFF8FF] p-3 text-[12px] text-[#175CD3] flex items-center">
                    <span>Automated Gateway: Payment is processed securely via Instant PG and credited to your wallet balance instantly.</span>
                  </div>
                </div>
              )}

              {/* Submit Button & Disclaimer */}
              <div className="pt-1 space-y-1.5">
                <button
                  type="button"
                  disabled={topupLoading || topupAmount < 100}
                  onClick={handleTopup}
                  className="w-full rounded-[8px] bg-[#C98219] py-2.5 text-xs sm:text-[13.5px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {topupLoading ? (
                    'Processing...'
                  ) : topupMethod === 'OFFLINE_QR' ? (
                    `Submit & Add ${formatINR(topupAmount)}`
                  ) : (
                    `Pay ${formatINR(topupAmount)} via Gateway`
                  )}
                </button>
                {topupMethod === 'OFFLINE_QR' && (
                  <p className="text-[11px] text-[#8F5A0D] text-center italic">
                    * Top-up will be credited to available balance once the uploaded payment receipt is verified.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
