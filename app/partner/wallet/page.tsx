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
  ArrowUpRight,
  ArrowDownLeft,
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
  ExternalLink,
  CirclePlus,
  ArrowRight,
  Sparkles,
  ArrowRightLeft,
  Building2,
  Users,
  Send,
  ChevronRight,
  History,
} from 'lucide-react';

export default function PartnerWalletPage() {
  const [mounted, setMounted] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Top-up Modal states
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(1000);
  const [topupMethod, setTopupMethod] = useState<'ONLINE' | 'OFFLINE_QR'>('OFFLINE_QR');
  const [paymentRef, setPaymentRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Share Wallet Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetType, setShareTargetType] = useState<'DISTRIBUTOR' | 'CENTRE'>('DISTRIBUTOR');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [shareAmount, setShareAmount] = useState<number>(1000);
  const [shareNotes, setShareNotes] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

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

  // Receipt Lightbox Viewer states
  const [viewingReceipt, setViewingReceipt] = useState<{
    url: string;
    fileName?: string;
    reference?: string;
    amount?: number;
    date?: string;
    status?: string;
  } | null>(null);

  // Transactions Filter
  const [transactionTab, setTransactionTab] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    Promise.all([
      api.getWallet().catch(() => null),
      api.getTransactions(1, 100).catch(() => ({ transactions: [] })),
      api.getPublicPaymentConfig().catch(() => null),
      api.getPartnerNetworkRecipients().catch(() => ({ distributors: [], centres: [] })),
    ])
      .then(([wData, tData, pCfg, recData]) => {
        if (wData) setWallet(wData);
        if (tData?.transactions) setTransactions(tData.transactions);
        if (recData?.distributors) {
          setDistributors(recData.distributors);
          if (recData.distributors.length > 0 && !selectedTargetId) {
            setSelectedTargetId(recData.distributors[0].id);
          }
        }
        if (recData?.centres) {
          setCentres(recData.centres);
        }
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
        console.error('Failed to load partner wallet data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const handleShareWallet = async () => {
    setShareError(null);
    setShareSuccess(null);

    if (!selectedTargetId) {
      setShareError(`Please select a destination ${shareTargetType === 'DISTRIBUTOR' ? 'distributor' : 'centre'} from your network.`);
      return;
    }

    if (!shareAmount || shareAmount <= 0) {
      setShareError('Please enter a valid transfer amount greater than ₹ 0.');
      return;
    }

    const available = Number(wallet?.availableBalance || 0);
    if (shareAmount > available) {
      setShareError(`Insufficient balance: Available balance is ₹ ${available.toFixed(2)}, cannot transfer ₹ ${shareAmount.toFixed(2)}.`);
      return;
    }

    setShareLoading(true);
    try {
      const res: any = await api.sharePartnerWallet({
        targetType: shareTargetType,
        targetId: selectedTargetId,
        amount: shareAmount,
        notes: shareNotes.trim() || undefined,
      });

      setShareSuccess(res.message || `Successfully transferred ₹ ${shareAmount} to ${shareTargetType.toLowerCase()}!`);
      loadData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wallet-refresh'));
      }
      setTimeout(() => {
        setIsShareModalOpen(false);
        setShareSuccess(null);
        setShareNotes('');
      }, 1800);
    } catch (err: any) {
      setShareError(err.message || 'Failed to complete wallet transfer. Please try again.');
    } finally {
      setShareLoading(false);
    }
  };

  const onlineEnabled = paymentConfig ? paymentConfig.onlinePaymentEnabled !== false : true;
  const offlineEnabled = paymentConfig ? paymentConfig.offlinePaymentEnabled !== false : true;
  const anyPaymentEnabled = onlineEnabled || offlineEnabled;

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

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPreview(reader.result as string);
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setReceiptError(null);

    if (topupAmount < 100) {
      setFormError('Minimum top-up amount is ₹ 100.');
      return;
    }

    if (topupMethod === 'OFFLINE_QR') {
      if (!receiptFile || !receiptUrl) {
        setReceiptError('Please upload your UPI payment screenshot / receipt before submitting.');
        return;
      }
    }

    setTopupLoading(true);

    try {
      const fallbackRef = `UPI-${Date.now().toString().slice(-8)}`;
      const ref = paymentRef.trim() || fallbackRef;

      const res: any = await api.topupWallet(topupAmount, ref, {
        paymentMethod: topupMethod,
        receiptUrl: receiptUrl || undefined,
        receiptFileName: receiptFileName || undefined,
        receiptFileSize: receiptFileSize || undefined,
      });

      const confirmedData = {
        amount: topupAmount,
        reference: res?.reference || ref,
        method: topupMethod,
        receiptUrl: receiptUrl,
        fileName: receiptFileName,
        status: res?.status || 'PENDING',
        date: new Date().toISOString(),
      };

      setIsTopupModalOpen(false);
      setConfirmedTopup(confirmedData);

      setPaymentRef('');
      handleRemoveReceipt();
      setTopupAmount(1000);

      loadData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wallet-refresh'));
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit top-up request. Please try again.');
    } finally {
      setTopupLoading(false);
    }
  };

  const copyUpiId = () => {
    const upi = paymentConfig?.offlineUpiId || 'pay.sevatn@okaxis';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upi);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    const isCredit = Number(tx.amount) > 0;
    if (transactionTab === 'CREDIT' && !isCredit) return false;
    if (transactionTab === 'DEBIT' && isCredit) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const ref = (tx.reference || '').toLowerCase();
      const notes = (tx.metadata?.notes || '').toLowerCase();
      const cName = (tx.metadata?.centreName || tx.metadata?.distributorName || '').toLowerCase();
      return ref.includes(q) || notes.includes(q) || cName.includes(q);
    }

    return true;
  });

  if (loading) {
    return <LoadingSkeleton count={6} />;
  }

  const availableBalance = Number(wallet?.availableBalance || 0);
  const reservedBalance = Number(wallet?.reservedBalance || 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E6EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#172033]">Partner Wallet &amp; Treasury</h1>
            <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-xs font-bold text-[#8F5A0D] border border-[#F9DE9B]">
              Network Treasury
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Prepaid working balance, distributor &amp; centre wallet allocation, and top-up transactions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Share Wallet Button */}
          <button
            onClick={() => {
              setIsShareModalOpen(true);
              setShareError(null);
              setShareSuccess(null);
            }}
            className="inline-flex items-center gap-2 rounded-[8px] bg-white border border-[#175CD3] text-[#175CD3] hover:bg-[#EFF8FF] px-3.5 py-2 text-xs font-bold shadow-subtle transition-all cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-[#175CD3]" />
            <span>Share Wallet</span>
          </button>

          {/* Top Up Wallet Button */}
          <button
            onClick={() => {
              setIsTopupModalOpen(true);
              setFormError(null);
              setReceiptError(null);
            }}
            className="inline-flex items-center gap-2 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] px-4 py-2 text-xs font-bold text-white shadow-subtle transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Top Up Wallet</span>
          </button>

          {/* Refresh Balance */}
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            title="Refresh Balance"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#667085]" />
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Working Available Balance</span>
            <span className="rounded-full bg-[#EAF7EE] px-2 py-0.5 text-[10.5px] font-bold text-[#198754]">
              Active
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#172033] tabular-nums">
            {formatINR(availableBalance)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#667085]">
            <span>Ready for allocation &amp; transfers</span>
            <button
              onClick={() => setIsTopupModalOpen(true)}
              className="font-bold text-[#C98219] hover:underline cursor-pointer"
            >
              + Top Up
            </button>
          </div>
        </div>

        {/* Reserved Holds */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <span className="text-xs font-semibold text-[#667085]">Reserved Holds</span>
          <p className="mt-2 text-2xl font-black text-[#667085] tabular-nums">
            {formatINR(reservedBalance)}
          </p>
          <span className="text-[11px] text-[#667085] mt-2 block">
            Automatic release on completion
          </span>
        </div>

        {/* Network Distributors */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Network Distributors</span>
            <Users className="h-4 w-4 text-[#175CD3]" />
          </div>
          <p className="mt-2 text-2xl font-black text-[#172033] tabular-nums">
            {distributors.length}
          </p>
          <span className="text-[11px] text-[#667085] mt-2 block">
            Subordinate regional distributors
          </span>
        </div>

        {/* Network Centres */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Network Centres</span>
            <Building2 className="h-4 w-4 text-[#C98219]" />
          </div>
          <p className="mt-2 text-2xl font-black text-[#172033] tabular-nums">
            {centres.length}
          </p>
          <span className="text-[11px] text-[#667085] mt-2 block">
            Active booking &amp; CSC centres
          </span>
        </div>
      </div>

      {/* Network Treasury Allocation Banner */}
      <div className="rounded-[10px] border border-[#B2DDFF] bg-gradient-to-r from-[#EFF8FF] to-[#F8FAFC] p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-white text-[#175CD3] border border-[#B2DDFF] shadow-sm shrink-0">
            <Sparkles className="h-6 w-6 text-[#175CD3]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#175CD3]">Partner Treasury &amp; Network Liquidity</h3>
            <p className="text-xs text-[#475467] mt-0.5">
              Keep your partner wallet loaded to instantly distribute booking funds to your network distributors and centres without delay.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setIsShareModalOpen(true);
              setShareError(null);
              setShareSuccess(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-[7px] bg-[#175CD3] hover:bg-[#154EB5] px-4 py-2 text-xs font-bold text-white shadow-subtle transition-all cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share to Network</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions Ledger Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        {/* Table Header with Tabs & Search */}
        <div className="p-4 border-b border-[#E6EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setTransactionTab('ALL')}
              className={`px-3 py-1.5 rounded-[7px] text-xs font-bold transition-colors ${
                transactionTab === 'ALL'
                  ? 'bg-[#172033] text-white'
                  : 'bg-[#F2F4F7] text-[#475467] hover:bg-[#E4E7EC]'
              }`}
            >
              All Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setTransactionTab('CREDIT')}
              className={`px-3 py-1.5 rounded-[7px] text-xs font-bold transition-colors ${
                transactionTab === 'CREDIT'
                  ? 'bg-[#198754] text-white'
                  : 'bg-[#F2F4F7] text-[#475467] hover:bg-[#E4E7EC]'
              }`}
            >
              Top-Ups / Credits
            </button>
            <button
              onClick={() => setTransactionTab('DEBIT')}
              className={`px-3 py-1.5 rounded-[7px] text-xs font-bold transition-colors ${
                transactionTab === 'DEBIT'
                  ? 'bg-[#C2413B] text-white'
                  : 'bg-[#F2F4F7] text-[#475467] hover:bg-[#E4E7EC]'
              }`}
            >
              Shared / Debits
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by ref or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-[7px] border border-[#D0D5DD] px-3 py-1.5 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none focus:ring-1 focus:ring-[#C98219] w-full sm:w-56"
            />
          </div>
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">
            No wallet transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E6EAF0] bg-[#F8FAFC] text-[11px] font-bold text-[#475467]">
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Type / Description</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0]">
                {filteredTransactions.map((tx) => {
                  const isCredit = Number(tx.amount) > 0;
                  const isSharedOut = tx.metadata?.kind === 'WALLET_SHARE_OUT';
                  const receiptImg = tx.metadata?.receiptUrl || tx.metadata?.screenshotUrl;

                  return (
                    <tr key={tx.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-[#475467]">
                        <span className="font-medium text-[#172033] block">
                          {formatDate(tx.createdAt)}
                        </span>
                        <span className="text-[10px] text-[#667085]">
                          {formatTime(tx.createdAt)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-[6px] shrink-0 ${
                              isCredit
                                ? 'bg-[#EAF7EE] text-[#198754]'
                                : isSharedOut
                                ? 'bg-[#EFF8FF] text-[#175CD3]'
                                : 'bg-[#FDECEC] text-[#C2413B]'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            ) : isSharedOut ? (
                              <Send className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-[#172033] block">
                              {isSharedOut
                                ? `Shared to ${tx.metadata?.distributorName || tx.metadata?.centreName || 'Network'}`
                                : tx.type}
                            </span>
                            <span className="text-[10px] text-[#667085] line-clamp-1">
                              {tx.metadata?.notes || (isCredit ? 'Wallet Top-Up' : 'Wallet Debit')}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#475467] whitespace-nowrap">
                        {tx.reference || 'N/A'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`rounded-[5px] px-2 py-0.5 text-[10px] font-bold ${
                            tx.status === 'COMPLETED'
                              ? 'bg-[#EAF7EE] text-[#198754]'
                              : tx.status === 'PENDING'
                              ? 'bg-[#FEF7E6] text-[#8F5A0D]'
                              : 'bg-[#FDECEC] text-[#C2413B]'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-bold tabular-nums text-sm ${
                            isCredit ? 'text-[#198754]' : 'text-[#172033]'
                          }`}
                        >
                          {isCredit ? '+' : ''}
                          {formatINR(Number(tx.amount))}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {receiptImg ? (
                          <button
                            type="button"
                            onClick={() =>
                              setViewingReceipt({
                                url: receiptImg,
                                reference: tx.reference,
                                amount: Number(tx.amount),
                                date: tx.createdAt,
                                status: tx.status,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#175CD3] hover:underline"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </button>
                        ) : (
                          <span className="text-[10.5px] text-[#98A2B3]">—</span>
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

      {/* TOP-UP MODAL (Portal) */}
      {isTopupModalOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#101828]/70 backdrop-blur-[2px] p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTopupModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-4xl lg:max-w-[920px] rounded-[12px] bg-white shadow-elevated border border-[#E6EAF0] overflow-hidden my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E6EAF0] bg-[#FCFCFD]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">Top Up Partner Wallet</h3>
                  <p className="text-[11px] text-[#667085]">Instant balance recharge with payment screenshot upload &amp; verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTopupModalOpen(false)}
                className="rounded-full p-1 text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body - 2-Column Side-by-Side Single View */}
            <form onSubmit={handleTopup} className="p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* LEFT COLUMN: Payment Method & QR Display */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#344054] uppercase tracking-wider mb-1.5">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleMethodChange('OFFLINE_QR')}
                        disabled={!offlineEnabled}
                        className={`flex items-center gap-2 rounded-[7px] border p-2 text-left transition-all ${
                          topupMethod === 'OFFLINE_QR'
                            ? 'border-[#C98219] bg-[#FEF7E6] shadow-xs'
                            : 'border-[#E6EAF0] bg-white hover:bg-[#F8FAFC]'
                        } ${!offlineEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <QrCode className="h-4 w-4 text-[#C98219] shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[#172033]">UPI / QR Code</p>
                          <p className="text-[10px] text-[#667085]">Zero fee • Proof upload</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMethodChange('ONLINE')}
                        disabled={!onlineEnabled}
                        className={`flex items-center gap-2 rounded-[7px] border p-2 text-left transition-all ${
                          topupMethod === 'ONLINE'
                            ? 'border-[#C98219] bg-[#FEF7E6] shadow-xs'
                            : 'border-[#E6EAF0] bg-white hover:bg-[#F8FAFC]'
                        } ${!onlineEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <CreditCard className="h-4 w-4 text-[#667085] shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[#172033]">Online Gateway</p>
                          <p className="text-[10px] text-[#667085]">Instant credit</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* QR Box */}
                  {topupMethod === 'OFFLINE_QR' && (
                    <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3 text-center space-y-2">
                      <span className="text-[11px] font-semibold text-[#475467]">
                        Scan &amp; Pay via Any UPI App (GPay / PhonePe / Paytm / BHIM)
                      </span>

                      <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-[8px] border border-[#D0D5DD] bg-white p-1.5 shadow-sm overflow-hidden">
                        {paymentConfig?.offlineQrImageUrl || paymentConfig?.offlineQrCodeUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={paymentConfig.offlineQrImageUrl || paymentConfig.offlineQrCodeUrl}
                            alt="Offline UPI QR Code"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center text-[#667085]">
                            <QrCode className="h-10 w-10 text-[#C98219] mb-1" />
                            <span className="text-[10px] font-mono font-bold text-[#172033] break-all">
                              {paymentConfig?.offlineUpiId || 'pay.sevatn@okaxis'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        {paymentConfig?.offlineAccountName && (
                          <p className="text-[11px] font-bold text-[#172033] mb-1">
                            Account: <span className="text-[#C98219]">{paymentConfig.offlineAccountName}</span>
                          </p>
                        )}
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="rounded bg-white px-2 py-1 text-xs font-mono font-bold text-[#172033] border border-[#D0D5DD]">
                            {paymentConfig?.offlineUpiId || 'pay.sevatn@okaxis'}
                          </span>
                          <button
                            type="button"
                            onClick={copyUpiId}
                            className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-semibold text-[#172033] border border-[#D0D5DD] hover:bg-[#F2F4F7]"
                          >
                            {copiedUpi ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-[#198754]" />
                                <span className="text-[#198754] text-[11px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Amount, UTR, Screenshot */}
                <div className="space-y-3">
                  {/* Top-up Amount */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#344054] uppercase tracking-wider mb-1">
                      Top-Up Amount (Chips) <span className="text-[#C2413B]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#667085]">₹</span>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full rounded-[7px] border border-[#D0D5DD] pl-8 pr-3 py-1.5 text-sm font-bold text-[#172033] focus:border-[#C98219] focus:outline-none focus:ring-1 focus:ring-[#C98219]"
                        placeholder="1000"
                      />
                    </div>
                    {/* Amount Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {[500, 1000, 2000, 5000, 10000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTopupAmount(amt)}
                          className={`px-2 py-0.5 text-xs rounded-[5px] border font-semibold transition-all ${
                            topupAmount === amt
                              ? 'border-[#C98219] bg-[#FEF7E6] text-[#8F5A0D] font-bold'
                              : 'border-[#E6EAF0] bg-white text-[#475467] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          +{formatINR(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {topupMethod === 'OFFLINE_QR' && (
                    <>
                      {/* 12-Digit UTR Number (Optional) */}
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[11px] font-bold text-[#344054] uppercase tracking-wider">
                            12-Digit UPI Ref / UTR Number <span className="text-[10px] font-normal text-[#667085] lowercase">(optional)</span>
                          </label>
                          <span className="text-[10px] text-[#667085]">From UPI app</span>
                        </div>
                        <input
                          type="text"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          placeholder="e.g. 432109876543 (optional)"
                          className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-1.5 text-xs font-mono text-[#172033] focus:border-[#C98219] focus:outline-none focus:ring-1 focus:ring-[#C98219]"
                        />
                      </div>

                      {/* Screenshot Upload */}
                      <div>
                        <label className="block text-[11px] font-bold text-[#344054] uppercase tracking-wider mb-1">
                          Payment Screenshot / Receipt <span className="text-[#C2413B]">*</span>
                        </label>

                        {!receiptFile ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-[#D0D5DD] hover:border-[#C98219] rounded-[7px] p-2.5 text-center cursor-pointer bg-[#F8FAFC] transition-colors"
                          >
                            <Upload className="h-5 w-5 text-[#98A2B3] mx-auto mb-1" />
                            <p className="text-xs font-semibold text-[#172033]">
                              Click to upload payment screenshot
                            </p>
                            <p className="text-[10px] text-[#667085]">JPG, PNG, or PDF (Max 5 MB)</p>
                          </div>
                        ) : (
                          <div className="rounded-[7px] border border-[#B2DDFF] bg-[#EFF8FF] p-2 flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              {receiptPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={receiptPreview}
                                  alt="Receipt Preview"
                                  className="h-8 w-8 rounded object-cover border border-[#B2DDFF] shrink-0"
                                />
                              ) : (
                                <FileText className="h-7 w-7 text-[#175CD3] shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#172033] truncate">{receiptFileName}</p>
                                <p className="text-[9.5px] text-[#667085]">
                                  {(receiptFileSize / 1024).toFixed(1)} KB • Ready to submit
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveReceipt}
                              className="p-1 rounded text-[#C2413B] hover:bg-[#FDECEC]"
                              title="Remove file"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />

                        {receiptError && (
                          <p className="text-[10.5px] text-[#C2413B] font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{receiptError}</span>
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Form Error */}
                  {formError && (
                    <div className="rounded-[7px] bg-[#FDECEC] border border-[#F8C4C2] p-2 text-[11.5px] text-[#C2413B] flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="leading-tight">{formError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-[#E6EAF0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTopupModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#667085] hover:text-[#172033]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topupLoading || !anyPaymentEnabled}
                  className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#C98219] hover:bg-[#B57414] px-5 py-2 text-xs font-bold text-white shadow-subtle transition-all disabled:opacity-50"
                >
                  {topupLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Top-Up Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* SHARE WALLET MODAL (Portal) */}
      {isShareModalOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#101828]/70 backdrop-blur-[2px] p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsShareModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg rounded-[12px] bg-white p-5 sm:p-6 shadow-elevated border border-[#E6EAF0] my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Share Partner Wallet</h3>
                  <p className="text-xs text-[#667085]">
                    Transfer funds directly to your network Distributors or Centres
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-full p-1 text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 pt-3">
              {/* Available Balance Notice */}
              <div className="rounded-[8px] bg-[#FEF7E6] border border-[#F9DE9B] p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[#C98219]" />
                  <span className="text-xs font-semibold text-[#8F5A0D]">Your Available Balance:</span>
                </div>
                <span className="text-sm font-black text-[#8F5A0D] tabular-nums">
                  {formatINR(availableBalance)}
                </span>
              </div>

              {/* Target Type Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Select Recipient Type <span className="text-[#C2413B]">*</span>
                </label>
                <div className="flex rounded-[8px] bg-[#F2F4F7] p-1 border border-[#E4E7EC]">
                  <button
                    type="button"
                    onClick={() => {
                      setShareTargetType('DISTRIBUTOR');
                      setSelectedTargetId(distributors[0]?.id || '');
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-[6px] transition-all flex items-center justify-center gap-1.5 ${
                      shareTargetType === 'DISTRIBUTOR'
                        ? 'bg-white text-[#175CD3] shadow-xs'
                        : 'text-[#667085] hover:text-[#172033]'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Distributors ({distributors.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShareTargetType('CENTRE');
                      setSelectedTargetId(centres[0]?.id || '');
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-[6px] transition-all flex items-center justify-center gap-1.5 ${
                      shareTargetType === 'CENTRE'
                        ? 'bg-white text-[#175CD3] shadow-xs'
                        : 'text-[#667085] hover:text-[#172033]'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Centres ({centres.length})</span>
                  </button>
                </div>
              </div>

              {/* Target Recipient Dropdown */}
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Choose Destination {shareTargetType === 'DISTRIBUTOR' ? 'Distributor' : 'Centre'} <span className="text-[#C2413B]">*</span>
                </label>
                {shareTargetType === 'DISTRIBUTOR' ? (
                  distributors.length === 0 ? (
                    <div className="rounded-[8px] border border-[#D0D5DD] bg-[#F8FAFC] p-3 text-xs text-[#667085] text-center">
                      No network distributors registered under your partner franchise yet.
                    </div>
                  ) : (
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="w-full rounded-[8px] border border-[#D0D5DD] px-3 py-2 text-xs font-bold text-[#172033] bg-white focus:border-[#175CD3] focus:outline-none focus:ring-1 focus:ring-[#175CD3]"
                    >
                      <option value="">-- Choose a Distributor --</option>
                      {distributors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.distributorCode}) • {d.district || 'TN'} — Current: ₹ {Number(d.availableBalance || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  centres.length === 0 ? (
                    <div className="rounded-[8px] border border-[#D0D5DD] bg-[#F8FAFC] p-3 text-xs text-[#667085] text-center">
                      No network centres registered under your partner franchise yet.
                    </div>
                  ) : (
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="w-full rounded-[8px] border border-[#D0D5DD] px-3 py-2 text-xs font-bold text-[#172033] bg-white focus:border-[#175CD3] focus:outline-none focus:ring-1 focus:ring-[#175CD3]"
                    >
                      <option value="">-- Choose a Centre --</option>
                      {centres.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.centreName} ({c.centreCode || 'CSC'}) • {c.district || 'TN'}{c.distributorName ? ` [via ${c.distributorName}]` : ''} — Current: ₹ {Number(c.availableBalance || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  )
                )}
              </div>

              {/* Transfer Amount */}
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Transfer Amount (Chips) <span className="text-[#C2413B]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#667085]">₹</span>
                  <input
                    type="number"
                    min="10"
                    step="50"
                    value={shareAmount}
                    onChange={(e) => setShareAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full rounded-[8px] border border-[#D0D5DD] pl-8 pr-3 py-2 text-sm font-bold text-[#172033] focus:border-[#175CD3] focus:outline-none focus:ring-1 focus:ring-[#175CD3]"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[500, 1000, 2000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setShareAmount(amt)}
                      className={`px-2.5 py-1 text-xs rounded-[6px] border font-semibold transition-all ${
                        shareAmount === amt
                          ? 'border-[#175CD3] bg-[#EFF8FF] text-[#175CD3] font-bold'
                          : 'border-[#E6EAF0] bg-white text-[#475467] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      +{formatINR(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / Reason */}
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Notes / Remarks <span className="text-[10.5px] font-normal text-[#667085]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={shareNotes}
                  onChange={(e) => setShareNotes(e.target.value)}
                  placeholder="e.g. Weekly booking advance, Treasury liquidity allocation"
                  className="w-full rounded-[8px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] focus:border-[#175CD3] focus:outline-none focus:ring-1 focus:ring-[#175CD3]"
                />
              </div>

              {/* Balance Projection Preview */}
              {selectedTargetId && shareAmount > 0 && (
                <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[#475467]">
                    <span>Your Balance After Transfer:</span>
                    <span className={`font-mono font-bold ${availableBalance - shareAmount < 0 ? 'text-[#C2413B]' : 'text-[#172033]'}`}>
                      {formatINR(availableBalance - shareAmount)}
                    </span>
                  </div>
                  {availableBalance - shareAmount < 0 && (
                    <p className="text-[11px] text-[#C2413B] font-medium flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Insufficient balance! Top up your wallet before transferring.
                    </p>
                  )}
                </div>
              )}

              {/* Error Banner */}
              {shareError && (
                <div className="rounded-[8px] bg-[#FDECEC] border border-[#F8C4C2] p-2.5 text-xs text-[#C2413B] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{shareError}</span>
                </div>
              )}

              {/* Success Banner */}
              {shareSuccess && (
                <div className="rounded-[8px] bg-[#EAF7EE] border border-[#C3E6CB] p-2.5 text-xs text-[#198754] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{shareSuccess}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E6EAF0]">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#667085] hover:text-[#172033]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleShareWallet}
                  disabled={
                    shareLoading ||
                    !selectedTargetId ||
                    shareAmount <= 0 ||
                    shareAmount > availableBalance
                  }
                  className="inline-flex items-center gap-2 rounded-[8px] bg-[#175CD3] hover:bg-[#154EB5] px-5 py-2 text-xs font-bold text-white shadow-subtle transition-all disabled:opacity-50 cursor-pointer"
                >
                  {shareLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Confirm Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* CONFIRMED TOP-UP MODAL (Portal) */}
      {confirmedTopup && mounted && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#101828]/75 backdrop-blur-[3px] p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmedTopup(null);
          }}
        >
          <div className="relative w-full max-w-lg rounded-[12px] bg-white p-5 sm:p-6 shadow-elevated border border-[#E6EAF0] my-auto">
            <div className="text-center pb-4 border-b border-[#E6EAF0]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF7EE] text-[#198754] border border-[#C3E6CB] mb-2.5">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#172033]">
                {confirmedTopup.status === 'COMPLETED' ? 'Top-Up Credited Successfully!' : 'Top-Up Request Submitted!'}
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                {confirmedTopup.status === 'COMPLETED'
                  ? 'Your partner wallet balance has been updated immediately.'
                  : 'Your payment screenshot has been uploaded and submitted for administrator verification.'}
              </p>
            </div>

            <div className="my-4 rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#667085]">Top-Up Amount:</span>
                <span className="font-bold text-base text-[#198754] tabular-nums">
                  {formatINR(confirmedTopup.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085]">Reference ID:</span>
                <span className="font-mono font-bold text-[#172033]">{confirmedTopup.reference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085]">Payment Method:</span>
                <span className="font-semibold text-[#172033]">
                  {confirmedTopup.method === 'OFFLINE_QR' ? 'Offline UPI / Direct QR' : 'Online Gateway'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085]">Submission Status:</span>
                <span className="rounded-[4px] bg-[#FEF7E6] px-2 py-0.5 font-bold text-[#8F5A0D]">
                  {confirmedTopup.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setConfirmedTopup(null)}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-[8px] bg-[#C98219] hover:bg-[#B57414] px-5 py-2 text-xs font-bold text-white shadow-subtle transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* RECEIPT LIGHTBOX VIEWER (Portal) */}
      {viewingReceipt && mounted && createPortal(
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-[#101828]/80 backdrop-blur-[3px] p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingReceipt(null);
          }}
        >
          <div className="relative w-full max-w-xl rounded-[12px] bg-white p-5 shadow-elevated border border-[#E6EAF0] my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#175CD3]" />
                <h3 className="text-sm font-bold text-[#172033]">Payment Screenshot Verification</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="rounded-full p-1 text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 max-h-[70vh] overflow-auto rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-center p-2">
              {viewingReceipt.url.startsWith('data:application/pdf') || viewingReceipt.url.endsWith('.pdf') ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-[#175CD3] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#172033]">PDF Receipt Document</p>
                  <a
                    href={viewingReceipt.url}
                    download="payment-receipt.pdf"
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-[7px] bg-[#175CD3] text-white text-xs font-bold hover:bg-[#154EB5]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewingReceipt.url}
                  alt="Receipt Preview"
                  className="max-h-[60vh] w-auto object-contain rounded"
                />
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#667085]">
              <span>Ref: <strong className="text-[#172033] font-mono">{viewingReceipt.reference || 'N/A'}</strong></span>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-1.5 rounded-[7px] bg-[#F2F4F7] text-[#344054] font-semibold hover:bg-[#E4E7EC]"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
