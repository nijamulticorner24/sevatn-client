'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import {
  Users,
  PlusCircle,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  MapPin,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  DollarSign,
  ArrowRight,
  Eye,
  Download,
  X,
  Edit3,
  Coins,
  Percent,
  Save,
  Trash2,
  KeyRound,
  Wallet,
  Phone,
  Mail,
  LayoutGrid,
  List,
  Plus,
  Minus,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from 'lucide-react';

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [systemServiceFee, setSystemServiceFee] = useState(100);
  const [systemBaseTicketPrice, setSystemBaseTicketPrice] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'PENDING_PAYMENT' | 'SUSPENDED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Wallet Adjustment Modal State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTargetPartner, setWalletTargetPartner] = useState<any>(null);
  const [walletAdjustAction, setWalletAdjustAction] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [walletAdjustAmount, setWalletAdjustAmount] = useState<string>('500');
  const [walletAdjustReason, setWalletAdjustReason] = useState<string>('');
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<{
    partnerName: string;
    partnerCode: string;
    paymentReference: string;
    imageUrl: string;
  } | null>(null);

  // Form State (Create)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [district, setDistrict] = useState('Chennai');
  const [taluk, setTaluk] = useState('Guindy');
  const [baseTicketPrice, setBaseTicketPrice] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State (Edit Partner)
  const [editingPartner, setEditingPartner] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editTaluk, setEditTaluk] = useState('');
  const [editStatus, setEditStatus] = useState<string>('ACTIVE');
  const [editBaseTicketPrice, setEditBaseTicketPrice] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // Reset Password Modal State
  const [partnerForPasswordReset, setPartnerForPasswordReset] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<any | null>(null);

  // Success Created Partner Modal State
  const [createdPartnerData, setCreatedPartnerData] = useState<any | null>(null);

  // Delete Partner State
  const [partnerToDelete, setPartnerToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const user = api.getUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      setIsAuthorized(false);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }
    setIsAuthorized(true);
    setIsSuperAdmin(user.role === 'SUPER_ADMIN');
    loadPartners();
  }, []);

  const loadPartners = () => {
    Promise.all([
      api.getPartners(),
      api.getAdminPricingConfig().catch(() => null),
    ])
      .then(([res, cfg]: any) => {
        setPartners(res.partners || []);
        if (res.systemServiceFee) {
          setSystemServiceFee(Number(res.systemServiceFee));
        }
        if (cfg?.baseTicketPrice) {
          setSystemBaseTicketPrice(Number(cfg.baseTicketPrice));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const formatINR = (val: number | string | undefined | null) => {
    const num = Number(val || 0);
    return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateVal: string | Date | undefined) => {
    if (!dateVal) return 'N/A';
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal).split('T')[0];
    }
  };

  // Wallet Adjustment Actions
  const openWalletAdjustModal = (partner: any) => {
    setWalletTargetPartner(partner);
    setWalletAdjustAction('CREDIT');
    setWalletAdjustAmount('500');
    setWalletAdjustReason('');
    setWalletError(null);
    setIsWalletModalOpen(true);
  };

  const handleWalletAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletTargetPartner) return;
    setWalletError(null);

    const amt = parseFloat(walletAdjustAmount);
    if (isNaN(amt) || amt <= 0) {
      setWalletError('Please enter a valid amount greater than 0.');
      return;
    }

    const currentBalance = Number(
      walletTargetPartner.availableBalance ??
      walletTargetPartner.walletBalance ??
      walletTargetPartner.balance ??
      0
    );

    if (walletAdjustAction === 'DEBIT' && amt > currentBalance) {
      setWalletError(
        `Cannot deduct ₹ ${amt.toFixed(2)}: Exceeds available balance (Current: ₹ ${currentBalance.toFixed(2)}).`
      );
      return;
    }

    setWalletSubmitting(true);
    try {
      const res: any = await api.adjustPartnerWallet(walletTargetPartner.id, {
        amount: amt,
        action: walletAdjustAction,
        reason: walletAdjustReason.trim() || undefined,
      });

      showToast(res.message || `Wallet successfully ${walletAdjustAction === 'CREDIT' ? 'credited' : 'debited'}.`);
      setIsWalletModalOpen(false);
      loadPartners();
    } catch (err: any) {
      setWalletError(err.message || 'Failed to adjust partner wallet balance.');
    } finally {
      setWalletSubmitting(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!partnerToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deletePartner(partnerToDelete.id);
      setPartners((prev) => prev.filter((p) => p.id !== partnerToDelete.id));
      showToast(`Partner ${partnerToDelete.partnerCode} (${partnerToDelete.name}) deleted successfully!`);
      setPartnerToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete partner franchise.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg(null);

    const basePriceNum = baseTicketPrice.trim() !== '' ? parseFloat(baseTicketPrice) : undefined;
    if (basePriceNum !== undefined && (isNaN(basePriceNum) || basePriceNum < 0)) {
      setErrorMsg('Base ticket price must be a valid non-negative number.');
      setCreating(false);
      return;
    }

    try {
      const res = await api.createPartner({
        name,
        email,
        mobile,
        district,
        taluk,
        baseTicketPrice: basePriceNum,
      });

      setShowCreateModal(false);
      setCreatedPartnerData(res);
      setName('');
      setEmail('');
      setMobile('');
      setDistrict('');
      setTaluk('');
      setBaseTicketPrice('');
      loadPartners();
      showToast(`Partner franchise created for ${res.partner?.name || 'Partner'}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create partner');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditModal = (p: any) => {
    setEditingPartner(p);
    setEditName(p.name || '');
    setEditEmail(p.email || '');
    setEditMobile(p.mobile || '');
    setEditDistrict(p.district || '');
    setEditTaluk(p.taluk || '');
    setEditStatus(p.status || 'ACTIVE');
    setEditBaseTicketPrice(
      p.baseTicketPrice !== undefined && p.baseTicketPrice !== null ? p.baseTicketPrice.toString() : ''
    );
    setEditPassword('');
    setEditErrorMsg(null);
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    setSavingEdit(true);
    setEditErrorMsg(null);

    const basePriceNum = editBaseTicketPrice.trim() !== '' ? parseFloat(editBaseTicketPrice) : null;
    if (basePriceNum !== null && (isNaN(basePriceNum) || basePriceNum < 0)) {
      setEditErrorMsg('Base ticket price must be a valid non-negative number.');
      setSavingEdit(false);
      return;
    }

    try {
      await api.updatePartner(editingPartner.id, {
        name: editName,
        email: editEmail,
        mobile: editMobile,
        district: editDistrict,
        taluk: editTaluk,
        status: editStatus,
        baseTicketPrice: basePriceNum,
        password: editPassword.trim() || undefined,
      });

      setEditingPartner(null);
      loadPartners();
      showToast(`✅ Partner ${editName} updated successfully!`);
    } catch (err: any) {
      setEditErrorMsg(err.message || 'Failed to update partner');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForPasswordReset) return;
    setIsResettingPassword(true);
    setResetPasswordError(null);
    setResetPasswordSuccess(null);

    const pwd = newPasswordInput.trim() || `Partner@${partnerForPasswordReset.mobile.slice(-4)}`;
    if (pwd.length < 6) {
      setResetPasswordError('Password must be at least 6 characters long.');
      setIsResettingPassword(false);
      return;
    }

    try {
      const res = await api.resetPartnerPassword(partnerForPasswordReset.id, pwd);
      setResetPasswordSuccess(res);
      showToast(`✅ Password reset for ${partnerForPasswordReset.name}!`);
      loadPartners();
    } catch (err: any) {
      setResetPasswordError(err.message || 'Failed to reset partner password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const copyUrl = (fullUrl: string, identifier: string) => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(identifier);
    setTimeout(() => setCopiedToken(null), 2500);
    showToast('Link copied to clipboard!');
  };

  const getOrigin = () => {
    return typeof window !== 'undefined' ? window.location.origin : '';
  };

  const handleApprovePartner = async (partnerId: string, partnerName: string) => {
    setActionLoadingId(partnerId);
    try {
      await api.approvePartner(partnerId);
      showToast(`✅ Partner ${partnerName} has been approved and activated!`);
      loadPartners();
    } catch (err: any) {
      alert(err.message || 'Failed to approve partner');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGenerateFreshInvitation = async (partnerId: string) => {
    try {
      await api.generatePartnerInvitation(partnerId);
      showToast('Fresh invitation URL generated!');
      loadPartners();
    } catch (err: any) {
      alert(err.message || 'Failed to generate invitation');
    }
  };

  // Filtered partners
  const filteredPartners = partners.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCode = p.partnerCode?.toLowerCase().includes(q);
      const matchEmail = p.email?.toLowerCase().includes(q);
      const matchMobile = p.mobile?.toLowerCase().includes(q);
      const matchDistrict = p.district?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchEmail && !matchMobile && !matchDistrict) return false;
    }
    return true;
  });

  const pendingApprovalCount = partners.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const pendingPaymentCount = partners.filter((p) => p.status === 'PENDING_PAYMENT').length;
  const activeCount = partners.filter((p) => p.status === 'ACTIVE').length;
  const totalNetworkBalance = partners.reduce(
    (sum, p) => sum + Number(p.availableBalance ?? p.walletBalance ?? p.balance ?? 0),
    0
  );

  if (isAuthorized === false) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626]">
          <Ban className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Super Admin Role Required</h1>
        <p className="text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
          Access to Partner Franchise & Wallet Management is restricted to authorized Super Administrators.
        </p>
        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-[7px] bg-[#1D4ED8] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1E40AF] transition-colors shadow-sm"
          >
            <span>Return to Operations Overview</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 rounded-[8px] border border-[#A6F4C5] bg-[#ECFDF3] px-4 py-3 text-xs font-bold text-[#027A48] shadow-modal flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-[#12B76A]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" />
            <span>SevaTN — Partner Franchises</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#172033]">
            Partner Network & Wallets
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Monitor regional partner franchises, manage live wallet balances (Credit / Debit), and oversee network settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => loadPartners()}
            className="rounded-[7px] border border-[#E6EAF0] bg-white px-3 py-2 text-xs font-semibold text-[#475467] hover:bg-[#F8FAFC] shadow-2xs transition-colors flex items-center gap-1.5"
            title="Refresh Partners List"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#C98219]' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-[7px] bg-[#C98219] px-4 py-2 text-xs font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add New Partner</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Partners */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
              Total Partners
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#172033]">{partners.length}</span>
            <span className="text-[11px] text-[#667085]">franchises</span>
          </div>
          <div className="mt-1 text-[11px] text-[#027A48] font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>{activeCount} Active</span>
          </div>
        </div>

        {/* Total Network Wallet Balance */}
        <div className="rounded-[10px] border border-[#B2DDFF] bg-[#F5FAFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#175CD3]">
              Partner Wallets Total
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#175CD3]">
              {formatINR(totalNetworkBalance)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#1E40AF] font-medium">
            Available across all partner wallets
          </div>
        </div>

        {/* Awaiting Payment / Verification */}
        <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FFFDF5] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F5A0D]">
              Awaiting Action
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#8F5A0D]">
              {pendingApprovalCount + pendingPaymentCount}
            </span>
            <span className="text-[11px] text-[#8F5A0D]">franchises</span>
          </div>
          <div className="mt-1 text-[11px] text-[#667085] flex items-center gap-1.5">
            <span className="font-bold text-[#175CD3]">{pendingApprovalCount} to approve</span>
            <span>•</span>
            <span className="font-bold text-[#C98219]">{pendingPaymentCount} fee pending</span>
          </div>
        </div>

        {/* Global Default Rates */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
              Platform Rates
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#F8FAFC] text-[#475467] border border-[#E6EAF0]">
              <Coins className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xs text-[#667085]">Base Ticket Price:</span>
            <span className="text-sm font-black font-mono text-[#172033]">₹ {systemBaseTicketPrice.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between text-[11px]">
            <span className="text-[#667085]">Standard Service Fee:</span>
            <span className="font-bold font-mono text-[#C98219]">₹ {systemServiceFee.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter Tabs, Search & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-[10px] border border-[#E6EAF0]">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-[6px] px-3 py-1.5 font-bold transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-[#172033] text-white'
                : 'bg-[#F8FAFC] text-[#667085] hover:bg-[#E6EAF0]'
            }`}
          >
            All ({partners.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`rounded-[6px] px-3 py-1.5 font-bold transition-colors ${
              statusFilter === 'ACTIVE'
                ? 'bg-[#027A48] text-white'
                : 'bg-[#ECFDF3] text-[#027A48] hover:bg-[#D1FADF]'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING_APPROVAL')}
            className={`rounded-[6px] px-3 py-1.5 font-bold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'PENDING_APPROVAL'
                ? 'bg-[#175CD3] text-white'
                : 'bg-[#EFF8FF] text-[#175CD3] hover:bg-[#D1E9FF]'
            }`}
          >
            <span>Review Proof</span>
            {pendingApprovalCount > 0 && (
              <span className="rounded-full bg-[#2E90FA] text-white px-1.5 py-0.2 text-[10px] font-extrabold">
                {pendingApprovalCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('PENDING_PAYMENT')}
            className={`rounded-[6px] px-3 py-1.5 font-bold transition-colors ${
              statusFilter === 'PENDING_PAYMENT'
                ? 'bg-[#C98219] text-white'
                : 'bg-[#FEF7E6] text-[#8F5A0D] hover:bg-[#FDE8BD]'
            }`}
          >
            Pending Fee ({pendingPaymentCount})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search by name, code, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[6px] border border-[#D0D5DD] bg-white pl-8 pr-3 py-1.5 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
            />
          </div>

          {/* View Mode Toggle: Table vs Cards */}
          <div className="flex items-center rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-[5px] transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-[#172033] shadow-2xs font-bold'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-[5px] transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-[#172033] shadow-2xs font-bold'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Partners Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-[10px] border border-[#E6EAF0]">
          <Loader2 className="h-7 w-7 animate-spin text-[#C98219]" />
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-[10px] border border-[#E6EAF0] p-6 space-y-2">
          <Users className="h-10 w-10 text-[#98A2B3] mx-auto mb-1" />
          <h3 className="text-sm font-bold text-[#172033]">No partners found</h3>
          <p className="text-xs text-[#667085]">
            {searchQuery ? 'Try adjusting your search query.' : 'No partner franchises match the selected filter.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW — Clean, compact, fits without horizontal break */
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] uppercase tracking-wider font-semibold border-b border-[#E6EAF0] text-[11px]">
                <tr>
                  <th className="py-3 px-3.5">Partner Franchise</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Jurisdiction</th>
                  <th className="py-3 px-2.5 text-center">Commission</th>
                  <th className="py-3 px-2.5 text-center">Base Price</th>
                  <th className="py-3 px-3.5 bg-[#F5FAFF]/60 text-[#175CD3] font-bold">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Wallet Balance</span>
                    </div>
                  </th>
                  <th className="py-3 px-2 text-center">Centres</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-center">Created</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0]">
                {filteredPartners.map((p) => {
                  const isPendingPayment = p.status === 'PENDING_PAYMENT';
                  const isPendingApproval = p.status === 'PENDING_APPROVAL';
                  const isActive = p.status === 'ACTIVE';
                  const walletAmt = Number(p.availableBalance ?? p.walletBalance ?? p.balance ?? 0);

                  return (
                    <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* Partner Name & Code */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-[11px] font-mono font-bold text-[#8F5A0D] border border-[#F9DE9B] shrink-0">
                            {p.partnerCode}
                          </span>
                          <div>
                            <div className="font-bold text-[12.5px] text-[#172033] truncate max-w-[170px]" title={p.name}>
                              {p.name}
                            </div>
                            <div className="text-[10.5px] text-[#667085] truncate max-w-[170px]">
                              {p.district ? `${p.district}${p.taluk ? ` (${p.taluk})` : ''}` : 'Regional Partner'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5 text-[11.5px]">
                          {p.mobile && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-[#175CD3] shrink-0" />
                              <a
                                href={`tel:${p.mobile}`}
                                className="font-mono font-bold text-[#172033] hover:text-[#175CD3] hover:underline"
                              >
                                {p.mobile}
                              </a>
                              <button
                                type="button"
                                onClick={() => copyUrl(p.mobile, `mobile-${p.id}`)}
                                className="text-[#98A2B3] hover:text-[#172033] p-0.5"
                                title="Copy Mobile"
                              >
                                {copiedToken === `mobile-${p.id}` ? (
                                  <Check className="h-2.5 w-2.5 text-[#12B76A]" />
                                ) : (
                                  <Copy className="h-2.5 w-2.5" />
                                )}
                              </button>
                            </div>
                          )}
                          {p.email && (
                            <div className="flex items-center gap-1.5 text-[10.5px]">
                              <Mail className="h-2.5 w-2.5 text-[#C98219] shrink-0" />
                              <span className="font-mono text-[#667085] truncate max-w-[140px]" title={p.email}>
                                {p.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Jurisdiction */}
                      <td className="py-3 px-3 text-[#667085] text-[11.5px]">
                        <div className="truncate max-w-[120px]" title={`${p.district || 'Tamil Nadu'} / ${p.taluk || 'HQ'}`}>
                          <span className="font-semibold text-[#172033]">{p.district || 'Tamil Nadu'}</span>
                          {p.taluk && <span className="block text-[10.5px] text-[#667085]">{p.taluk}</span>}
                        </div>
                      </td>

                      {/* Commission */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span className="rounded bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-bold text-[#475467] border border-[#E6EAF0]">
                          {p.commissionPercentage}%
                        </span>
                        <span className="block text-[10px] text-[#667085] mt-0.5">
                          ₹ {Number(p.commissionRate || 20).toFixed(2)}/pass
                        </span>
                      </td>

                      {/* Base Ticket Price */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-[12px] text-[#175CD3]">
                          ₹ {Number(p.baseTicketPrice ?? systemBaseTicketPrice).toFixed(2)}
                        </span>
                        <span className="block text-[9.5px] text-[#667085]">
                          {p.baseTicketPrice ? 'Custom Rate' : 'Global Default'}
                        </span>
                      </td>

                      {/* WALLET BALANCE & DIRECT ADJUST BUTTON */}
                      <td className="py-3 px-3.5 bg-[#F5FAFF]/60 whitespace-nowrap">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-mono font-black text-sm text-[#0B4FBA]">
                              {formatINR(walletAmt)}
                            </div>
                            <div className="text-[10px] text-[#667085] font-medium flex items-center gap-1">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#12B76A]" />
                              <span>Live Wallet</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openWalletAdjustModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#175CD3] text-white hover:bg-[#154EBA] text-[11px] font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
                            title="Add or Debit Wallet Amount"
                          >
                            <Wallet className="h-3 w-3" />
                            <span>Adjust</span>
                          </button>
                        </div>
                      </td>

                      {/* Centres Count */}
                      <td className="py-3 px-2 text-center whitespace-nowrap font-bold text-xs text-[#172033]">
                        {p.totalRegisteredUsers || 0}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[10.5px] font-bold text-[#027A48] border border-[#A6F4C5]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#12B76A]" />
                            ACTIVE
                          </span>
                        ) : isPendingApproval ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF8FF] px-2 py-0.5 text-[10.5px] font-bold text-[#175CD3] border border-[#B2DDFF]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#2E90FA] animate-ping" />
                            AWAITING PROOF
                          </span>
                        ) : isPendingPayment ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF7E6] px-2 py-0.5 text-[10.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                            <Clock className="h-2.5 w-2.5 text-[#C98219]" />
                            FEE PENDING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FDECEC] px-2 py-0.5 text-[10.5px] font-bold text-[#C2413B] border border-[#F5C6CB]">
                            {p.status}
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-2 text-center whitespace-nowrap text-[11px] text-[#667085]">
                        {formatDate(p.createdAt)}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Approve Payment (if pending approval) */}
                          {isPendingApproval && (
                            <button
                              type="button"
                              onClick={() => handleApprovePartner(p.id, p.name)}
                              disabled={actionLoadingId === p.id}
                              className="p-1.5 rounded-[6px] bg-[#027A48] text-white hover:bg-[#05603A] shadow-2xs transition-colors"
                              title="Approve Franchise Offline Payment"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* View Receipt Proof */}
                          {p.paymentProofUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setViewingReceipt({
                                  partnerName: p.name,
                                  partnerCode: p.partnerCode,
                                  paymentReference: p.paymentReference || 'Submitted',
                                  imageUrl: p.paymentProofUrl,
                                })
                              }
                              className="p-1.5 rounded-[6px] border border-[#B2DDFF] bg-[#EFF8FF] text-[#175CD3] hover:bg-[#D1E9FF] shadow-2xs transition-colors"
                              title="View Payment Proof Receipt"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-[6px] border border-[#D0D5DD] bg-white text-[#475467] hover:bg-[#F8FAFC] hover:text-[#172033] shadow-2xs transition-colors"
                            title="Edit Partner Details"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-[#C98219]" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => {
                              setPartnerForPasswordReset(p);
                              setNewPasswordInput('');
                              setResetPasswordError(null);
                              setResetPasswordSuccess(null);
                            }}
                            className="p-1.5 rounded-[6px] border border-[#D0D5DD] bg-white text-[#475467] hover:bg-[#FEF7E6] hover:text-[#8F5A0D] shadow-2xs transition-colors"
                            title="Set / Reset Partner Password"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-[#C98219]" />
                          </button>

                          {/* Delete Partner */}
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setPartnerToDelete(p);
                            }}
                            className="p-1.5 rounded-[6px] border border-[#FDA29B] bg-white text-[#D92D20] hover:bg-[#FEF3F2] shadow-2xs transition-colors"
                            title="Delete Partner Franchise"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW — Enhanced cards with prominent Wallet Balance panel */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPartners.map((p) => {
            const isPendingPayment = p.status === 'PENDING_PAYMENT';
            const isPendingApproval = p.status === 'PENDING_APPROVAL';
            const isActive = p.status === 'ACTIVE';
            const walletAmt = Number(p.availableBalance ?? p.walletBalance ?? p.balance ?? 0);

            const onboardFullUrl = p.activeInvitationToken
              ? `${getOrigin()}/partner/onboard/${p.activeInvitationToken}`
              : '';

            return (
              <div
                key={p.id}
                className="rounded-[12px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between space-y-4 hover:border-[#CBD5E1] transition-all"
              >
                <div>
                  {/* Top Bar: Code & Status */}
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-[#FEF7E6] px-2.5 py-0.5 text-xs font-bold text-[#8F5A0D] border border-[#F9DE9B] font-mono">
                      {p.partnerCode}
                    </span>

                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-2.5 py-0.5 text-[11px] font-bold text-[#027A48] border border-[#A6F4C5]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#12B76A]" />
                        ACTIVE
                      </span>
                    ) : isPendingApproval ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF8FF] px-2.5 py-0.5 text-[11px] font-bold text-[#175CD3] border border-[#B2DDFF]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2E90FA] animate-ping" />
                        AWAITING APPROVAL
                      </span>
                    ) : isPendingPayment ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF7E6] px-2.5 py-0.5 text-[11px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                        <Clock className="h-3 w-3 text-[#C98219]" />
                        FEE PENDING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDECEC] px-2.5 py-0.5 text-[11px] font-bold text-[#C2413B] border border-[#F5C6CB]">
                        {p.status}
                      </span>
                    )}
                  </div>

                  {/* Partner Name */}
                  <h3 className="text-base font-bold text-[#172033] mt-2.5">{p.name}</h3>

                  {/* PROMINENT WALLET BALANCE PANEL */}
                  <div className="mt-3 rounded-[9px] border border-[#B2DDFF] bg-[#F5FAFF] p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#175CD3] flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" />
                        <span>Partner Wallet</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => openWalletAdjustModal(p)}
                        className="rounded-[6px] bg-[#175CD3] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#154EBA] shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Adjust Balance</span>
                      </button>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="font-mono text-xl font-black text-[#0B4FBA]">
                        {formatINR(walletAmt)}
                      </div>
                      <span className="text-[10px] text-[#1E40AF] font-medium">
                        Live Balance
                      </span>
                    </div>
                  </div>

                  {/* Contact & Credentials Card */}
                  <div className="mt-3 rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="text-[#667085] font-semibold">Mobile / Login:</span>
                      <span className="text-[#172033] font-mono font-bold select-all">{p.mobile}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="text-[#667085] font-semibold">Email:</span>
                      <span className="text-[#172033] font-mono truncate max-w-[150px]" title={p.email}>
                        {p.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E6EAF0]">
                      <span className="text-[#8F5A0D] font-medium">Region:</span>
                      <span className="text-[#172033] font-medium">{p.district || 'Tamil Nadu'} / {p.taluk || 'HQ'}</span>
                    </div>
                  </div>

                  {/* Rates Info */}
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-[7px] border border-[#E6EAF0] bg-white p-2">
                      <span className="text-[#667085] block text-[10px] uppercase font-bold">Commission</span>
                      <span className="font-bold text-[#172033] text-xs">{p.commissionPercentage}%</span>
                      <span className="text-[#667085] block text-[9.5px]">₹ {Number(p.commissionRate || 20).toFixed(2)}/pass</span>
                    </div>
                    <div className="rounded-[7px] border border-[#E6EAF0] bg-white p-2">
                      <span className="text-[#667085] block text-[10px] uppercase font-bold">Base Ticket</span>
                      <span className="font-mono font-bold text-[#175CD3] text-xs">
                        ₹ {Number(p.baseTicketPrice ?? systemBaseTicketPrice).toFixed(2)}
                      </span>
                      <span className="text-[#667085] block text-[9.5px] truncate">
                        {p.baseTicketPrice ? 'Custom Rate' : 'Global Default'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="border-t border-[#E6EAF0] pt-3 space-y-2.5">
                  {/* Approval action if pending */}
                  {isPendingApproval && (
                    <button
                      type="button"
                      disabled={actionLoadingId === p.id}
                      onClick={() => handleApprovePartner(p.id, p.name)}
                      className="w-full rounded-[7px] bg-[#027A48] py-2 px-3 text-xs font-bold text-white hover:bg-[#05603A] shadow-subtle flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {actionLoadingId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      <span>Verify & Approve Payment (₹ 599)</span>
                    </button>
                  )}

                  {/* Buttons toolbar */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(p)}
                      className="flex-1 rounded-[7px] border border-[#D0D5DD] bg-white py-1.5 px-2 text-xs font-bold text-[#172033] hover:bg-[#F8FAFC] shadow-2xs flex items-center justify-center gap-1 transition-all"
                    >
                      <Edit3 className="h-3 w-3 text-[#C98219]" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPartnerForPasswordReset(p);
                        setNewPasswordInput('');
                        setResetPasswordError(null);
                        setResetPasswordSuccess(null);
                      }}
                      className="rounded-[7px] border border-[#D0D5DD] bg-white py-1.5 px-2 text-xs font-bold text-[#344054] hover:bg-[#FEF7E6] shadow-2xs flex items-center justify-center gap-1 transition-all"
                      title="Reset Password"
                    >
                      <KeyRound className="h-3 w-3 text-[#C98219]" />
                      <span>Password</span>
                    </button>
                    {p.paymentProofUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setViewingReceipt({
                            partnerName: p.name,
                            partnerCode: p.partnerCode,
                            paymentReference: p.paymentReference || 'Submitted',
                            imageUrl: p.paymentProofUrl,
                          })
                        }
                        className="rounded-[7px] border border-[#B2DDFF] bg-[#EFF8FF] py-1.5 px-2 text-xs font-bold text-[#175CD3] hover:bg-[#D1E9FF] shadow-2xs flex items-center justify-center gap-1 transition-all"
                        title="View Receipt"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setPartnerToDelete(p);
                      }}
                      className="rounded-[7px] border border-[#FDA29B] bg-white py-1.5 px-2 text-xs font-bold text-[#D92D20] hover:bg-[#FEF3F2] shadow-2xs flex items-center justify-center transition-all"
                      title="Delete Partner"
                    >
                      <Trash2 className="h-3 w-3 text-[#D92D20]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WALLET ADJUSTMENT MODAL (CREDIT / DEBIT) */}
      {isWalletModalOpen && walletTargetPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-[14px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-modal flex flex-col my-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3.5 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#172033]">
                    Adjust Partner Wallet Balance
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Manually credit (add funds) or debit (deduct funds) for Super Admin operations.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(false)}
                className="rounded-[6px] p-1.5 text-[#667085] hover:bg-[#F0F3F8] hover:text-[#172033] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {walletError && (
              <div className="rounded-[7px] border border-[#FDA29B] bg-[#FEF3F2] p-3 text-xs text-[#D92D20] flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#D92D20]" />
                <span>{walletError}</span>
              </div>
            )}

            <form onSubmit={handleWalletAdjustSubmit} className="space-y-4">
              {/* Partner Info Summary Banner */}
              <div className="rounded-[9px] border border-[#E6EAF0] bg-[#F8FAFC] p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-xs font-mono font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                      {walletTargetPartner.partnerCode}
                    </span>
                    <span className="font-bold text-sm text-[#172033]">{walletTargetPartner.name}</span>
                  </div>
                  <div className="text-[11px] text-[#667085] mt-1">
                    {walletTargetPartner.district || 'Tamil Nadu'} • {walletTargetPartner.mobile}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#667085] block">Current Balance</span>
                  <span className="font-mono text-base font-black text-[#175CD3]">
                    {formatINR(
                      walletTargetPartner.availableBalance ??
                      walletTargetPartner.walletBalance ??
                      walletTargetPartner.balance ??
                      0
                    )}
                  </span>
                </div>
              </div>

              {/* Action Switcher: CREDIT vs DEBIT */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Select Action *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setWalletAdjustAction('CREDIT')}
                    className={`py-2.5 px-3 rounded-[8px] border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      walletAdjustAction === 'CREDIT'
                        ? 'border-[#A6F4C5] bg-[#ECFDF3] text-[#027A48] shadow-2xs ring-2 ring-[#A6F4C5]'
                        : 'border-[#E6EAF0] bg-white text-[#475467] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <ArrowDownLeft className="h-4 w-4 text-[#12B76A]" />
                    <span>Credit (Add Funds)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalletAdjustAction('DEBIT')}
                    className={`py-2.5 px-3 rounded-[8px] border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      walletAdjustAction === 'DEBIT'
                        ? 'border-[#FECDCA] bg-[#FEF3F2] text-[#D92D20] shadow-2xs ring-2 ring-[#FECDCA]'
                        : 'border-[#E6EAF0] bg-white text-[#475467] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4 text-[#D92D20]" />
                    <span>Debit (Deduct Funds)</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Amount Pills */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Preset Amounts
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {['100', '500', '1000', '2000', '5000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWalletAdjustAmount(preset)}
                      className={`px-3 py-1.5 rounded-[6px] text-xs font-mono font-bold transition-all ${
                        walletAdjustAmount === preset
                          ? 'bg-[#172033] text-white'
                          : 'bg-[#F8FAFC] border border-[#E6EAF0] text-[#475467] hover:bg-[#E6EAF0]'
                      }`}
                    >
                      +₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Amount Input */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-[#667085]">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={walletAdjustAmount}
                    onChange={(e) => setWalletAdjustAmount(e.target.value)}
                    placeholder="Enter amount in ₹"
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-8 pr-3 py-2 text-sm font-mono font-bold text-[#172033] focus:border-[#175CD3] focus:outline-none"
                  />
                </div>
              </div>

              {/* Reason / Reference */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Reason / Reference Note <span className="text-[#667085] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={walletAdjustReason}
                  onChange={(e) => setWalletAdjustReason(e.target.value)}
                  placeholder="e.g. Offline cash topup, incentive credit, refund adjustment..."
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#172033] focus:border-[#175CD3] focus:outline-none"
                />
              </div>

              {/* Projected Balance Preview Box */}
              {(() => {
                const cur = Number(
                  walletTargetPartner.availableBalance ??
                  walletTargetPartner.walletBalance ??
                  walletTargetPartner.balance ??
                  0
                );
                const amt = parseFloat(walletAdjustAmount) || 0;
                const projected = walletAdjustAction === 'CREDIT' ? cur + amt : cur - amt;

                return (
                  <div
                    className={`rounded-[9px] border p-3.5 text-xs space-y-1.5 ${
                      projected < 0
                        ? 'border-[#FDA29B] bg-[#FEF3F2] text-[#D92D20]'
                        : 'border-[#B2DDFF] bg-[#F5FAFF] text-[#175CD3]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Current Available:</span>
                      <span className="font-mono font-bold">{formatINR(cur)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {walletAdjustAction === 'CREDIT' ? 'Credit Adjustment:' : 'Debit Adjustment:'}
                      </span>
                      <span className="font-mono font-bold">
                        {walletAdjustAction === 'CREDIT' ? `+ ${formatINR(amt)}` : `- ${formatINR(amt)}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-current/20 font-bold text-sm">
                      <span>Projected New Balance:</span>
                      <span className="font-mono font-black">{formatINR(Math.max(0, projected))}</span>
                    </div>
                    {projected < 0 && (
                      <p className="text-[11px] font-bold text-[#D92D20] pt-1">
                        ⚠️ Cannot debit more than the current available balance.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6EAF0]">
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(false)}
                  className="rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#475467] hover:bg-[#F0F3F8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walletSubmitting || (walletAdjustAction === 'DEBIT' && (parseFloat(walletAdjustAmount) || 0) > Number(walletTargetPartner.availableBalance ?? walletTargetPartner.walletBalance ?? walletTargetPartner.balance ?? 0))}
                  className={`rounded-[7px] px-5 py-2 text-xs font-bold text-white shadow-subtle flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors ${
                    walletAdjustAction === 'CREDIT'
                      ? 'bg-[#027A48] hover:bg-[#05603A]'
                      : 'bg-[#D92D20] hover:bg-[#B42318]'
                  }`}
                >
                  {walletSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating Wallet...</span>
                    </>
                  ) : (
                    <span>
                      {walletAdjustAction === 'CREDIT' ? `Confirm Credit (+₹${walletAdjustAmount || 0})` : `Confirm Debit (-₹${walletAdjustAmount || 0})`}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal After Creating Partner */}
      {createdPartnerData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[12px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-modal space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#172033]">
                  Partner Franchise Created (Pending Payment)
                </h3>
                <p className="text-xs text-[#667085]">
                  Partner is in <strong>Pending Payment</strong> status. Share the onboarding URL below.
                </p>
              </div>
            </div>

            <div className="rounded-[9px] border border-[#F9DE9B] bg-[#FEF7E6] p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8F5A0D] font-medium">Partner Name:</span>
                <span className="font-bold text-[#172033]">{createdPartnerData.partner?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8F5A0D] font-medium">Partner Code:</span>
                <span className="font-mono font-bold text-[#172033]">{createdPartnerData.partner?.partnerCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8F5A0D] font-medium">Franchise Fee:</span>
                <span className="font-bold text-[#172033]">₹ 599.00 (Pending Payment)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#172033]">
                Partner Onboarding & Payment Link:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${getOrigin()}/partner/onboard/${createdPartnerData.invitation?.token}`}
                  className="flex-1 rounded-[7px] border border-[#D0D5DD] bg-[#F8FAFC] px-3 py-2 text-xs font-mono text-[#172033] focus:outline-none"
                />
                <button
                  onClick={() =>
                    copyUrl(
                      `${getOrigin()}/partner/onboard/${createdPartnerData.invitation?.token}`,
                      'created-partner-url'
                    )
                  }
                  className="rounded-[7px] bg-[#C98219] px-4 py-2 text-xs font-bold text-white hover:bg-[#B57414] flex items-center gap-1.5 shadow-subtle shrink-0"
                >
                  {copiedToken === 'created-partner-url' ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#667085]">
                💡 The partner can open this link to verify their franchise, pay the ₹ 599 franchise fee, and submit their transaction reference for your approval.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCreatedPartnerData(null)}
                className="rounded-[7px] bg-[#172033] px-5 py-2 text-xs font-bold text-white hover:bg-[#222E46]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Partner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-[14px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-modal flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3.5 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B] shadow-2xs">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#172033]">
                    Create Authorized Partner
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Register a regional franchise partner and generate their dedicated onboarding link.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-[6px] p-1.5 text-[#667085] hover:bg-[#F0F3F8] hover:text-[#172033] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-[7px] border border-[#F5C6CB] bg-[#FDECEC] p-3 text-xs text-[#C2413B] flex items-center gap-2 mb-3 shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B]" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreatePartner} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-1.5 -mr-1.5 space-y-4">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#F0F3F8] pb-1.5">
                    <span className="text-xs font-bold text-[#475467] uppercase tracking-wider">
                      Franchise Details
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Partner / Agency Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. NIJA Digital Services Thanjavur"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="partner@nija.in"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="[6-9][0-9]{9}"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="9443199999"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">District</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Thanjavur / Chennai"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">Taluk</label>
                      <input
                        type="text"
                        value={taluk}
                        onChange={(e) => setTaluk(e.target.value)}
                        placeholder="e.g. Kumbakonam / Guindy"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Dynamic Base Ticket Price (Chips) <span className="text-[#667085] font-normal">(Optional Override)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-[#667085] font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={baseTicketPrice}
                        onChange={(e) => setBaseTicketPrice(e.target.value)}
                        placeholder={`Leave blank to use default (₹ ${systemBaseTicketPrice.toFixed(2)})`}
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-8 pr-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                    <p className="text-[10.5px] text-[#667085] mt-1">
                      Custom base rate for centres under this partner (Default: ₹ {systemBaseTicketPrice.toFixed(2)}).
                    </p>
                  </div>

                  <div className="rounded-[7px] border border-[#F9DE9B] bg-[#FEF7E6] p-2.5 text-[11.5px] text-[#8F5A0D] flex items-center justify-between font-medium">
                    <span>Franchise Fee: <strong>₹ 599.00</strong></span>
                    <span>Initial Status: <strong>Pending Payment</strong></span>
                  </div>
                </div>
              </div>

              {/* Modal Fixed Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6EAF0] mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#475467] hover:bg-[#F0F3F8] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-[7px] bg-[#C98219] px-5 py-2 text-xs font-bold text-white hover:bg-[#B57414] shadow-subtle flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create & Generate Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-4xl rounded-[14px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-modal flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3.5 mb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-xs font-bold text-[#8F5A0D] border border-[#F9DE9B] font-mono">
                    {editingPartner.partnerCode}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#172033]">Edit Partner Details & Base Ticket Price</h3>
                </div>
                <p className="text-xs text-[#667085] mt-0.5">
                  Update regional jurisdiction, active status, or configured dynamic base ticket price.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                className="rounded-[6px] p-1.5 text-[#667085] hover:bg-[#F0F3F8] hover:text-[#172033] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editErrorMsg && (
              <div className="rounded-[7px] border border-[#F5C6CB] bg-[#FDECEC] p-3 text-xs text-[#C2413B] flex items-center gap-2 mb-3 shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B]" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleUpdatePartner} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-1.5 -mr-1.5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#F0F3F8] pb-1.5">
                      <span className="text-xs font-bold text-[#475467] uppercase tracking-wider">
                        Franchise Details
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">Partner / Agency Name *</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#172033] mb-1">Official Email *</label>
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#172033] mb-1">Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          pattern="[6-9][0-9]{9}"
                          value={editMobile}
                          onChange={(e) => setEditMobile(e.target.value)}
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#172033] mb-1">District</label>
                        <input
                          type="text"
                          value={editDistrict}
                          onChange={(e) => setEditDistrict(e.target.value)}
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#172033] mb-1">Taluk</label>
                        <input
                          type="text"
                          value={editTaluk}
                          onChange={(e) => setEditTaluk(e.target.value)}
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">Account Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                        <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#F0F3F8] pb-1.5">
                      <span className="text-xs font-bold text-[#475467] uppercase tracking-wider">
                        Pricing & Credentials
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Dynamic Base Ticket Price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-[#667085] font-bold">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={editBaseTicketPrice}
                          onChange={(e) => setEditBaseTicketPrice(e.target.value)}
                          placeholder={`Leave blank to use default (₹ ${systemBaseTicketPrice.toFixed(2)})`}
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-8 pr-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                      </div>
                      <p className="text-[10.5px] text-[#667085] mt-1">
                        Global default rate is ₹ {systemBaseTicketPrice.toFixed(2)}.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Reset Password <span className="text-[#667085] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Leave blank to keep existing password"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6EAF0] mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#475467] hover:bg-[#F0F3F8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-[7px] bg-[#C98219] px-5 py-2 text-xs font-bold text-white hover:bg-[#B57414] shadow-subtle flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Receipt Proof Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-[14px] border border-[#E6EAF0] bg-white p-6 shadow-modal space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">
                    Payment Proof Receipt
                  </h3>
                  <p className="text-xs text-[#667085]">
                    {viewingReceipt.partnerName} ({viewingReceipt.partnerCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="rounded-[6px] p-1.5 text-[#667085] hover:bg-[#F0F3F8] hover:text-[#172033] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3 text-xs flex items-center justify-between font-mono">
              <span className="text-[#667085]">UTR / Payment Reference:</span>
              <strong className="text-[#172033] select-all">{viewingReceipt.paymentReference}</strong>
            </div>

            <div className="rounded-[10px] border border-[#E6EAF0] bg-[#0F172A] p-2 flex items-center justify-center max-h-[55vh] overflow-hidden">
              <img
                src={viewingReceipt.imageUrl}
                alt="Franchise Fee Receipt Proof"
                className="max-h-[50vh] max-w-full object-contain rounded-[6px]"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E6EAF0]">
              <a
                href={viewingReceipt.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#175CD3] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Original Image</span>
              </a>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="rounded-[7px] bg-[#172033] px-4 py-2 text-xs font-bold text-white hover:bg-[#222E46]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Partner Modal */}
      {partnerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-[12px] border border-[#FDA29B] bg-white p-6 shadow-modal space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF3F2] text-[#D92D20] border border-[#FECDCA]">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Delete Partner Franchise?
                </h3>
                <p className="text-xs text-[#667085]">
                  {partnerToDelete.name} ({partnerToDelete.partnerCode})
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="rounded-[7px] border border-[#FDA29B] bg-[#FEF3F2] p-2.5 text-xs text-[#D92D20] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#D92D20]" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs text-[#475467] leading-relaxed">
              Are you sure you want to permanently delete partner <strong>{partnerToDelete.name}</strong> ({partnerToDelete.partnerCode})? This will remove all invitation tokens and unbind linked centres. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E6EAF0]">
              <button
                type="button"
                onClick={() => setPartnerToDelete(null)}
                disabled={isDeleting}
                className="rounded-[7px] border border-[#D0D5DD] bg-white px-4 py-2 text-xs font-bold text-[#344054] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePartner}
                disabled={isDeleting}
                className="rounded-[7px] bg-[#D92D20] px-4 py-2 text-xs font-bold text-white hover:bg-[#B42318] shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Franchise</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {partnerForPasswordReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-[12px] border border-[#E6EAF0] bg-white p-6 shadow-modal space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">
                    Reset Partner Password
                  </h3>
                  <p className="text-xs text-[#667085]">
                    {partnerForPasswordReset.name} ({partnerForPasswordReset.partnerCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPartnerForPasswordReset(null)}
                className="rounded-[6px] p-1.5 text-[#667085] hover:bg-[#F0F3F8] hover:text-[#172033] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetPasswordSuccess ? (
              <div className="space-y-4 py-1">
                <div className="rounded-[8px] border border-[#A6F4C5] bg-[#ECFDF3] p-4 text-xs text-[#027A48] space-y-2">
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Password Updated Successfully!
                  </p>
                  <div className="pt-1 space-y-1.5 font-mono text-xs text-[#172033] bg-white p-3 rounded-[6px] border border-[#A6F4C5]">
                    <div>Login Email: <strong className="select-all">{resetPasswordSuccess.email}</strong></div>
                    <div>Mobile / Username: <strong className="select-all">{resetPasswordSuccess.mobile}</strong></div>
                    <div>Partner Code: <strong className="text-[#C98219] select-all">{resetPasswordSuccess.partnerCode}</strong></div>
                    <div className="pt-1 border-t border-[#E6EAF0]">
                      Active Password: <strong className="text-[#027A48] text-sm select-all">{resetPasswordSuccess.newPassword}</strong>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-[#027A48]">
                    Partner can now sign in at <strong>/auth/login</strong> using their Email, Mobile, or Partner Code with this password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPartnerForPasswordReset(null)}
                  className="w-full rounded-[7px] bg-[#172033] py-2.5 text-xs font-bold text-white hover:bg-[#222E46] cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] p-3 text-xs space-y-1 font-mono">
                  <p className="text-[#667085]">Email: <strong className="text-[#172033]">{partnerForPasswordReset.email}</strong></p>
                  <p className="text-[#667085]">Mobile: <strong className="text-[#172033]">{partnerForPasswordReset.mobile}</strong></p>
                  <p className="text-[#667085]">Partner Code: <strong className="text-[#C98219]">{partnerForPasswordReset.partnerCode}</strong></p>
                </div>

                {resetPasswordError && (
                  <div className="rounded-[7px] border border-[#FDA29B] bg-[#FEF3F2] p-2.5 text-xs text-[#D92D20] flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{resetPasswordError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Enter New Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="e.g. pass@2025"
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-mono text-[#172033] focus:border-[#C98219] focus:outline-none"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-[#667085]">Min 6 characters</span>
                    <button
                      type="button"
                      onClick={() => setNewPasswordInput(`Partner@${partnerForPasswordReset.mobile.slice(-4)}`)}
                      className="text-[11px] font-bold text-[#C98219] hover:underline cursor-pointer"
                    >
                      Use Default (Partner@{partnerForPasswordReset.mobile.slice(-4)})
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EAF0]">
                  <button
                    type="button"
                    onClick={() => setPartnerForPasswordReset(null)}
                    className="rounded-[7px] border border-[#D0D5DD] bg-white px-4 py-2 text-xs font-bold text-[#344054] hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="rounded-[7px] bg-[#C98219] px-4 py-2 text-xs font-bold text-white hover:bg-[#B57414] shadow-subtle flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>Save New Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
