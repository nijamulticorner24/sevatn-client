'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import {
  Building2,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Share2,
  AlertTriangle,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TA@';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
  'Viluppuram', 'Virudhunagar'
];

export default function DistributorCentresPage() {
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [distributorWallet, setDistributorWallet] = useState<{ availableBalance?: number; reservedBalance?: number } | null>(null);

  // Modals & Credential State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [credentialsData, setCredentialsData] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);

  // Form State
  const [createForm, setCreateForm] = useState({
    centreName: '',
    name: '',
    mobile: '',
    email: '',
    temporaryPassword: generateTempPassword(),
    district: 'Chennai',
    taluk: '',
    address: '',
    pincode: '',
    status: 'ACTIVE',
  });
  const [reissuingId, setReissuingId] = useState<string | null>(null);

  useEffect(() => {
    loadCentres();
  }, []);

  const loadCentres = async () => {
    try {
      const [res, me] = await Promise.allSettled([
        api.getDistributorCentres(1, 50),
        api.getMe(),
      ]);
      if (res.status === 'fulfilled') {
        setCentres(res.value?.centres || []);
      }
      if (me.status === 'fulfilled' && me.value?.wallet) {
        setDistributorWallet(me.value.wallet);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load centres:', err);
      setLoading(false);
    }
  };

  const handleReissueActivation = async (centre: any) => {
    setReissuingId(centre.id);
    try {
      const res = await api.reissueCentreActivation(centre.id);
      const code = res.centreCode || centre.centreCode;
      const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${code}` : `/c/${code}`;

      setCredentialsData({
        centreName: res.centreName || centre.centreName,
        centreCode: code,
        ownerName: res.ownerName || centre.user?.name,
        email: res.operatorEmail || centre.user?.email,
        mobile: res.mobile || centre.user?.mobile,
        temporaryPassword: res.temporaryPassword,
        portalUrl,
      });

      setIsCredsModalOpen(true);
      loadCentres();
    } catch (err: any) {
      alert(err.message || 'Failed to reissue temporary password');
    } finally {
      setReissuingId(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    try {
      const payload: any = {
        centreName: createForm.centreName.trim(),
        name: createForm.name.trim(),
        mobile: createForm.mobile.trim(),
        email: createForm.email.toLowerCase().trim(),
        temporaryPassword: createForm.temporaryPassword.trim() || undefined,
        district: createForm.district.trim(),
        taluk: createForm.taluk.trim(),
        address: createForm.address.trim() || undefined,
        pincode: createForm.pincode.trim() || undefined,
        status: createForm.status,
      };

      const res = await api.createCentre(payload);
      setIsCreateModalOpen(false);

      const code = res.centre.centreCode;
      const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${code}` : `/c/${code}`;

      setCredentialsData({
        centreName: res.centre.centreName,
        centreCode: code,
        ownerName: res.user.name,
        email: res.user.email,
        mobile: res.user.mobile,
        temporaryPassword: res.temporaryPassword || createForm.temporaryPassword,
        portalUrl,
      });

      setIsCredsModalOpen(true);
      setCreateForm({
        centreName: '',
        name: '',
        mobile: '',
        email: '',
        temporaryPassword: generateTempPassword(),
        district: 'Chennai',
        taluk: '',
        address: '',
        pincode: '',
        status: 'ACTIVE',
      });
      loadCentres();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create centre account');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!credentialsData) return;
    const text = `SevaTN — Booking Centre Account Provisioned\n\nCentre Name: ${credentialsData.centreName}\nCentre Code: ${credentialsData.centreCode}\nOperator Name: ${credentialsData.ownerName}\nLogin Email: ${credentialsData.email}\nMobile: ${credentialsData.mobile}\nTemporary Password: ${credentialsData.temporaryPassword}\n\nStation Direct Login Portal URL:\n${credentialsData.portalUrl}\n\nPlease visit your direct portal URL and change your temporary password upon initial sign in.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyPortalUrlOnly = () => {
    if (!credentialsData) return;
    navigator.clipboard.writeText(credentialsData.portalUrl);
    setCopiedPortalUrl(true);
    setTimeout(() => setCopiedPortalUrl(false), 2500);
  };

  const shareViaWhatsApp = () => {
    if (!credentialsData) return;
    const rawMobile = credentialsData.mobile?.replace(/\D/g, '') || '';
    const phone = rawMobile.length === 10 ? `91${rawMobile}` : rawMobile;
    const text = encodeURIComponent(
      `வணக்கம் ${credentialsData.ownerName},\n\nஉங்கள் SevaTN Booking Centre கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டுள்ளது.\n\nCentre Name: ${credentialsData.centreName}\nCentre Code: ${credentialsData.centreCode}\nLogin Email: ${credentialsData.email}\nTemporary Password: ${credentialsData.temporaryPassword}\n\nDirect Login Portal URL:\n${credentialsData.portalUrl}\n\nமுதல் முறை லாகின் செய்ய இந்த Portal URL-ஐப் பயன்படுத்தவும்.`,
    );
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
  };

  const filtered = centres.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.centreName?.toLowerCase().includes(q) ||
      c.centreCode?.toLowerCase().includes(q) ||
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.mobile?.includes(q) ||
      c.user?.email?.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q) ||
      c.taluk?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <LoadingSkeleton rows={4} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-xs text-[#8F5A0D] font-bold mb-3">
            <Building2 className="h-3.5 w-3.5 text-[#C98219]" />
            <span>Centre Network Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            My Centres ({centres.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Centres created and managed under your Distributor account.
          </p>
        </div>

        {/* Primary Action: Instant Account Creation */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setCreateForm((prev) => ({ ...prev, temporaryPassword: generateTempPassword() }));
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-[8px] bg-[#C98219] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#A86B14] transition-all shadow-subtle cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Centre Account</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#667085]" />
        <input
          type="text"
          placeholder="Search by centre name, code, operator, mobile, district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[8px] border border-[#E6EAF0] bg-white pl-9 pr-3 py-2 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
        />
      </div>

      {/* Centres Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#667085]">
            <Building2 className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
            <p className="font-semibold text-[#172033]">No Centres Found</p>
            <p className="mt-1">Create your first centre account or issue an onboarding invitation.</p>
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setCreateForm((prev) => ({ ...prev, temporaryPassword: generateTempPassword() }));
                setIsCreateModalOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-[7px] bg-[#C98219] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#A86B14]"
            >
              <Plus className="h-4 w-4" />
              <span>Create Centre Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] uppercase tracking-wider font-semibold border-b border-[#E6EAF0]">
                <tr>
                  <th className="py-3 px-4">Centre Name & Code</th>
                  <th className="py-3 px-4">Operator Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Direct Station URL</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0]">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#172033]">
                      <div>{c.centreName}</div>
                      <div className="text-[10.5px] font-mono text-[#C98219] font-bold">
                        {c.centreCode || 'PENDING'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#475467]">
                      <div className="font-medium text-[#172033]">{c.user?.name}</div>
                      <div className="text-[10.5px] font-mono text-[#175CD3]">{c.user?.mobile}</div>
                      {c.user?.email && (
                        <div className="text-[10px] text-[#667085] truncate max-w-[160px]">{c.user?.email}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#667085]">
                      <div>{c.district} {c.taluk ? `(${c.taluk})` : ''}</div>
                      {c.address && <div className="text-[10.5px] text-[#98A2B3] truncate max-w-[180px]">{c.address}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.centreCode ? (
                        <a
                          href={`/c/${c.centreCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#175CD3] bg-[#EFF8FF] px-2 py-0.5 rounded border border-[#B2DDFF] hover:bg-[#D1E9FF] transition-colors"
                          title="Open dedicated Centre Login Portal"
                        >
                          <span>/c/{c.centreCode}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-[#98A2B3] text-[10.5px]">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.status === 'ACTIVE' ? (
                        <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-[10px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                          {c.status}
                        </span>
                      )}
                      {c.user?.mustChangePassword && (
                        <span className="flex items-center gap-1 mt-1 text-[9.5px] text-[#8F5A0D] font-semibold">
                          <KeyRound className="h-2.5 w-2.5" />
                          <span>First Login Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#667085] whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleReissueActivation(c)}
                        disabled={reissuingId === c.id}
                        className="inline-flex items-center gap-1 rounded-[6px] border border-[#E6EAF0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#344054] hover:text-[#C98219] hover:border-[#C98219] hover:bg-[#FEF7E6] shadow-xs transition-colors disabled:opacity-50"
                        title="Reissue / Show Temporary Activation Password"
                      >
                        {reissuingId === c.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin text-[#C98219]" />
                        ) : (
                          <KeyRound className="h-3 w-3 text-[#C98219]" />
                        )}
                        <span>Temp Password</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE NEW CENTRE ACCOUNT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-[12px] border border-[#E6EAF0] bg-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#C98219] text-white shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033] tracking-tight">Create New Centre Account</h3>
                  <p className="text-xs text-[#667085]">Instant onboarding and credential provisioning under your Distributor network</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#172033] hover:bg-[#F2F4F7] transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {actionError && (
                <div className="p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Commercial Profile & Location */}
                <div className="space-y-3.5 rounded-[10px] border border-[#E6EAF0] bg-[#FDFEFE] p-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#F2F4F7]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FDF7ED] text-[#C98219] font-bold text-[10.5px]">
                      1
                    </span>
                    <h4 className="font-bold text-[#172033] uppercase tracking-wider text-[11px]">
                      Commercial Profile & Location
                    </h4>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#344054] mb-1">
                      Centre Commercial Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.centreName}
                      onChange={(e) => setCreateForm({ ...createForm, centreName: e.target.value })}
                      placeholder="e.g. Sri Murugan CSC & Online Centre"
                      className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#344054] mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={createForm.district}
                        onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                      >
                        {TN_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#344054] mb-1">
                        Taluk <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={createForm.taluk}
                        onChange={(e) => setCreateForm({ ...createForm, taluk: e.target.value })}
                        placeholder="e.g. Madurai South"
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#344054] mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={createForm.address}
                        onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                        placeholder="e.g. 12, West Masi Street"
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#344054] mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={createForm.pincode}
                        onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                        placeholder="625001"
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                      />
                    </div>
                  </div>
                </div>

                {/* Operator Account & Credential Settings */}
                <div className="space-y-3.5 rounded-[10px] border border-[#E6EAF0] bg-[#FDFEFE] p-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#F2F4F7]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EDF4FC] text-[#3568A8] font-bold text-[10.5px]">
                      2
                    </span>
                    <h4 className="font-bold text-[#172033] uppercase tracking-wider text-[11px]">
                      Operator Login Account (Role: CENTRE)
                    </h4>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#344054] mb-1">
                      Operator / Owner Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g. S. Muthu Kumar"
                      className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#344054] mb-1">
                        Mobile (WhatsApp) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={createForm.mobile}
                        onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value.replace(/\D/g, '') })}
                        placeholder="9443100001"
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#344054] mb-1">
                        Login Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="muthu.centre@gmail.com"
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-[#344054]">
                        Temporary Activation Password <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, temporaryPassword: generateTempPassword() })}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C98219] hover:underline"
                        title="Generate a new temporary password"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Regenerate</span>
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#C98219]">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={createForm.temporaryPassword}
                        onChange={(e) => setCreateForm({ ...createForm, temporaryPassword: e.target.value })}
                        placeholder="e.g. TA@8K9L2M"
                        className="w-full rounded-[7px] border border-[#D0D5DD] pl-8 pr-3 py-2 text-xs font-mono font-bold text-[#172033] bg-[#FEF7E6]/40 focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] tracking-wider"
                      />
                    </div>
                    <p className="text-[10.5px] text-[#667085] mt-1">
                      Auto-generated password provided to the centre operator for first-time sign in.
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Deduction and Onboarding Fee Box */}
              <div className="rounded-[10px] border border-[#E6EAF0] bg-[#F8FAFC] p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-md bg-[#FEF7E6] border border-[#F9DE9B] flex items-center justify-center text-[#C98219]">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#172033] block">Distributor Wallet Balance</span>
                      <span className="text-[11px] text-[#667085]">
                        Available: {distributorWallet?.availableBalance !== undefined ? formatINR(Number(distributorWallet.availableBalance)) : '🪙 ...'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#172033] text-sm block">🪙 249.00</span>
                    <span className="text-[10.5px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Auto-Deducted On Creation
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#475467] leading-relaxed pt-1 border-t border-[#EAECF0]">
                  🪙 249.00 will be debited from your distributor wallet to fully activate this centre account. 
                  The centre operator will <span className="font-semibold text-emerald-700">never be asked to pay an onboarding fee</span> on login and will have instant access to book darshan.
                </p>
                {distributorWallet?.availableBalance !== undefined && Number(distributorWallet.availableBalance) < 249 && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 mt-2 font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>Insufficient wallet balance. Please recharge your distributor wallet before creating new centre accounts.</span>
                  </div>
                )}
              </div>

              {/* Informational Note */}
              <div className="rounded-[8px] border border-[#F9DE9B] bg-[#FEF7E6] p-3 text-[11px] text-[#8F5A0D] flex items-start gap-2">
                <span className="text-sm">💡</span>
                <span>
                  A secure temporary activation password and dedicated Centre Portal URL (<code className="font-mono font-bold">/c/[code]</code>) will be generated. The operator will create their permanent private password upon first sign in.
                </span>
              </div>

              {/* Modal Action Footer */}
              <div className="pt-3 border-t border-[#E6EAF0] flex items-center justify-between gap-3 bg-white">
                <span className="text-[11px] text-[#667085]">
                  Fields marked with <span className="text-red-500">*</span> are mandatory
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-[7px] border border-[#D0D5DD] text-[#344054] hover:bg-[#F2F4F7] text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || (distributorWallet?.availableBalance !== undefined && Number(distributorWallet.availableBalance) < 249)}
                    className="flex items-center gap-2 px-5 py-2 rounded-[7px] bg-[#C98219] hover:bg-[#A86B14] text-white text-xs font-bold shadow-subtle transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{submitting ? 'Creating Centre...' : 'Create & Deduct 249 Chips from Wallet'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TEMPORARY ACTIVATION CREDENTIALS POPUP */}
      {isCredsModalOpen && credentialsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-[12px] border border-[#E6EAF0] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#172033] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#C98219] text-white shadow-sm">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Temporary Activation Credentials</h3>
                  <p className="text-[11px] text-[#98A2B3]">Provide to centre operator for first-time sign in</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCredsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="rounded-[10px] border border-[#E6EAF0] bg-[#F8FAFC] p-4 space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-[#E6EAF0]">
                  <span className="text-[#667085]">Centre Name:</span>
                  <span className="font-bold text-[#172033]">{credentialsData.centreName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E6EAF0]">
                  <span className="text-[#667085]">Centre Code:</span>
                  <span className="font-mono font-bold text-[#C98219]">{credentialsData.centreCode}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E6EAF0]">
                  <span className="text-[#667085]">Operator Name:</span>
                  <span className="font-semibold text-[#172033]">{credentialsData.ownerName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E6EAF0]">
                  <span className="text-[#667085]">Login Identifier:</span>
                  <span className="font-mono font-bold text-[#172033]">{credentialsData.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-amber-50 -mx-2 px-3 rounded-md border border-amber-200">
                  <span className="text-amber-900 font-semibold">Temporary Password:</span>
                  <span className="font-mono font-bold text-amber-950 text-sm tracking-wider select-all">
                    {credentialsData.temporaryPassword}
                  </span>
                </div>
              </div>

              {/* UNIQUE CENTRE LOGIN PORTAL URL CARD */}
              <div className="rounded-[10px] border-2 border-emerald-500/30 bg-emerald-50/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    <span>Unique Centre Login Portal URL</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Station Direct URL
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Provide this direct link to the operator. Visiting this URL recognizes their centre and opens their dedicated login portal:
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="text"
                    readOnly
                    value={credentialsData.portalUrl}
                    className="flex-1 rounded-[7px] border border-emerald-300 bg-white px-3 py-2 text-xs font-mono text-emerald-950 select-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={copyPortalUrlOnly}
                    className="flex items-center gap-1 px-3 py-2 rounded-[7px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
                    title="Copy Portal URL"
                  >
                    {copiedPortalUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedPortalUrl ? 'Copied!' : 'Copy URL'}</span>
                  </button>
                  <a
                    href={credentialsData.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 rounded-[7px] border border-emerald-300 bg-white hover:bg-emerald-100/60 text-emerald-800 text-xs font-semibold transition-colors shrink-0"
                    title="Open Centre Portal in New Tab"
                  >
                    <span>Open</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <div className="rounded-[8px] bg-[#EAF7EE] border border-[#BFE4C9] p-3 text-[11.5px] text-[#198754] leading-relaxed flex items-start gap-2">
                <span className="text-sm">✅</span>
                <span>
                  <strong>Full Activation Guaranteed:</strong> The onboarding fee of 🪙 249.00 has been debited directly from your Distributor Wallet. The operator will <strong>never be asked for payment</strong> on login and only needs to set their permanent password to start booking.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-[#E6EAF0]">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={copyCredentials}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[7px] bg-[#172033] text-white hover:bg-[#263550] text-xs font-bold transition-colors shadow-subtle cursor-pointer"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Copied!' : 'Copy All Details'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={shareViaWhatsApp}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[7px] bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold transition-colors shadow-subtle cursor-pointer"
                    title="Send Credentials via WhatsApp"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCredsModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-[7px] bg-[#C98219] text-white hover:bg-[#B57414] text-xs font-bold shadow-subtle transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
