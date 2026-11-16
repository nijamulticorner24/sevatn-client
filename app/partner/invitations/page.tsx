'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useSocketStatus, useLiveEvent } from '@/lib/useSocket';
import { useToast } from '@/components/ui/Toast';
import {
  Share2,
  Copy,
  Check,
  Building2,
  Clock,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Plus,
  KeyRound,
  ExternalLink,
  X,
  Radio,
  BellRing,
  UserPlus,
} from 'lucide-react';

const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
  'Viluppuram', 'Virudhunagar'
];

// Live Countdown Timer for 30-minute links
function LiveExpiryBadge({
  expiresAt,
  status,
  onExpired,
}: {
  expiresAt: string | Date;
  status?: string;
  onExpired?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<{ mins: number; secs: number; isExpired: boolean }>({
    mins: 0,
    secs: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (status === 'USED') return;

    const update = () => {
      const exp = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, exp - now);

      if (diff <= 0) {
        setTimeLeft({ mins: 0, secs: 0, isExpired: true });
        if (onExpired) onExpired();
      } else {
        const totalSecs = Math.floor(diff / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setTimeLeft({ mins, secs, isExpired: false });
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, status, onExpired]);

  if (status === 'USED') {
    return (
      <span className="rounded bg-[#EAF7EE] px-2.5 py-0.5 text-[10.5px] font-bold text-[#198754] border border-[#C3E6CB] inline-flex items-center gap-1.5">
        <CheckCircle2 className="h-3 w-3 text-[#198754]" />
        Onboard Completed
      </span>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <span className="rounded bg-[#FDECEC] px-2 py-0.5 text-[10.5px] font-bold text-[#C2413B] border border-[#F5C6CB] inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Expired
      </span>
    );
  }

  return (
    <span className="rounded bg-[#FEF7E6] px-2.5 py-0.5 text-[11px] font-bold text-[#8F5A0D] border border-[#F9DE9B] inline-flex items-center gap-1.5 tabular-nums">
      <span className="h-1.5 w-1.5 rounded-full bg-[#C98219] animate-pulse" />
      Expires in {timeLeft.mins}m {timeLeft.secs.toString().padStart(2, '0')}s
    </span>
  );
}

export default function PartnerInvitationsPage() {
  const toast = useToast();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'DIRECT' | 'DISTRIBUTOR'>('ALL');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Tab mode in the Onboarding Hub card
  const [onboardMode, setOnboardMode] = useState<'DIRECT' | 'LINK'>('DIRECT');

  // Direct Create Account Modal & Credentials Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [credentialsData, setCredentialsData] = useState<any>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);
  const [directSubmitting, setDirectSubmitting] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  // Direct Form State
  const [createForm, setCreateForm] = useState({
    centreName: '',
    name: '',
    mobile: '',
    email: '',
    district: 'Chennai',
    taluk: '',
    address: '',
    pincode: '',
    centreCode: '',
    validityDays: 365,
    status: 'ACTIVE',
    distributorId: '',
  });

  // 30-Min Link Form State
  const [shopName, setShopName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Madurai');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInvite, setSuccessInvite] = useState<any | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [liveToast, setLiveToast] = useState<{ title: string; message: string } | null>(null);

  // WebSocket Live Updates
  const { isConnected } = useSocketStatus();

  useLiveEvent('partner:centre_activated', (data: any) => {
    console.log('⚡ [Live Event] Partner Centre Activated:', data);
    setLiveToast({
      title: 'Centre Activated in Real-Time!',
      message: `${data.centreName || 'eSevai Centre'} (${data.centreCode || 'TN-CTR'}) is now live in your partner network.`,
    });
    loadInvitations();
    setTimeout(() => setLiveToast(null), 8000);
  });

  useLiveEvent('centre:activated', () => {
    loadInvitations();
  });

  useEffect(() => {
    loadInvitations();
    loadDistributors();
  }, []);

  const loadInvitations = async () => {
    try {
      const res = await api.getPartnerInvitations();
      setInvitations(res.invitations || []);
      setLoading(false);
    } catch (err) {
      console.warn('Failed to load partner invitations:', err);
      setLoading(false);
    }
  };

  const loadDistributors = async () => {
    try {
      const res = await api.getPartnerDistributors();
      const list = Array.isArray(res) ? res : res?.distributors || [];
      setDistributors(list);
    } catch (err) {
      console.warn('Failed to load partner distributors:', err);
    }
  };

  const handleDirectCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectSubmitting(true);
    setDirectError(null);

    try {
      const payload: any = {
        centreName: createForm.centreName.trim(),
        name: createForm.name.trim(),
        mobile: createForm.mobile.trim(),
        email: createForm.email.toLowerCase().trim(),
        district: createForm.district.trim(),
        taluk: createForm.taluk.trim(),
        address: createForm.address.trim() || undefined,
        pincode: createForm.pincode.trim() || undefined,
        centreCode: createForm.centreCode.trim() || undefined,
        validityDays: createForm.validityDays,
        status: createForm.status,
      };

      if (createForm.distributorId.trim() !== '') {
        payload.distributorId = createForm.distributorId.trim();
      }

      const res = await api.createCentre(payload);
      setIsCreateModalOpen(false);

      const code = res.centre?.centreCode || res.code || 'TN-CTR';
      const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${code}` : `/c/${code}`;

      setCredentialsData({
        centreName: res.centre?.centreName || createForm.centreName,
        centreCode: code,
        ownerName: res.user?.name || createForm.name,
        email: res.user?.email || createForm.email,
        mobile: res.user?.mobile || createForm.mobile,
        temporaryPassword: res.temporaryPassword,
        portalUrl,
      });

      setIsCredsModalOpen(true);
      setCreateForm({
        centreName: '',
        name: '',
        mobile: '',
        email: '',
        district: 'Chennai',
        taluk: '',
        address: '',
        pincode: '',
        centreCode: '',
        validityDays: 365,
        status: 'ACTIVE',
        distributorId: '',
      });
      loadInvitations();
    } catch (err: any) {
      setDirectError(err.message || 'Failed to create centre account');
    } finally {
      setDirectSubmitting(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessInvite(null);

    if (!shopName.trim()) {
      setErrorMsg('Please enter Shop / Centre Name');
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.createPartnerInvitation({
        shopName: shopName.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        district: district.trim() || undefined,
        expiresInMinutes: 30, // 30-minute validity
      });

      setSuccessInvite(res.invitation);
      setShopName('');
      setMobile('');
      setEmail('');
      loadInvitations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate invitation link');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async (id: string) => {
    setRegeneratingId(id);
    try {
      const res = await api.regeneratePartnerInvitation(id);
      setSuccessInvite(res.invitation);
      toast.success('Invitation link successfully regenerated.');
      loadInvitations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate link');
    } finally {
      setRegeneratingId(null);
    }
  };

  const copyUrl = (token: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/service/register/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const shareWhatsApp = (token: string, shop: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/service/register/${token}`;
    const text = encodeURIComponent(
      `வணக்கம் ${shop || 'Operator'},\n\nSevaTN — TicketAssist pilgrim booking centre registration link (Valid for 30 minutes):\n${fullUrl}\n\nPlease complete your registration within 30 minutes to activate your eSevai centre.`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const copyCredentials = () => {
    if (!credentialsData) return;
    const text = `SevaTN — eSevai Centre Account Provisioned\n\nCentre Name: ${credentialsData.centreName}\nCentre Code: ${credentialsData.centreCode}\nOperator Name: ${credentialsData.ownerName}\nLogin Email: ${credentialsData.email}\nMobile: ${credentialsData.mobile}\nTemporary Password: ${credentialsData.temporaryPassword}\n\nStation Direct Login Portal URL:\n${credentialsData.portalUrl}\n\nPlease visit your direct portal URL and change your temporary password upon initial sign in.`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const copyPortalUrlOnly = () => {
    if (!credentialsData) return;
    navigator.clipboard.writeText(credentialsData.portalUrl);
    setCopiedPortalUrl(true);
    setTimeout(() => setCopiedPortalUrl(false), 2500);
  };

  const shareCredentialsViaWhatsApp = () => {
    if (!credentialsData) return;
    const rawMobile = credentialsData.mobile?.replace(/\D/g, '') || '';
    const phone = rawMobile.length === 10 ? `91${rawMobile}` : rawMobile;
    const text = encodeURIComponent(
      `வணக்கம் ${credentialsData.ownerName || 'Operator'},\n\nYour SevaTN eSevai Centre account has been created & activated!\n\n🏢 Centre: ${credentialsData.centreName} (${credentialsData.centreCode})\n👤 Operator: ${credentialsData.ownerName}\n✉️ Email: ${credentialsData.email}\n🔑 Temporary Password: ${credentialsData.temporaryPassword}\n\n🔗 Direct Station Login URL:\n${credentialsData.portalUrl}\n\nPlease visit your direct portal link and log in to begin booking pilgrim tickets.`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
  };

  // Metrics
  const totalInvitations = invitations.length;
  const activatedCount = invitations.filter((i) => i.isActivated && !!i.activatedCentre).length;
  const activePendingCount = invitations.filter(
    (i) => i.status === 'ACTIVE' && new Date(i.expiresAt).getTime() > Date.now(),
  ).length;

  return (
    <div className="w-full space-y-6">
      {/* Live WebSocket Toast Banner */}
      {liveToast && (
        <div className="rounded-[10px] border border-[#C3E6CB] bg-[#EAF7EE] p-4 text-[#106A3B] shadow-subtle flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center text-[#198754] border border-[#C3E6CB] shadow-xs">
              <BellRing className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#198754]">{liveToast.title}</p>
              <p className="text-xs text-[#106A3B] mt-0.5">{liveToast.message}</p>
            </div>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-xs font-bold text-[#198754] hover:underline px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
            <Share2 className="h-4 w-4" />
            <span>Partner Network Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            Onboard New eSevai Centres
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Provision centres directly with instant activation or generate secure 30-minute self-registration links.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
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
            <span>{isConnected ? 'LIVE SYNC' : 'CONNECTING...'}</span>
          </span>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-[8px] bg-[#C98219] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Centre Account</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Total Links & Invites
            </span>
            <div className="text-2xl font-extrabold text-[#172033] mt-0.5">
              {loading ? '—' : totalInvitations}
            </div>
          </div>
          <div className="rounded-[8px] bg-[#F7F9FC] p-2.5 text-[#172033] border border-[#E6EAF0]">
            <Share2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-[10px] border border-[#C3E6CB] bg-[#EAF7EE] p-4 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#198754] uppercase tracking-wider">
              Activated Network Centres
            </span>
            <div className="text-2xl font-extrabold text-[#198754] mt-0.5">
              {loading ? '—' : activatedCount}
            </div>
          </div>
          <div className="rounded-[8px] bg-white p-2.5 text-[#198754] border border-[#C3E6CB]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6] p-4 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8F5A0D] uppercase tracking-wider">
              Active Pending Links (&lt;30m)
            </span>
            <div className="text-2xl font-extrabold text-[#8F5A0D] mt-0.5">
              {loading ? '—' : activePendingCount}
            </div>
          </div>
          <div className="rounded-[8px] bg-white p-2.5 text-[#C98219] border border-[#F9DE9B]">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Onboarding Mode Selector Hub */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-[#E6EAF0] bg-[#F8FAFC]">
          <button
            onClick={() => setOnboardMode('DIRECT')}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              onboardMode === 'DIRECT'
                ? 'border-[#C98219] bg-white text-[#C98219]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Direct Create Centre Account (Instant Activation)</span>
          </button>
          <button
            onClick={() => setOnboardMode('LINK')}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              onboardMode === 'LINK'
                ? 'border-[#C98219] bg-white text-[#C98219]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate 30-Minute Self-Registration Link</span>
          </button>
        </div>

        {/* Tab 1: Direct Create Centre Form */}
        {onboardMode === 'DIRECT' && (
          <div className="p-6 sm:p-7">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#C98219]" />
                Direct Provisioning: Create New Centre Account
              </h2>
              <p className="text-xs text-[#667085] mt-1">
                Instantly provision the centre with an operator account, generated credentials, and station portal URL.
              </p>
            </div>

            <form onSubmit={handleDirectCreate} className="space-y-5">
              {directError && (
                <div className="rounded-[7px] border border-[#F5C6CB] bg-[#FDECEC] p-3 text-xs text-[#C2413B] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{directError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Commercial Profile */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] pb-1 border-b border-[#E6EAF0]">
                    1. Commercial Profile & Territory
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Centre / Shop Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.centreName}
                      onChange={(e) => setCreateForm({ ...createForm, centreName: e.target.value })}
                      placeholder="e.g. Sri Murugan eSevai Maiyam"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Assigned Distributor (Optional)
                    </label>
                    <select
                      value={createForm.distributorId}
                      onChange={(e) => setCreateForm({ ...createForm, distributorId: e.target.value })}
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                    >
                      <option value="">Direct Franchise Centre (Direct Partner Oversight)</option>
                      {distributors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.distributorCode}) — {d.district || 'Distributor'}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10.5px] text-[#667085] mt-1">
                      Assign to one of your regional distributors or manage directly under your partner franchise.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        District *
                      </label>
                      <select
                        value={createForm.district}
                        onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                      >
                        {TN_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Taluk / Block *
                      </label>
                      <input
                        type="text"
                        required
                        value={createForm.taluk}
                        onChange={(e) => setCreateForm({ ...createForm, taluk: e.target.value })}
                        placeholder="e.g. Madurai South"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Shop Street Address
                      </label>
                      <input
                        type="text"
                        value={createForm.address}
                        onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                        placeholder="Door / Street name"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={createForm.pincode}
                        onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value.replace(/\D/g, '') })}
                        placeholder="625001"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Operator & Access */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] pb-1 border-b border-[#E6EAF0]">
                    2. Operator Profile & Station Access
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Operator / Owner Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g. S. Murugesan"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Contact Mobile *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={createForm.mobile}
                        onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value.replace(/\D/g, '') })}
                        placeholder="9876543210"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Login Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="centre@gmail.com"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Station Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={createForm.centreCode}
                        onChange={(e) => setCreateForm({ ...createForm, centreCode: e.target.value.toUpperCase() })}
                        placeholder="Auto (e.g. TN-CTR-042)"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Validity Days
                      </label>
                      <select
                        value={createForm.validityDays}
                        onChange={(e) => setCreateForm({ ...createForm, validityDays: parseInt(e.target.value, 10) })}
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                      >
                        <option value={365}>365 Days (1 Year License)</option>
                        <option value={180}>180 Days (6 Months)</option>
                        <option value={90}>90 Days (Quarterly)</option>
                        <option value={30}>30 Days (Trial)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Account Status
                    </label>
                    <select
                      value={createForm.status}
                      onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIVE (Immediate Booking Enabled)</option>
                      <option value="INACTIVE">INACTIVE (Hold)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#E6EAF0]">
                <div className="text-[11.5px] text-[#667085] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#198754]" />
                  <span>Instant Provisioning: Temporary login credentials and Station URL will be generated immediately.</span>
                </div>

                <button
                  type="submit"
                  disabled={directSubmitting}
                  className="rounded-[7px] bg-[#C98219] px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {directSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Centre...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Create Centre Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: 30-Minute Self-Registration Link */}
        {onboardMode === 'LINK' && (
          <div className="p-6 sm:p-7">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C98219]" />
                Generate 30-Minute Centre Registration Link
              </h2>
              <p className="text-xs text-[#667085] mt-1">
                Share a one-time registration link with centre operators to allow self-onboarding.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Shop / Centre Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Murugan eSevai Centre"
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="centre@gmail.com"
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2.5 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                  >
                    {TN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-[7px] border border-[#F5C6CB] bg-[#FDECEC] p-3 text-xs text-[#C2413B] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <div className="text-[11.5px] text-[#667085] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#C98219]" />
                  <span>Security Rule: Each link is single-use and automatically expires in <strong>30 minutes</strong>.</span>
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="rounded-[7px] bg-[#C98219] px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating Link...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Onboarding Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Freshly Generated Link Banner */}
      {successInvite && (
        <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6] p-5 sm:p-6 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#198754]" />
              <h3 className="text-sm sm:text-base font-bold text-[#172033]">
                Fresh 30-Minute Onboarding Link Generated for{' '}
                <span className="text-[#8F5A0D]">
                  {(successInvite.metadata as any)?.shopName || 'Centre'}
                </span>
              </h3>
            </div>
            <LiveExpiryBadge expiresAt={successInvite.expiresAt} status={successInvite.status} />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/service/register/${successInvite.token}`}
              className="flex-1 rounded-[7px] border border-[#E8D5B7] bg-white px-3.5 py-2 text-xs font-mono text-[#172033] select-all focus:outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyUrl(successInvite.token, successInvite.id)}
                className="rounded-[7px] bg-[#C98219] px-4 py-2 text-xs font-bold text-white hover:bg-[#B57414] transition-colors flex items-center gap-1.5"
              >
                {copiedId === successInvite.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedId === successInvite.id ? 'Copied' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() =>
                  shareWhatsApp(
                    successInvite.token,
                    (successInvite.metadata as any)?.shopName,
                  )
                }
                className="rounded-[7px] bg-[#25D366] px-4 py-2 text-xs font-bold text-white hover:bg-[#1EBE5D] transition-colors flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Onboarding Links History Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#172033]">
              Network Centre Invitation Links ({invitations.length})
            </h3>
            <p className="text-xs text-[#667085]">
              Real-time sync: Monitor both direct franchise invites and links issued by your subordinate distributors.
            </p>
          </div>
          <button
            onClick={loadInvitations}
            className="text-xs font-bold text-[#C98219] hover:underline flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Source Filter Tabs */}
        <div className="px-5 pt-3 border-b border-[#E6EAF0] bg-white flex gap-5 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`pb-2.5 border-b-2 transition-all shrink-0 ${
              filterType === 'ALL'
                ? 'border-[#C98219] text-[#C98219] font-bold'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            All Network Links ({invitations.length})
          </button>
          <button
            onClick={() => setFilterType('DIRECT')}
            className={`pb-2.5 border-b-2 transition-all shrink-0 ${
              filterType === 'DIRECT'
                ? 'border-[#C98219] text-[#C98219] font-bold'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            Direct Partner Links ({invitations.filter((i) => i.type !== 'DISTRIBUTOR_INVITE').length})
          </button>
          <button
            onClick={() => setFilterType('DISTRIBUTOR')}
            className={`pb-2.5 border-b-2 transition-all shrink-0 ${
              filterType === 'DISTRIBUTOR'
                ? 'border-[#C98219] text-[#C98219] font-bold'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            Distributor Generated Links ({invitations.filter((i) => i.type === 'DISTRIBUTOR_INVITE').length})
          </button>
        </div>

        {invitations.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">
            <Building2 className="mx-auto h-8 w-8 text-[#98A2B3] mb-2 opacity-50" />
            <p className="font-bold text-[#172033]">No Invitations Generated Yet</p>
            <p className="mt-0.5">Use the form above to create your first 30-minute centre onboarding link.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#E6EAF0]">
                <tr>
                  <th className="py-3 px-4">Centre / Shop Name</th>
                  <th className="py-3 px-4">Issued By</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Registered Code</th>
                  <th className="py-3 px-4">30-Min Expiry Status</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0] bg-white">
                {invitations
                  .filter((i) => {
                    if (filterType === 'DIRECT') return i.type !== 'DISTRIBUTOR_INVITE';
                    if (filterType === 'DISTRIBUTOR') return i.type === 'DISTRIBUTOR_INVITE';
                    return true;
                  })
                  .map((inv) => {
                  const meta = inv.metadata || {};
                  const isActivated = inv.status === 'USED' || inv.isActivated;
                  const isExpired =
                    !isActivated &&
                    (inv.status === 'EXPIRED' ||
                      new Date(inv.expiresAt).getTime() <= Date.now());

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${
                        isActivated ? 'bg-[#FAFDFB] hover:bg-[#F2FAF4]' : 'hover:bg-[#FAFBFD]'
                      }`}
                    >
                      {/* Shop Name */}
                      <td className="py-3 px-4 font-bold text-[#172033]">
                        <div className="flex items-center gap-1.5">
                          {isActivated && <CheckCircle2 className="h-4 w-4 text-[#198754] shrink-0" />}
                          <span>{meta.shopName || inv.activatedCentre?.centreName || 'eSevai Registration Link'}</span>
                        </div>
                        <span className="block text-[11px] font-normal text-[#667085]">
                          Created {formatDate(inv.createdAt)}
                        </span>
                      </td>

                      {/* Issued By */}
                      <td className="py-3 px-4">
                        {inv.type === 'DISTRIBUTOR_INVITE' ? (
                          <div>
                            <span className="font-semibold text-[#175CD3] block">
                              {inv.distributor?.name || meta.distributorName || 'Distributor'}
                            </span>
                            <span className="font-mono text-[9.5px] font-bold text-[#175CD3] bg-[#EFF8FF] px-1.5 py-0.5 rounded border border-[#B2DDFF]">
                              {inv.distributor?.distributorCode || meta.distributorCode || 'DT'}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#172033] bg-[#F8FAFC] px-2 py-0.5 rounded text-[10.5px] border border-[#E6EAF0]">
                            Partner (Direct)
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-[#475467]">
                        <span className="font-mono font-semibold text-[#172033] block">
                          {meta.mobile || '—'}
                        </span>
                        {meta.email && (
                          <span className="text-[11px] text-[#667085] block truncate max-w-[140px]">
                            {meta.email}
                          </span>
                        )}
                      </td>

                      {/* Registered Centre Code / Token */}
                      <td className="py-3 px-4">
                        {isActivated && inv.activatedCentre ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EAF7EE] text-[#198754] border border-[#C3E6CB]">
                              {inv.activatedCentre.centreCode || '—'}
                            </span>
                            {inv.usedAt && (
                              <span className="block text-[10.5px] text-[#667085] mt-0.5">
                                Joined {formatDate(inv.usedAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-[#8F5A0D]">
                            {inv.token.slice(0, 16)}...
                          </span>
                        )}
                      </td>

                      {/* 30-Min Expiry Status */}
                      <td className="py-3 px-4">
                        <LiveExpiryBadge
                          expiresAt={inv.expiresAt}
                          status={isActivated ? 'USED' : inv.status}
                        />
                      </td>

                      {/* Status Pill */}
                      <td className="py-3 px-4">
                        {isActivated ? (
                          <span className="rounded bg-[#EAF7EE] px-2.5 py-1 text-[10.5px] font-bold text-[#198754] border border-[#C3E6CB] inline-flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#198754]" />
                            ACTIVATED
                          </span>
                        ) : isExpired ? (
                          <span className="rounded bg-[#FDECEC] px-2 py-0.5 text-[10.5px] font-bold text-[#C2413B] border border-[#F5C6CB] inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            EXPIRED
                          </span>
                        ) : (
                          <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-[10.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B] inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#C98219] animate-pulse" />
                            PENDING ONBOARD
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActivated ? (
                            <Link
                              href="/partner/centres"
                              className="rounded-[6px] border border-[#C3E6CB] bg-[#EAF7EE] px-3 py-1.5 text-[11px] font-bold text-[#198754] hover:bg-[#D8F3DF] transition-colors inline-flex items-center gap-1.5 shadow-sm"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>View in Network</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          ) : !isExpired && inv.status === 'ACTIVE' ? (
                            <>
                              <button
                                onClick={() => copyUrl(inv.token, inv.id)}
                                className="rounded-[6px] border border-[#E6EAF0] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-bold text-[#172033] hover:border-[#C98219] hover:bg-[#FDF7ED] transition-colors flex items-center gap-1"
                              >
                                {copiedId === inv.id ? (
                                  <Check className="h-3 w-3 text-[#198754]" />
                                ) : (
                                  <Copy className="h-3 w-3 text-[#C98219]" />
                                )}
                                <span>{copiedId === inv.id ? 'Copied' : 'Copy'}</span>
                              </button>
                              <button
                                onClick={() => shareWhatsApp(inv.token, meta.shopName)}
                                className="rounded-[6px] bg-[#25D366] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#1EBE5D] transition-colors flex items-center gap-1"
                              >
                                <Send className="h-3 w-3" />
                                <span>WhatsApp</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRegenerate(inv.id)}
                              disabled={regeneratingId === inv.id}
                              className="rounded-[6px] bg-[#C98219] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center gap-1"
                            >
                              <RefreshCw
                                className={`h-3 w-3 ${regeneratingId === inv.id ? 'animate-spin' : ''}`}
                              />
                              <span>Regenerate (30m)</span>
                            </button>
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

      {/* POPUP MODAL: Create New Centre Account */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-[14px] border border-[#E6EAF0] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] px-6 py-4 bg-[#F8FAFC]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#172033] flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#C98219]" />
                  Create New Centre Account
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Direct provisioning for your partner franchise network.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-md p-1.5 text-[#667085] hover:bg-[#E6EAF0] hover:text-[#172033] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDirectCreate} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {directError && (
                <div className="rounded-[8px] bg-[#FDECEC] border border-[#F5C6CB] p-3 text-xs text-[#C2413B] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{directError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Commercial Profile */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085] pb-1 border-b border-[#E6EAF0]">
                    1. Commercial Profile & Territory
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Centre / Shop Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.centreName}
                      onChange={(e) => setCreateForm({ ...createForm, centreName: e.target.value })}
                      placeholder="e.g. Sri Murugan eSevai Maiyam"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Assigned Distributor (Optional)
                    </label>
                    <select
                      value={createForm.distributorId}
                      onChange={(e) => setCreateForm({ ...createForm, distributorId: e.target.value })}
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                    >
                      <option value="">Direct Franchise Centre (Direct Partner Oversight)</option>
                      {distributors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.distributorCode}) — {d.district || 'Distributor'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        District *
                      </label>
                      <select
                        value={createForm.district}
                        onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                      >
                        {TN_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Taluk / Block *
                      </label>
                      <input
                        type="text"
                        required
                        value={createForm.taluk}
                        onChange={(e) => setCreateForm({ ...createForm, taluk: e.target.value })}
                        placeholder="e.g. Madurai South"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Shop Street Address
                      </label>
                      <input
                        type="text"
                        value={createForm.address}
                        onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                        placeholder="Door / Street name"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={createForm.pincode}
                        onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value.replace(/\D/g, '') })}
                        placeholder="625001"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Operator & Access */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085] pb-1 border-b border-[#E6EAF0]">
                    2. Operator Profile & Station Access
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Operator / Owner Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g. S. Murugesan"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Contact Mobile *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={createForm.mobile}
                        onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value.replace(/\D/g, '') })}
                        placeholder="9876543210"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Login Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="centre@gmail.com"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Station Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={createForm.centreCode}
                        onChange={(e) => setCreateForm({ ...createForm, centreCode: e.target.value.toUpperCase() })}
                        placeholder="Auto (e.g. TN-CTR-042)"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Validity Days
                      </label>
                      <select
                        value={createForm.validityDays}
                        onChange={(e) => setCreateForm({ ...createForm, validityDays: parseInt(e.target.value, 10) })}
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                      >
                        <option value={365}>365 Days (1 Year License)</option>
                        <option value={180}>180 Days (6 Months)</option>
                        <option value={90}>90 Days (Quarterly)</option>
                        <option value={30}>30 Days (Trial)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Account Status
                    </label>
                    <select
                      value={createForm.status}
                      onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIVE (Immediate Booking Enabled)</option>
                      <option value="INACTIVE">INACTIVE (Hold)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6EAF0]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-[8px] border border-[#D0D5DD] px-4 py-2 text-xs sm:text-sm font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={directSubmitting}
                  className="rounded-[8px] bg-[#C98219] px-6 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {directSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Provision Centre Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Temporary Activation Credentials */}
      {isCredsModalOpen && credentialsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[14px] border border-[#C3E6CB] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#C3E6CB] px-6 py-4 bg-[#EAF7EE]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-[#198754] text-white flex items-center justify-center font-bold">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#106A3B]">
                    Centre Account Provisioned & Activated
                  </h3>
                  <p className="text-xs text-[#198754] font-medium">
                    Store and share these initial credentials securely with the operator.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCredsModalOpen(false)}
                className="rounded-md p-1.5 text-[#198754] hover:bg-[#D8F3DF] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Profile Card */}
              <div className="rounded-[10px] border border-[#E6EAF0] bg-[#F8FAFC] p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-[#E6EAF0]">
                  <span className="text-[#667085] font-medium">Centre / Shop</span>
                  <span className="font-bold text-[#172033] text-sm">{credentialsData.centreName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#E6EAF0]">
                  <span className="text-[#667085] font-medium">Station Code</span>
                  <span className="font-mono font-bold text-[#C98219] bg-[#FEF7E6] px-2 py-0.5 rounded border border-[#F9DE9B]">
                    {credentialsData.centreCode}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#E6EAF0]">
                  <span className="text-[#667085] font-medium">Operator Name</span>
                  <span className="font-semibold text-[#172033]">{credentialsData.ownerName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#E6EAF0]">
                  <span className="text-[#667085] font-medium">Login Email</span>
                  <span className="font-semibold text-[#172033]">{credentialsData.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#667085] font-medium">Mobile</span>
                  <span className="font-mono font-semibold text-[#172033]">{credentialsData.mobile}</span>
                </div>
              </div>

              {/* Temporary Password Highlight Box */}
              <div className="rounded-[10px] border-2 border-dashed border-[#C98219] bg-[#FEF7E6] p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#8F5A0D] mb-1">
                  <KeyRound className="h-4 w-4" />
                  <span>TEMPORARY ACTIVATION PASSWORD</span>
                </div>
                <div className="font-mono text-xl font-extrabold tracking-wider text-[#172033] py-1 select-all">
                  {credentialsData.temporaryPassword || '—'}
                </div>
                <p className="text-[11px] text-[#8F5A0D]">
                  The operator will be prompted to set a permanent password upon first login.
                </p>
              </div>

              {/* Station Direct Login Portal URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Station Direct Login Portal URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={credentialsData.portalUrl}
                    className="flex-1 rounded-[7px] border border-[#D0D5DD] bg-[#F8FAFC] px-3 py-2 text-xs font-mono text-[#172033] select-all focus:outline-none"
                  />
                  <button
                    onClick={copyPortalUrlOnly}
                    className="rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-bold text-[#344054] hover:bg-[#F2F4F7] transition-colors flex items-center gap-1 shrink-0"
                  >
                    {copiedPortalUrl ? <Check className="h-3.5 w-3.5 text-[#198754]" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedPortalUrl ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  <a
                    href={credentialsData.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[7px] bg-[#172033] p-2 text-white hover:bg-[#2A374F] transition-colors shrink-0"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={copyCredentials}
                    className="w-full rounded-[8px] bg-[#172033] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2A374F] transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    {copiedCreds ? <Check className="h-4 w-4 text-[#198754]" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedCreds ? 'All Copied to Clipboard!' : 'Copy All Details'}</span>
                  </button>

                  <button
                    onClick={shareCredentialsViaWhatsApp}
                    className="w-full rounded-[8px] bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1EBE5D] transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Send className="h-4 w-4" />
                    <span>Share on WhatsApp</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsCredsModalOpen(false)}
                  className="w-full rounded-[8px] border border-[#D0D5DD] bg-white px-4 py-2 text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                >
                  Done & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
