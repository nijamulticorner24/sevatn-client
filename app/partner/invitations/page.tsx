'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useSocketStatus, useLiveEvent } from '@/lib/useSocket';
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
  Radio,
  BellRing,
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
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Form State
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

  useLiveEvent('centre:activated', (data: any) => {
    loadInvitations();
  });

  useEffect(() => {
    loadInvitations();
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
      loadInvitations();
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate link');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
            <Share2 className="h-4 w-4" />
            <span>Partner Centre Onboarding Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            Onboard New eSevai Centres
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Generate single-use 30-minute links. Completed registrations update to <strong>ACTIVATED</strong> in real time via WebSocket.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
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
            <span>{isConnected ? 'LIVE WEBSOCKET SYNC' : 'CONNECTING...'}</span>
          </span>
        </div>
      </div>

      {/* Summary Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Total Links Created
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
              Activated Centres
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

      {/* Onboarding Generator Form */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle">
        <h2 className="text-base font-bold text-[#172033] mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#C98219]" />
          Generate 30-Minute Centre Registration Link
        </h2>

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
              Generated Centre Invitation Links ({invitations.length})
            </h3>
            <p className="text-xs text-[#667085]">
              Real-time WebSocket sync: Registrations and activations update automatically.
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
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Registered Code</th>
                  <th className="py-3 px-4">30-Min Expiry Status</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0] bg-white">
                {invitations.map((inv) => {
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
    </div>
  );
}
