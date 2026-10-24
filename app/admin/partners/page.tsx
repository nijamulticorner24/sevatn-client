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
} from 'lucide-react';

const COMMISSION_SLABS = [
  { slab: 'SLAB_10', label: '10% Slab', percentage: 10, desc: '10% of Service Fee per Booking' },
  { slab: 'SLAB_15', label: '15% Slab', percentage: 15, desc: '15% of Service Fee per Booking' },
  { slab: 'CUSTOM', label: 'Custom %', percentage: 0, desc: 'Custom percentage rate' },
];

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [systemServiceFee, setSystemServiceFee] = useState(100);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'PENDING_PAYMENT' | 'SUSPENDED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
  const [commissionSlab, setCommissionSlab] = useState('SLAB_10');
  const [commissionPercentage, setCommissionPercentage] = useState('10');
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
  const [editCommissionSlab, setEditCommissionSlab] = useState('SLAB_10');
  const [editCommissionPercentage, setEditCommissionPercentage] = useState('10');
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
    api.getPartners()
      .then((res: any) => {
        setPartners(res.partners || []);
        if (res.systemServiceFee) {
          setSystemServiceFee(Number(res.systemServiceFee));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
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

  const handleSlabChange = (selectedSlab: string, isEdit = false) => {
    if (selectedSlab === 'CUSTOM') {
      if (isEdit) {
        setEditCommissionSlab('CUSTOM');
      } else {
        setCommissionSlab('CUSTOM');
      }
      return;
    }
    const found = COMMISSION_SLABS.find((s) => s.slab === selectedSlab) || COMMISSION_SLABS[0];
    if (isEdit) {
      setEditCommissionSlab(found.slab);
      setEditCommissionPercentage(found.percentage.toString());
    } else {
      setCommissionSlab(found.slab);
      setCommissionPercentage(found.percentage.toString());
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg(null);

    const pct = parseFloat(commissionPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setErrorMsg('Please enter a valid commission percentage between 0% and 100%.');
      setCreating(false);
      return;
    }
    const rate = (systemServiceFee * pct) / 100;
    const slabLabel = commissionSlab === 'SLAB_10'
      ? 'SLAB_10'
      : commissionSlab === 'SLAB_15'
        ? 'SLAB_15'
        : `CUSTOM (${pct}%)`;

    try {
      const res = await api.createPartner({
        name,
        email,
        mobile,
        district,
        taluk,
        commissionPercentage: pct,
        commissionRate: rate,
        commissionSlab: slabLabel,
      });

      setShowCreateModal(false);
      setCreatedPartnerData(res);
      setName('');
      setEmail('');
      setMobile('');
      setCommissionSlab('SLAB_10');
      setCommissionPercentage('10');
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
    const rawPct = p.commissionPercentage !== undefined && p.commissionPercentage !== null
      ? Number(p.commissionPercentage)
      : (p.commissionRate ? Number(((Number(p.commissionRate) / systemServiceFee) * 100).toFixed(1)) : 10);

    if (rawPct === 10) {
      setEditCommissionSlab('SLAB_10');
      setEditCommissionPercentage('10');
    } else if (rawPct === 15) {
      setEditCommissionSlab('SLAB_15');
      setEditCommissionPercentage('15');
    } else {
      setEditCommissionSlab('CUSTOM');
      setEditCommissionPercentage(rawPct.toString());
    }
    setEditPassword('');
    setEditErrorMsg(null);
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    setSavingEdit(true);
    setEditErrorMsg(null);

    const pct = parseFloat(editCommissionPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setEditErrorMsg('Please enter a valid commission percentage between 0% and 100%.');
      setSavingEdit(false);
      return;
    }
    const rate = (systemServiceFee * pct) / 100;
    const slabLabel = editCommissionSlab === 'SLAB_10'
      ? 'SLAB_10'
      : editCommissionSlab === 'SLAB_15'
        ? 'SLAB_15'
        : `CUSTOM (${pct}%)`;

    try {
      await api.updatePartner(editingPartner.id, {
        name: editName,
        email: editEmail,
        mobile: editMobile,
        district: editDistrict,
        taluk: editTaluk,
        status: editStatus,
        commissionPercentage: pct,
        commissionRate: rate,
        commissionSlab: slabLabel,
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

  if (isAuthorized === false) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626]">
          <Ban className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Admin Role Required</h1>
        <p className="text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
          Access to Partner Franchise Management is restricted to authorized Administrators.
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
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 rounded-[8px] border border-[#A6F4C5] bg-[#ECFDF3] px-4 py-3 text-xs font-bold text-[#027A48] shadow-modal flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-[#12B76A]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" />
            <span>SevaTN — Partner Network</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#172033]">
            Partners & Network Management
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Create regional partner franchises, monitor franchise fee payments, and approve & activate partners.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-[7px] bg-[#C98219] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add New Partner</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
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
            All Partners ({partners.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING_APPROVAL')}
            className={`rounded-[6px] px-3 py-1.5 font-bold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'PENDING_APPROVAL'
                ? 'bg-[#175CD3] text-white'
                : 'bg-[#EFF8FF] text-[#175CD3] hover:bg-[#D1E9FF]'
            }`}
          >
            <span>Awaiting Approval</span>
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
            Pending Payment ({pendingPaymentCount})
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
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#98A2B3]" />
          <input
            type="text"
            placeholder="Search by name, code, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[6px] border border-[#D0D5DD] bg-white pl-8 pr-3 py-1.5 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
          />
        </div>
      </div>

      {/* Partners List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-[10px] border border-[#E6EAF0]">
          <Loader2 className="h-6 w-6 animate-spin text-[#C98219]" />
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[10px] border border-[#E6EAF0] p-6">
          <Users className="h-8 w-8 text-[#98A2B3] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#172033]">No partners found</h3>
          <p className="text-xs text-[#667085] mt-1">
            {searchQuery ? 'Try adjusting your search query' : 'No partners match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPartners.map((p) => {
            const isPendingPayment = p.status === 'PENDING_PAYMENT';
            const isPendingApproval = p.status === 'PENDING_APPROVAL';
            const isActive = p.status === 'ACTIVE';
            const isSuspended = p.status === 'SUSPENDED';

            const onboardFullUrl = p.activeInvitationToken
              ? `${getOrigin()}/partner/onboard/${p.activeInvitationToken}`
              : '';

            return (
              <div
                key={p.id}
                className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle flex flex-col justify-between space-y-4"
              >
                <div>
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
                        PAYMENT AWAITING APPROVAL
                      </span>
                    ) : isPendingPayment ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF7E6] px-2.5 py-0.5 text-[11px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                        <Clock className="h-3 w-3 text-[#C98219]" />
                        PENDING PAYMENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDECEC] px-2.5 py-0.5 text-[11px] font-bold text-[#C2413B] border border-[#F5C6CB]">
                        <Ban className="h-3 w-3 text-[#C2413B]" />
                        {p.status}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[#172033] mt-3">{p.name}</h3>

                  <div className="mt-3 space-y-2 text-xs text-[#667085]">
                    <div className="rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] p-2.5 space-y-1.5 font-sans">
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="text-[#667085] font-semibold">Login Email:</span>
                        <span className="text-[#172033] font-mono font-bold select-all">{p.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="text-[#667085] font-semibold">Mobile / Login:</span>
                        <span className="text-[#172033] font-mono font-bold select-all">{p.mobile}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="text-[#667085] font-semibold">Partner Code:</span>
                        <span className="text-[#C98219] font-mono font-extrabold select-all">{p.partnerCode}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-[#E6EAF0]">
                        <span className="text-[#8F5A0D] font-medium">Default Password:</span>
                        <span className="text-[#8F5A0D] font-mono bg-[#FEF7E6] px-1.5 py-0.5 rounded border border-[#F9DE9B] font-bold">
                          Partner@{p.mobile ? p.mobile.slice(-4) : 'XXXX'}
                        </span>
                      </div>
                    </div>

                    <p>Region: <span className="text-[#172033] font-medium">{p.district || 'Tamil Nadu'} / {p.taluk || 'HQ'}</span></p>
                    <p>Total Registered Centres: <strong className="text-[#8F5A0D] text-sm font-bold ml-1">{p.totalRegisteredUsers || 0}</strong></p>
                  </div>

                  {/* Payment & Approval Info Box */}
                  <div className="mt-3.5 rounded-[7px] border p-2.5 text-xs">
                    {isActive ? (
                      <div className="flex items-center justify-between text-[#027A48] bg-[#ECFDF3]/60 -m-2.5 p-2.5 rounded-[7px]">
                        <span className="font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Franchise Fee (₹599.00):
                        </span>
                        <span className="font-bold">Paid & Verified</span>
                      </div>
                    ) : isPendingApproval ? (
                      <div className="space-y-1.5 bg-[#EFF8FF]/70 -m-2.5 p-2.5 rounded-[7px] text-[#175CD3]">
                        <div className="flex items-center justify-between font-bold">
                          <span>Franchise Fee: ₹599.00</span>
                          <span>Payment Submitted</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#1E40AF]">
                          <span>Ref (UTR): <strong className="font-mono">{p.paymentReference || 'Submitted'}</strong></span>
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
                              className="text-[#175CD3] hover:text-[#154EBA] font-bold flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-[6px] border border-[#B2DDFF] cursor-pointer shadow-2xs hover:bg-[#EFF8FF] transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View Receipt</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[#8F5A0D] bg-[#FEF7E6]/70 -m-2.5 p-2.5 rounded-[7px]">
                        <span className="font-semibold flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Franchise Fee (₹599.00):
                        </span>
                        <span className="font-bold text-[#C98219]">Unpaid (Pending)</span>
                      </div>
                    )}
                  </div>

                  {/* Commission Slab Box (% based on Service Fee) */}
                  <div className="mt-3 rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
                        <Percent className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">
                          Franchise Commission ({p.commissionPercentage ?? 20}%)
                        </span>
                        <span className="font-mono text-xs font-bold text-[#8F5A0D]">
                          {p.commissionSlab || `${p.commissionPercentage ?? 20}%`} SLAB
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-[#027A48]">
                        ₹{Number(p.commissionRate ?? ((systemServiceFee * (p.commissionPercentage ?? 20)) / 100)).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[#667085] block">
                        {p.commissionPercentage ?? 20}% of ₹{systemServiceFee.toFixed(2)} Fee
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions & URLs */}
                <div className="border-t border-[#E6EAF0] pt-4 space-y-3">
                  {/* Approval Action: ONLY visible when offline payment is submitted (PENDING_APPROVAL) */}
                  {isPendingApproval && (
                    <div className="flex items-center gap-2">
                      <button
                        disabled={actionLoadingId === p.id}
                        onClick={() => handleApprovePartner(p.id, p.name)}
                        className="flex-1 rounded-[7px] bg-[#027A48] py-2.5 px-3 text-xs font-bold text-white hover:bg-[#05603A] shadow-subtle flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {actionLoadingId === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        <span>Verify & Approve Offline Payment (₹599)</span>
                      </button>
                    </div>
                  )}

                  {isPendingPayment && (
                    <div className="rounded-[7px] bg-[#FEF7E6] border border-[#F9DE9B] px-3 py-2 text-xs text-[#8F5A0D] flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Clock className="h-3.5 w-3.5 text-[#C98219]" />
                        Awaiting Franchise Fee Payment
                      </span>
                      <span className="text-[11px] text-[#A66E14] font-medium">Online (Auto-Active) / Offline (Admin Review)</span>
                    </div>
                  )}

                  {/* Conditional Onboarding URL Section: Hidden when Active */}
                  {isActive ? (
                    <div className="rounded-[8px] bg-[#ECFDF3] border border-[#A6F4C5] p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#027A48]">
                        <CheckCircle2 className="h-4 w-4 text-[#12B76A]" />
                        <span>Partner Active — Onboarding Completed</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#027A48] bg-[#D1FADF] px-2.5 py-0.5 rounded font-bold border border-[#A6F4C5]">
                        Verified & Live
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-[8px] bg-[#FEF7E6]/70 border border-[#F9DE9B] p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#8F5A0D]">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          Partner Onboarding URL
                        </span>
                        <span className="text-[10px] bg-[#C98219] text-white px-2 py-0.5 rounded font-extrabold">
                          Share with Partner
                        </span>
                      </div>

                      {p.activeInvitationToken ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={onboardFullUrl}
                            className="flex-1 rounded-[6px] border border-[#E8D5B7] bg-white px-3 py-1.5 text-xs text-[#172033] font-mono focus:outline-none truncate"
                          />
                          <button
                            onClick={() => copyUrl(onboardFullUrl, `onboard-${p.id}`)}
                            className="rounded-[6px] bg-[#C98219] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B57414] transition-colors flex items-center gap-1.5 shrink-0 shadow-subtle"
                          >
                            {copiedToken === `onboard-${p.id}` ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy URL</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#98A2B3]">No active onboarding token.</span>
                          <button
                            onClick={() => handleGenerateFreshInvitation(p.id)}
                            className="rounded-[6px] bg-[#FEF7E6] border border-[#F9DE9B] px-2.5 py-1 text-xs font-bold text-[#8F5A0D] hover:bg-[#FAF3E7]"
                          >
                            Generate Token
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit, Reset Password & Delete Partner Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(p)}
                      className="flex-1 rounded-[7px] border border-[#D0D5DD] bg-white py-2 px-2.5 text-xs font-bold text-[#172033] hover:bg-[#F8FAFC] hover:border-[#98A2B3] shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-[#C98219] shrink-0" />
                      <span className="truncate">Edit Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPartnerForPasswordReset(p);
                        setNewPasswordInput('');
                        setResetPasswordError(null);
                        setResetPasswordSuccess(null);
                      }}
                      className="rounded-[7px] border border-[#D0D5DD] bg-white py-2 px-2.5 text-xs font-bold text-[#344054] hover:bg-[#FEF7E6] hover:border-[#C98219] hover:text-[#8F5A0D] shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                      title="Set / Reset Partner Password"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-[#C98219]" />
                      <span>Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setPartnerToDelete(p);
                      }}
                      className="rounded-[7px] border border-[#FDA29B] bg-white py-2 px-2.5 text-xs font-bold text-[#D92D20] hover:bg-[#FEF3F2] hover:border-[#D92D20] shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                      title="Delete Partner Franchise"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[#D92D20]" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
                <span className="font-bold text-[#172033]">₹599.00 (Pending Payment)</span>
              </div>
              <div className="flex justify-between border-t border-[#F9DE9B]/60 pt-1.5">
                <span className="text-[#8F5A0D] font-medium">Commission Slab & Cut:</span>
                <span className="font-bold text-[#027A48]">
                  {createdPartnerData.partner?.commissionSlab || commissionSlab} ({Number(createdPartnerData.partner?.commissionPercentage ?? commissionPercentage)}% • ₹{Number(createdPartnerData.partner?.commissionRate ?? ((systemServiceFee * (parseFloat(commissionPercentage) || 20)) / 100)).toFixed(2)} / pass)
                </span>
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
                💡 The partner can open this link to verify their franchise, pay the ₹599 franchise fee, and submit their transaction reference for your approval.
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
          <div className="w-full max-w-4xl rounded-[14px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-modal flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95">
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

            {/* Scrollable Form Body with 2-Column Responsive Grid */}
            <form onSubmit={handleCreatePartner} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-1.5 -mr-1.5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* Left Column: Basic Details */}
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

                    <div className="rounded-[7px] border border-[#F9DE9B] bg-[#FEF7E6] p-2.5 text-[11.5px] text-[#8F5A0D] flex items-center justify-between font-medium">
                      <span>Franchise Fee: <strong>₹599.00</strong></span>
                      <span>Initial Status: <strong>Pending Payment</strong></span>
                    </div>
                  </div>

                  {/* Right Column: Commission & Revenue Slab */}
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#F0F3F8] pb-1.5">
                      <span className="text-xs font-bold text-[#475467] uppercase tracking-wider">
                        Commission Structure
                      </span>
                      <span className="text-[11px] font-mono text-[#027A48] bg-[#ECFDF3] border border-[#A6F4C5] px-2 py-0.5 rounded font-bold">
                        {parseFloat(commissionPercentage) || 0}% Share
                      </span>
                    </div>

                    <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3.5 space-y-3">
                      {/* Service Fee Base Indicator */}
                      <div className="rounded-[6px] bg-white border border-[#E6EAF0] p-2.5 flex items-center justify-between text-xs">
                        <span className="text-[#667085] flex items-center gap-1.5 font-medium">
                          <Coins className="h-3.5 w-3.5 text-[#C98219]" />
                          Service Fee per Booking:
                        </span>
                        <span className="font-mono font-bold text-xs text-[#172033]">₹{systemServiceFee.toFixed(2)}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {COMMISSION_SLABS.map((s) => (
                          <button
                            type="button"
                            key={s.slab}
                            onClick={() => handleSlabChange(s.slab, false)}
                            className={`p-2.5 rounded-[8px] border text-left transition-all cursor-pointer ${
                              commissionSlab === s.slab
                                ? 'border-[#C98219] bg-[#FEF7E6] text-[#8F5A0D] shadow-xs ring-2 ring-[#C98219]'
                                : 'border-[#D0D5DD] bg-white text-[#475467] hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <div className="text-xs font-bold text-[#172033] flex items-center justify-between">
                              <span>{s.label}</span>
                              {commissionSlab === s.slab && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#C98219]" />
                              )}
                            </div>
                            <div className="text-[11px] text-[#667085] mt-1 font-medium">
                              {s.slab === 'CUSTOM'
                                ? 'Tailored %'
                                : `₹${((systemServiceFee * s.percentage) / 100).toFixed(2)} / pass`}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Custom Percentage Input Field */}
                      {commissionSlab === 'CUSTOM' && (
                        <div className="rounded-[7px] border border-[#F9DE9B] bg-[#FEF7E6] p-3 animate-in fade-in space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-xs font-bold text-[#8F5A0D] flex items-center gap-1.5">
                              <Percent className="h-3.5 w-3.5 text-[#C98219]" />
                              <span>Custom Commission Percentage *</span>
                            </label>
                            <div className="relative w-28">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                required
                                value={commissionPercentage}
                                onChange={(e) => setCommissionPercentage(e.target.value)}
                                placeholder="e.g. 12"
                                className="w-full rounded-[6px] border border-[#D0D5DD] bg-white px-3 py-1.5 text-sm font-bold text-[#172033] focus:border-[#C98219] focus:outline-none pr-8 text-right"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#667085]">%</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-[#A66E14]">
                            Enter any custom rate between 0% and 100% (e.g. 5%, 8%, 12%, 18%, 20%, 25%).
                          </p>
                        </div>
                      )}

                      <div className="rounded-[6px] bg-[#ECFDF3] border border-[#A6F4C5] p-2.5 text-[11.5px] text-[#027A48] flex items-center justify-between font-semibold">
                        <span>Partner Earns Per Pass:</span>
                        <span className="font-mono font-bold text-sm">
                          ₹{(((systemServiceFee * (parseFloat(commissionPercentage) || 0)) / 100)).toFixed(2)}
                          <span className="text-[10px] font-normal text-[#027A48] ml-1">
                            ({parseFloat(commissionPercentage) || 0}%)
                          </span>
                        </span>
                      </div>

                      <p className="text-[10.5px] text-[#667085] leading-relaxed">
                        💡 Percentage slab: Partner receives this cut of the ₹{systemServiceFee.toFixed(2)} booking fee whenever a Virtual-Q pass is completed by their registered centres.
                      </p>
                    </div>
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
                  <h3 className="text-base sm:text-lg font-bold text-[#172033]">Edit Partner Details & Slab</h3>
                </div>
                <p className="text-xs text-[#667085] mt-0.5">
                  Update regional jurisdiction, active status, or configured commission slab.
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

            {/* Scrollable Form Body with 2-Column Responsive Grid */}
            <form onSubmit={handleUpdatePartner} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-1.5 -mr-1.5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* Left Column: Basic Details & Status */}
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
                      <label className="block text-xs font-bold text-[#172033] mb-1">Franchise Account Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE (Fully Live & Operating)</option>
                        <option value="PENDING_APPROVAL">PENDING_APPROVAL (Payment Awaiting Approval)</option>
                        <option value="PENDING_PAYMENT">PENDING_PAYMENT (Awaiting Franchise Fee)</option>
                        <option value="SUSPENDED">SUSPENDED (Temporarily On Hold)</option>
                        <option value="DISABLED">DISABLED (Deactivated)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Change Dashboard Login Password (Optional)
                      </label>
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Leave blank to keep unchanged (e.g. pass@2025)"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#C98219] focus:outline-none font-mono"
                      />
                      <p className="text-[10.5px] text-[#667085] mt-1">
                        Min 6 characters. If entered, updates partner login password immediately.
                      </p>
                    </div>

                    {editStatus === 'ACTIVE' && (
                      <div className="rounded-[7px] border border-[#A6F4C5] bg-[#ECFDF3] p-2.5 text-[11.5px] text-[#027A48] flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#027A48]" />
                        <span>Status ACTIVE will automatically activate the partner login account and mark franchise fee verified.</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Commission Slab & Revenue Details */}
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#F0F3F8] pb-1.5">
                      <span className="text-xs font-bold text-[#475467] uppercase tracking-wider">
                        Commission Structure
                      </span>
                      <span className="text-[11px] font-mono text-[#027A48] bg-[#ECFDF3] border border-[#A6F4C5] px-2 py-0.5 rounded font-bold">
                        {editCommissionPercentage}% Share
                      </span>
                    </div>

                    <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3.5 space-y-3">
                      {/* Service Fee Base Indicator */}
                      <div className="rounded-[6px] bg-white border border-[#E6EAF0] p-2.5 flex items-center justify-between text-xs">
                        <span className="text-[#667085] flex items-center gap-1.5 font-medium">
                          <Coins className="h-3.5 w-3.5 text-[#C98219]" />
                          Current Service Fee per Booking:
                        </span>
                        <span className="font-mono font-bold text-xs text-[#172033]">₹{systemServiceFee.toFixed(2)}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {COMMISSION_SLABS.map((s) => (
                          <button
                            type="button"
                            key={s.slab}
                            onClick={() => handleSlabChange(s.slab, true)}
                            className={`p-2.5 rounded-[8px] border text-left transition-all cursor-pointer ${
                              editCommissionSlab === s.slab
                                ? 'border-[#C98219] bg-[#FEF7E6] text-[#8F5A0D] shadow-sm ring-2 ring-[#C98219]'
                                : 'border-[#D0D5DD] bg-white text-[#475467] hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <div className="text-xs font-bold text-[#172033] flex items-center justify-between">
                              <span>{s.label}</span>
                              {editCommissionSlab === s.slab && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#C98219]" />
                              )}
                            </div>
                            <div className="text-[11px] text-[#667085] mt-1 font-medium">
                              {s.slab === 'CUSTOM'
                                ? 'Tailored %'
                                : `₹${((systemServiceFee * s.percentage) / 100).toFixed(2)} / pass`}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Custom Percentage Input Field for Edit */}
                      {editCommissionSlab === 'CUSTOM' && (
                        <div className="rounded-[7px] border border-[#F9DE9B] bg-[#FEF7E6] p-3 animate-in fade-in space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-xs font-bold text-[#8F5A0D] flex items-center gap-1.5">
                              <Percent className="h-3.5 w-3.5 text-[#C98219]" />
                              <span>Custom Commission Percentage *</span>
                            </label>
                            <div className="relative w-28">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                required
                                value={editCommissionPercentage}
                                onChange={(e) => setEditCommissionPercentage(e.target.value)}
                                placeholder="e.g. 12"
                                className="w-full rounded-[6px] border border-[#D0D5DD] bg-white px-3 py-1.5 text-sm font-bold text-[#172033] focus:border-[#C98219] focus:outline-none pr-8 text-right"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#667085]">%</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-[#A66E14]">
                            Enter any tailored rate between 0% and 100% (e.g. 5%, 8%, 12%, 18%, 20%, 25%).
                          </p>
                        </div>
                      )}

                      <div className="rounded-[6px] bg-[#ECFDF3] border border-[#A6F4C5] p-2.5 text-[11.5px] text-[#027A48] flex items-center justify-between font-semibold">
                        <span>Partner Earns Per Pass:</span>
                        <span className="font-mono font-bold text-sm">
                          ₹{(((systemServiceFee * (parseFloat(editCommissionPercentage) || 0)) / 100)).toFixed(2)}
                          <span className="text-[10px] font-normal text-[#027A48] ml-1">
                            ({parseFloat(editCommissionPercentage) || 0}%)
                          </span>
                        </span>
                      </div>

                      <p className="text-[10.5px] text-[#667085] leading-relaxed">
                        💡 Percentage slab: When centres registered under {editName || 'this partner'} execute a booking, ₹{(((systemServiceFee * (parseFloat(editCommissionPercentage) || 0)) / 100)).toFixed(2)} is credited directly to the partner balance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Fixed Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6EAF0] mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#475467] hover:bg-[#F0F3F8] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-[7px] bg-[#C98219] px-5 py-2 text-xs font-bold text-white hover:bg-[#B57414] shadow-subtle flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Partner & Slab</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Proof Lightbox Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-[12px] border border-[#E6EAF0] bg-white p-6 shadow-modal space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-[#FEF7E6] text-[#8F5A0D] border border-[#F9DE9B] px-2 py-0.5 rounded font-bold">
                    {viewingReceipt.partnerCode}
                  </span>
                  <h3 className="text-base font-bold text-[#172033]">{viewingReceipt.partnerName}</h3>
                </div>
                <p className="text-xs text-[#667085] mt-0.5">
                  Payment Reference (UTR): <strong className="font-mono text-[#172033]">{viewingReceipt.paymentReference}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="rounded-[6px] p-1.5 text-[#667085] hover:bg-[#F0F3F8] hover:text-[#172033] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Image Preview Box */}
            <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-4 max-h-[65vh] overflow-auto flex items-center justify-center">
              <img
                src={viewingReceipt.imageUrl}
                alt={`Receipt proof for ${viewingReceipt.partnerName}`}
                className="max-h-[60vh] max-w-full object-contain rounded-[6px] shadow-xs"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-1">
              <a
                href={viewingReceipt.imageUrl}
                download={`receipt_${viewingReceipt.partnerCode}.jpg`}
                className="rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs font-bold text-[#172033] hover:bg-[#F8FAFC] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Screenshot</span>
              </a>

              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="rounded-[7px] bg-[#172033] px-5 py-2 text-xs font-bold text-white hover:bg-[#222E46] transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Partner Confirmation Modal */}
      {partnerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-[12px] border border-[#FDA29B] bg-white p-6 shadow-modal space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FEF3F2] text-[#D92D20] border border-[#FDA29B]">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#172033]">
                  Delete Partner Franchise?
                </h3>
                <p className="text-xs text-[#667085]">
                  Are you sure you want to delete <strong className="text-[#172033]">{partnerToDelete.name}</strong> (<span className="font-mono text-[#8F5A0D] font-bold">{partnerToDelete.partnerCode}</span>)?
                </p>
              </div>
            </div>

            <div className="rounded-[8px] bg-[#FEF3F2] border border-[#FDA29B] p-3 text-xs text-[#B42318] space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                This action cannot be undone.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#912018]">
                <li>Partner account & franchise profile will be permanently removed.</li>
                <li>All active onboarding invitation links for this partner will be revoked.</li>
                {partnerToDelete.totalRegisteredUsers > 0 && (
                  <li>
                    <strong>{partnerToDelete.totalRegisteredUsers} registered centre(s)</strong> will be safely preserved but unlinked from this partner.
                  </li>
                )}
              </ul>
            </div>

            {deleteError && (
              <div className="rounded-[7px] border border-[#FDA29B] bg-[#FEF3F2] p-2.5 text-xs text-[#D92D20] font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E6EAF0]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setPartnerToDelete(null);
                  setDeleteError(null);
                }}
                className="rounded-[7px] border border-[#D0D5DD] bg-white px-4 py-2 text-xs font-bold text-[#344054] hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeletePartner}
                className="rounded-[7px] bg-[#D92D20] px-4 py-2 text-xs font-bold text-white hover:bg-[#B42318] shadow-subtle flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting Partner...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Partner</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Partner Password Modal */}
      {partnerForPasswordReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-[14px] border border-[#E6EAF0] bg-white p-6 shadow-modal space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">
                    Set / Reset Partner Password
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
