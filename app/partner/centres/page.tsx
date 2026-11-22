'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import {
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Search,
  RefreshCw,
  Users,
  Plus,
  KeyRound,
  ShieldCheck,
  Edit2,
  Copy,
  Check,
  Phone,
  Mail,
  X,
  Clock,
  ExternalLink,
  Share2,
  ChevronRight,
  Wallet,
  Loader2,
  Send,
  AlertCircle,
} from 'lucide-react';
import { MetricBlock } from '@/components/MetricBlock';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/ui/Toast';

import { useLiveEvent } from '@/lib/useSocket';

const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
  'Viluppuram', 'Virudhunagar'
];

function PartnerCentresContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const initialDistributorId = searchParams.get('distributorId') || 'ALL';

  const [centres, setCentres] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDistributor, setFilterDistributor] = useState(initialDistributorId);
  const [loading, setLoading] = useState(true);

  // Selected Centre Detail Modal State
  const [selectedCentre, setSelectedCentre] = useState<any | null>(null);

  // Direct Onboard Modal & Credentials State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [partnerWallet, setPartnerWallet] = useState<any>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [credentialsData, setCredentialsData] = useState<any>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);

  // Form State
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

  useEffect(() => {
    api.getPartnerDistributors()
      .then((data) => setDistributors(data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const qDist = searchParams.get('distributorId');
    if (qDist) setFilterDistributor(qDist);
  }, [searchParams]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getPartnerCentres(1, filterDistrict, filterStatus, searchQuery, filterDistributor),
      api.getMe().catch(() => null),
    ])
      .then(([cData, meData]) => {
        if (cData?.centres) setCentres(cData.centres);
        if (meData?.wallet) setPartnerWallet(meData.wallet);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const payload: any = {
        centreName: createForm.centreName.trim(),
        name: createForm.name.trim(),
        mobile: createForm.mobile.trim(),
        email: createForm.email.trim(),
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
      toast.success('Centre successfully onboarded and activated.');
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create centre account');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!credentialsData) return;
    const text = `🎉 SEVATN CENTRE ACCESS CREDENTIALS\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Centre Name : ${credentialsData.centreName}\n` +
      `Centre Code : ${credentialsData.centreCode}\n` +
      `Portal URL  : ${credentialsData.portalUrl}\n` +
      `Username / Mobile: ${credentialsData.mobile}\n` +
      `Temporary Password: ${credentialsData.temporaryPassword}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Please login and change your password immediately upon first access.`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  const copyPortalUrlOnly = () => {
    if (!credentialsData) return;
    navigator.clipboard.writeText(credentialsData.portalUrl);
    setCopiedPortalUrl(true);
    setTimeout(() => setCopiedPortalUrl(false), 2000);
  };

  const shareViaWhatsApp = () => {
    if (!credentialsData) return;
    const text = `🎉 *SEVATN CENTRE ACCESS CREDENTIALS*\n` +
      `Centre: *${credentialsData.centreName}* (${credentialsData.centreCode})\n` +
      `Portal: ${credentialsData.portalUrl}\n` +
      `Mobile: *${credentialsData.mobile}*\n` +
      `Temporary Password: *${credentialsData.temporaryPassword}*\n\n` +
      `_Please login and change password on first sign in._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  useLiveEvent('partner:centre_activated', () => {
    loadData();
  });

  useLiveEvent('centre:activated', () => {
    loadData();
  });

  useEffect(() => {
    loadData();
  }, [filterDistrict, filterStatus, searchQuery, filterDistributor]);

  const totalCentres = centres.length;
  const activeCentres = centres.filter((c) => c.status === 'ACTIVE').length;
  const pendingCentres = centres.filter((c) => c.status === 'PENDING_VERIFICATION').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" />
            <span>Partner Franchise • Centres Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            My Network Centres
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Manage, audit, and monitor all authorized booking centres onboarded under your partner code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="rounded-[7px] border border-[#E6EAF0] bg-white p-2.5 text-[#667085] hover:text-[#172033] hover:bg-[#F8FAFC] shadow-subtle transition-colors"
            title="Refresh Centres"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-[7px] bg-[#C98219] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard New Centre</span>
          </button>
          <Link
            href="/partner/invitations"
            className="rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] shadow-subtle transition-colors flex items-center gap-1.5"
            title="Generate Shareable Onboarding Links"
          >
            <Share2 className="h-4 w-4 text-[#667085]" />
            <span>Invite Link</span>
          </Link>
        </div>
      </div>

      {/* Metric Blocks Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricBlock
          label="Total Network Centres"
          value={totalCentres}
          icon={Building2}
          subtext="Centres in your franchise territory"
        />
        <MetricBlock
          label="Active & Validated"
          value={activeCentres}
          icon={CheckCircle2}
          variant="success"
          subtext="5 KM Geofence GPS Validated"
        />
        <MetricBlock
          label="Pending Verification"
          value={pendingCentres}
          icon={AlertTriangle}
          variant="warning"
          subtext="Awaiting initial GPS validation"
        />
      </div>

      {/* Filter and Search Bar Card */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#98A2B3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by centre name, code, operator..."
              className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-10 pr-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
            />
          </div>

          {/* Distributor Filter */}
          <div>
            <select
              value={filterDistributor}
              onChange={(e) => setFilterDistributor(e.target.value)}
              className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
            >
              <option value="ALL">All Network Centres</option>
              <option value="DIRECT">Direct / Legacy Only</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.distributorCode})
                </option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
            >
              <option value="ALL">All Tamil Nadu Districts</option>
              {TN_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Centres</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Centres Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : centres.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Building2}
              title="No Network Centres Found"
              description="No centres match your current search criteria. Onboard new centres into your partner network."
              action={{
                label: 'Onboard Centre (30m Link)',
                onClick: () => router.push('/partner/invitations'),
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#E6EAF0]">
                <tr>
                  <th className="py-3 px-4">Centre Name & Code</th>
                  <th className="py-3 px-4">Distributor</th>
                  <th className="py-3 px-4">Operator Contact</th>
                  <th className="py-3 px-4">District / Taluk</th>
                  <th className="py-3 px-4">5 KM Geofence</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0] bg-white">
                {centres.map((c) => {
                  const isActive = c.status === 'ACTIVE';
                  return (
                    <tr key={c.id} className="hover:bg-[#FAFBFD] transition-colors">
                      {/* Centre Name & Code */}
                      <td className="py-3 px-4 font-bold text-[#172033]">
                        {c.centreName}
                        <span className="block text-[11px] font-mono font-normal text-[#8F5A0D]">
                          {c.centreCode || 'TN-CTR-001'}
                        </span>
                      </td>

                      {/* Distributor */}
                      <td className="py-3 px-4">
                        {c.distributor ? (
                          <Link
                            href={`/partner/distributors/${c.distributor.id}`}
                            className="group inline-flex items-center gap-1.5 hover:underline"
                          >
                            <span className="font-semibold text-[#172033] text-xs group-hover:text-[#175CD3]">
                              {c.distributor.name}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-[#175CD3] bg-[#EFF8FF] px-1.5 py-0.5 rounded border border-[#B2DDFF]">
                              {c.distributor.distributorCode}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-[11px] font-medium text-[#667085] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E6EAF0]">
                            Direct / Legacy
                          </span>
                        )}
                      </td>

                      {/* Operator Contact */}
                      <td className="py-3 px-4 text-[#475467]">
                        <span className="font-semibold text-[#172033] block">
                          {c.user?.name || 'Operator'}
                        </span>
                        <span className="text-[11px] font-mono text-[#667085] block">
                          {c.user?.mobile || '—'}
                        </span>
                        {c.user?.email && (
                          <span className="text-[10.5px] text-[#98A2B3] block truncate max-w-[140px]">
                            {c.user.email}
                          </span>
                        )}
                      </td>

                      {/* District & Taluk */}
                      <td className="py-3 px-4 text-[#475467]">
                        <span className="font-semibold text-[#172033]">{c.district}</span>
                        <span className="block text-[11px] text-[#667085]">{c.taluk}</span>
                      </td>

                      {/* 5 KM Geofence Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#198754] bg-[#EAF7EE] px-2 py-0.5 rounded border border-[#C3E6CB]">
                          <MapPin className="h-3 w-3" />
                          Validated
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="py-3 px-4 text-[#667085]">
                        {formatDate(c.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                            isActive
                              ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                              : 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedCentre(c)}
                          className="text-xs font-semibold text-[#C98219] hover:underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Centre Modal */}
      {selectedCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[12px] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  {selectedCentre.centreName}
                </h3>
                <span className="font-mono text-xs text-[#8F5A0D]">
                  {selectedCentre.centreCode}
                </span>
              </div>
              <button
                onClick={() => setSelectedCentre(null)}
                className="text-[#667085] hover:text-[#172033]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#475467]">
              <div className="grid grid-cols-2 gap-2 border-b border-[#F0F3F7] pb-2">
                <span className="text-[#667085]">Distributor:</span>
                <span className="font-semibold text-[#172033]">
                  {selectedCentre.distributor ? `${selectedCentre.distributor.name} (${selectedCentre.distributor.distributorCode})` : 'Direct / Legacy'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-[#F0F3F7] pb-2">
                <span className="text-[#667085]">Operator Name:</span>
                <span className="font-semibold text-[#172033]">{selectedCentre.user?.name || '—'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-[#F0F3F7] pb-2">
                <span className="text-[#667085]">Mobile Number:</span>
                <span className="font-semibold text-[#172033]">{selectedCentre.user?.mobile || '—'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-[#F0F3F7] pb-2">
                <span className="text-[#667085]">Email Address:</span>
                <span className="font-semibold text-[#172033]">{selectedCentre.user?.email || '—'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-[#F0F3F7] pb-2">
                <span className="text-[#667085]">District / Taluk:</span>
                <span className="font-semibold text-[#172033]">{selectedCentre.district} / {selectedCentre.taluk}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-[#F0F3F7] pb-2">
                <span className="text-[#667085]">Address:</span>
                <span className="text-[#172033]">{selectedCentre.address || '—'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-[#F0F3F7] pb-2">
                <span className="text-[#667085]">Status:</span>
                <span className="font-bold text-[#172033]">{selectedCentre.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-[#667085]">Onboarded Date:</span>
                <span className="text-[#667085]">{formatDate(selectedCentre.createdAt)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E6EAF0]">
              <button
                onClick={() => setSelectedCentre(null)}
                className="rounded-[8px] bg-[#172033] px-4 py-2 text-xs font-semibold text-white hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIRECT ONBOARD CENTRE ACCOUNT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-[14px] border border-[#E6EAF0] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] px-6 py-4 bg-[#F8FAFC]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#172033] flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#C98219]" />
                  <span>Onboard New Booking Centre</span>
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Direct provisioning with immediate activation for your partner franchise network.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-md p-1.5 text-[#667085] hover:bg-[#E6EAF0] hover:text-[#172033] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Wallet Balance & Onboarding Fee Notice */}
              <div className="rounded-[8px] bg-[#FEF7E6] border border-[#F9DE9B] p-3 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[#C98219] shrink-0" />
                  <div>
                    <span className="font-bold text-[#8F5A0D]">Centre Onboarding Fee:</span>
                    <span className="ml-1 text-[#172033] font-mono font-bold">₹249.00</span>
                    <span className="block text-[10.5px] text-[#667085]">Automatically deducted from your Partner Wallet</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#667085] block">Your Balance</span>
                  <span className={`font-mono font-bold ${Number(partnerWallet?.availableBalance || 0) >= 249 ? 'text-[#198754]' : 'text-[#C2413B]'}`}>
                    {formatINR(Number(partnerWallet?.availableBalance || 0))}
                  </span>
                </div>
              </div>

              {Number(partnerWallet?.availableBalance || 0) < 249 && (
                <div className="rounded-[8px] bg-[#FDECEC] border border-[#F8C4C2] p-2.5 text-xs text-[#992B26] flex items-center justify-between">
                  <span>Insufficient wallet balance. Minimum ₹249 required to onboard.</span>
                  <Link href="/partner/wallet" className="font-bold underline text-[#C2413B] hover:text-[#992B26]">
                    Recharge Wallet
                  </Link>
                </div>
              )}

              {createError && (
                <div className="rounded-[8px] bg-[#FDECEC] border border-[#F5C6CB] p-3 text-xs text-[#C2413B] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
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
                      Centre / Commercial Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.centreName}
                      onChange={(e) => setCreateForm({ ...createForm, centreName: e.target.value })}
                      placeholder="e.g. Sri Balaji e-Sevai Mayiladuthurai"
                      className="w-full rounded-[8px] border border-[#D0D5DD] px-3.5 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">District *</label>
                      <select
                        value={createForm.district}
                        onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                        className="w-full rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                      >
                        {TN_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">Taluk *</label>
                      <input
                        type="text"
                        required
                        value={createForm.taluk}
                        onChange={(e) => setCreateForm({ ...createForm, taluk: e.target.value })}
                        placeholder="e.g. Sirkazhi"
                        className="w-full rounded-[8px] border border-[#D0D5DD] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">Physical Address</label>
                    <input
                      type="text"
                      value={createForm.address}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                      placeholder="e.g. 14 South Car Street, Sirkazhi"
                      className="w-full rounded-[8px] border border-[#D0D5DD] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">Postal PIN Code</label>
                    <input
                      type="text"
                      value={createForm.pincode}
                      onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                      placeholder="e.g. 609110"
                      className="w-full rounded-[8px] border border-[#D0D5DD] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Assigned Distributor (Optional)
                    </label>
                    <select
                      value={createForm.distributorId}
                      onChange={(e) => setCreateForm({ ...createForm, distributorId: e.target.value })}
                      className="w-full rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                    >
                      <option value="">Direct under Partner Franchise (No Distributor)</option>
                      {distributors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.distributorCode}) • {d.district || 'All TN'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Column 2: Owner Credentials */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085] pb-1 border-b border-[#E6EAF0]">
                    2. Centre Administrator Identity
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
                      placeholder="e.g. R. Subramanian"
                      className="w-full rounded-[8px] border border-[#D0D5DD] px-3.5 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Mobile Number (Login ID) *
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      value={createForm.mobile}
                      onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value.replace(/\D/g, '') })}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-[8px] border border-[#D0D5DD] px-3.5 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="e.g. subramanian@gmail.com"
                      className="w-full rounded-[8px] border border-[#D0D5DD] px-3.5 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                    />
                  </div>

                  <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-3 text-xs text-[#475467] space-y-1 mt-6">
                    <span className="font-bold text-[#172033] block">Automatic Credentials Provisioning</span>
                    <p className="text-[11px] text-[#667085]">
                      A secure temporary activation password will be generated upon creation. The operator can log in immediately to complete first-time verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-[#E6EAF0] pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-[8px] border border-[#D0D5DD] px-4 py-2 text-xs sm:text-sm font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting || Number(partnerWallet?.availableBalance || 0) < 249}
                  className="rounded-[8px] bg-[#C98219] px-6 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Provision Centre & Deduct ₹249 from Wallet</span>
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
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#198754] text-white">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#198754]">Centre Provisioned & Active!</h3>
                  <p className="text-xs text-[#146c43]">Onboarding fee deducted from wallet. Share credentials below.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCredsModalOpen(false)}
                className="rounded-md p-1.5 text-[#146c43] hover:bg-[#D4EDDA] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-[10px] border border-[#E6EAF0] bg-[#F8FAFC] p-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-[#E6EAF0] pb-2">
                  <span className="text-[#667085]">Centre Name:</span>
                  <span className="font-bold text-[#172033] font-sans">{credentialsData.centreName}</span>
                </div>
                <div className="flex justify-between border-b border-[#E6EAF0] pb-2">
                  <span className="text-[#667085]">Centre Code:</span>
                  <span className="font-bold text-[#C98219]">{credentialsData.centreCode}</span>
                </div>
                <div className="flex justify-between border-b border-[#E6EAF0] pb-2">
                  <span className="text-[#667085]">Login Mobile / ID:</span>
                  <span className="font-bold text-[#172033]">{credentialsData.mobile}</span>
                </div>
                <div className="flex justify-between items-center bg-[#FEF7E6] border border-[#F9DE9B] rounded-[6px] p-2.5">
                  <span className="text-[#8F5A0D] font-bold">Temporary Password:</span>
                  <span className="font-extrabold text-[#C98219] text-sm tracking-wider">{credentialsData.temporaryPassword}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-[#667085] truncate max-w-[200px]">Portal: {credentialsData.portalUrl}</span>
                  <button
                    onClick={copyPortalUrlOnly}
                    className="text-[#C98219] hover:underline flex items-center gap-1 font-bold shrink-0 ml-2 font-sans"
                  >
                    {copiedPortalUrl ? <Check className="h-3 w-3 text-[#198754]" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedPortalUrl ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={copyCredentials}
                  className="flex-1 rounded-[8px] border border-[#D0D5DD] bg-white px-4 py-2.5 text-xs font-bold text-[#344054] hover:bg-[#F2F4F7] transition-colors flex items-center justify-center gap-2 shadow-2xs"
                >
                  {copiedCreds ? <Check className="h-4 w-4 text-[#198754]" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedCreds ? 'All Credentials Copied!' : 'Copy All Credentials'}</span>
                </button>
                <button
                  onClick={shareViaWhatsApp}
                  className="flex-1 rounded-[8px] bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#20BD5A] transition-colors flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Send className="h-4 w-4" />
                  <span>Share via WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border-t border-[#E6EAF0] px-6 py-3 flex justify-end">
              <button
                onClick={() => setIsCredsModalOpen(false)}
                className="rounded-[8px] bg-[#172033] px-5 py-2 text-xs font-bold text-white hover:bg-black transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PartnerCentresPage() {
  return (
    <Suspense fallback={<LoadingSkeleton rows={4} />}>
      <PartnerCentresContent />
    </Suspense>
  );
}
