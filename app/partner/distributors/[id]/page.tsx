'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import {
  Building2,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
  Power,
  DollarSign,
  Layers,
  ExternalLink,
  Clock,
  ShieldCheck,
  UserCheck,
  Ticket,
  Percent,
  X,
  Save,
  KeyRound,
  Send,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function PartnerDistributorDetailsPage() {
  const toast = useToast();
  const [isConfirmToggleOpen, setIsConfirmToggleOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const distributorId = params?.id as string;

  const [distributor, setDistributor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'centres' | 'invitations' | 'profile'>('overview');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Generated Credentials Modal State
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [credentialsData, setCredentialsData] = useState<any>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    businessName: '',
    district: '',
    taluk: '',
    commissionSlab: 'STANDARD',
    commissionPercentage: 10,
    markup: 1,
  });

  useEffect(() => {
    if (distributorId) {
      loadDistributorDetails();
    }
  }, [distributorId]);

  const loadDistributorDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPartnerDistributorById(distributorId);
      setDistributor(data);
      setEditForm({
        name: data.name || '',
        businessName: data.businessName || '',
        district: data.district || '',
        taluk: data.taluk || '',
        commissionSlab: data.commissionSlab || 'STANDARD',
        commissionPercentage: data.commissionPercentage || 10,
        markup: data.markup || 0,
      });
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load distributor:', err);
      setError(err.message || 'Distributor not found or access denied');
      setLoading(false);
    }
  };

  const handleToggleStatus = () => {
    if (!distributor) return;
    setIsConfirmToggleOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!distributor) return;
    const newStatus = distributor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setActionLoading(true);
      await api.updatePartnerDistributorStatus(distributor.id, newStatus);
      toast.success(`Distributor status changed to ${newStatus}`);
      setIsConfirmToggleOpen(false);
      await loadDistributorDetails();
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributor) return;

    try {
      setActionLoading(true);
      await api.updatePartnerDistributor(distributor.id, {
        name: editForm.name,
        businessName: editForm.businessName,
        district: editForm.district,
        taluk: editForm.taluk,
        commissionSlab: editForm.commissionSlab,
        commissionPercentage: Number(editForm.commissionPercentage),
        markup: Number(editForm.markup),
      });

      toast.success('Distributor profile updated successfully!');
      setIsEditOpen(false);
      await loadDistributorDetails();
    } catch (err: any) {
      toast.error(err.message || 'Error updating distributor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegeneratePassword = async () => {
    if (!distributor) return;
    if (!confirm(`Are you sure you want to regenerate the login password for ${distributor.name} (${distributor.distributorCode})?\n\nA new temporary password will be created immediately.`)) {
      return;
    }
    setRegenerating(true);
    try {
      const res: any = await api.regeneratePartnerDistributorPassword(distributor.id);
      const portalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/login`;
      setCredentialsData({
        distributorName: res?.distributor?.name || distributor.name,
        businessName: res?.distributor?.businessName || distributor.businessName,
        distributorCode: res?.distributor?.distributorCode || distributor.distributorCode,
        email: res?.distributor?.email || distributor.email,
        mobile: res?.credentials?.identifier || distributor.mobile,
        temporaryPassword: res?.credentials?.temporaryPassword,
        portalUrl,
        isRegenerated: true,
      });
      setIsCredsModalOpen(true);
      toast.success(`Temporary login password regenerated for ${distributor.name}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate distributor password');
    } finally {
      setRegenerating(false);
    }
  };

  const copyCredentials = () => {
    if (!credentialsData) return;
    const text = `🎉 SEVATN DISTRIBUTOR ACCESS CREDENTIALS\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Distributor Name  : ${credentialsData.distributorName}\n` +
      (credentialsData.businessName ? `Business / Agency : ${credentialsData.businessName}\n` : '') +
      `Distributor Code  : ${credentialsData.distributorCode}\n` +
      `First Login URL   : ${credentialsData.portalUrl}\n` +
      `Mobile / Username : ${credentialsData.mobile}\n` +
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

  const copyPasswordOnly = () => {
    if (!credentialsData?.temporaryPassword) return;
    navigator.clipboard.writeText(credentialsData.temporaryPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const shareCredentialsViaWhatsApp = () => {
    if (!credentialsData) return;
    const text = `🎉 *SEVATN DISTRIBUTOR ACCESS CREDENTIALS*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Distributor:* ${credentialsData.distributorName} (${credentialsData.distributorCode})\n` +
      `*First Login URL:* ${credentialsData.portalUrl}\n` +
      `*Mobile / Username:* ${credentialsData.mobile}\n` +
      `*Temporary Password:* *${credentialsData.temporaryPassword}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Please login and change your password upon first access._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };


  const handleCopy = (text: string, id: string) => {
    const fullUrl = `${window.location.origin}/service/register/${text}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white border border-[#E6EAF0] animate-pulse" />
          <div className="h-6 w-48 bg-white rounded border border-[#E6EAF0] animate-pulse" />
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (error || !distributor) {
    return (
      <div className="rounded-[10px] border border-[#F5C6CB] bg-[#FDECEC] p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-[#C2413B] mx-auto" />
        <h2 className="text-lg font-bold text-[#172033]">Access Denied or Not Found</h2>
        <p className="text-xs text-[#667085] max-w-md mx-auto">
          {error || 'The requested distributor could not be located or does not belong to your partner franchise account.'}
        </p>
        <Link
          href="/partner/distributors"
          className="inline-flex items-center gap-2 rounded-[8px] bg-[#172033] px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Distributors Directory</span>
        </Link>
      </div>
    );
  }

  const basePrice = Number(distributor.baseTicketPrice || 10);
  const partnerMarkup = Number(distributor.partnerMarkup || 0);
  const distMarkup = Number(distributor.markup || 0);
  const finalPrice = basePrice + partnerMarkup + distMarkup;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/distributors"
            className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#E6EAF0] bg-white text-[#667085] hover:text-[#172033] hover:bg-[#F8FAFC] transition-colors shadow-subtle shrink-0"
            title="Back to Distributors List"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#C98219] bg-[#FEF7E6] px-2 py-0.5 rounded border border-[#F9DE9B]">
                {distributor.distributorCode}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                  distributor.status === 'ACTIVE'
                    ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                    : 'bg-[#FDECEC] text-[#C2413B] border-[#F5C6CB]'
                }`}
              >
                {distributor.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-1">
              {distributor.name}
            </h1>
            {distributor.businessName && (
              <p className="text-xs text-[#667085]">{distributor.businessName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#E6EAF0] bg-white px-3.5 py-2 text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC] transition-colors shadow-subtle"
          >
            <Edit2 className="h-3.5 w-3.5 text-[#667085]" />
            <span>Edit Profile / Slab</span>
          </button>

          <button
            onClick={handleRegeneratePassword}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#F9DE9B] bg-[#FEF7E6] px-3.5 py-2 text-xs font-bold text-[#C98219] hover:bg-[#FDF0D0] transition-colors shadow-subtle disabled:opacity-50"
            title="Regenerate temporary login password for this distributor"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>{regenerating ? 'Resetting...' : 'Reset Password'}</span>
          </button>

          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`inline-flex items-center gap-1.5 rounded-[8px] px-3.5 py-2 text-xs font-bold transition-all shadow-subtle ${
              distributor.status === 'ACTIVE'
                ? 'bg-[#FDECEC] text-[#C2413B] hover:bg-[#F8D7DA] border border-[#F5C6CB]'
                : 'bg-[#EAF7EE] text-[#198754] hover:bg-[#D4EDDA] border border-[#C3E6CB]'
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            <span>{distributor.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-[8px] border border-[#C3E6CB] bg-[#EAF7EE] p-3 text-xs font-semibold text-[#198754] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#198754]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
          <p className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Total Centres</p>
          <p className="text-2xl font-black text-[#172033] mt-1">{distributor.totalCentres || 0}</p>
          <p className="text-[11px] text-[#667085] mt-0.5">
            <span className="text-[#198754] font-bold">{distributor.activeCentres || 0}</span> active in network
          </p>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
          <p className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Pending Invitations</p>
          <p className="text-2xl font-black text-[#C98219] mt-1">{distributor.pendingInvitations || 0}</p>
          <p className="text-[11px] text-[#667085] mt-0.5">Awaiting centre registration</p>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
          <p className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Distributor Markup</p>
          <p className="text-2xl font-black text-[#175CD3] mt-1">+{formatINR(distMarkup)}</p>
          <p className="text-[11px] text-[#667085] mt-0.5">Max allowed: +{formatINR(distributor.maxAllowedMarkup || 2)}</p>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle">
          <p className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Commission Slab</p>
          <p className="text-2xl font-black text-[#172033] mt-1">{distributor.commissionPercentage || 10}%</p>
          <p className="text-[11px] text-[#667085] mt-0.5">{distributor.commissionSlab || 'STANDARD'}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#E6EAF0]">
        <div className="flex gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-[#C98219] text-[#C98219]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('centres')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'centres'
                ? 'border-[#C98219] text-[#C98219]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Centres ({distributor.centres?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('invitations')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'invitations'
                ? 'border-[#C98219] text-[#C98219]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Invitations ({distributor.invitations?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#C98219] text-[#C98219]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Profile & Security</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Live Pricing Breakdown Card */}
          <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6]/40 p-5 shadow-subtle">
            <h3 className="text-sm font-bold text-[#8F5A0D] flex items-center gap-2 mb-3">
              <Ticket className="h-4 w-4 text-[#C98219]" />
              <span>Three-Level Ticket Pricing Model for This Distributor</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-white p-3 rounded-[8px] border border-[#E6EAF0]">
                <span className="text-[#667085] text-[11px] block">Base Ticket Price</span>
                <span className="text-lg font-black text-[#172033] mt-1 block">{formatINR(basePrice)}</span>
                <span className="text-[10px] text-[#667085]">Super Admin fixed</span>
              </div>
              <div className="bg-white p-3 rounded-[8px] border border-[#E6EAF0]">
                <span className="text-[#667085] text-[11px] block">Your Partner Markup</span>
                <span className="text-lg font-black text-[#C98219] mt-1 block">+{formatINR(partnerMarkup)}</span>
                <span className="text-[10px] text-[#667085]">Regional Franchise share</span>
              </div>
              <div className="bg-white p-3 rounded-[8px] border border-[#E6EAF0]">
                <span className="text-[#667085] text-[11px] block">Distributor Markup</span>
                <span className="text-lg font-black text-[#175CD3] mt-1 block">+{formatINR(distMarkup)}</span>
                <span className="text-[10px] text-[#667085]">Distributor independent share</span>
              </div>
              <div className="bg-[#172033] text-white p-3 rounded-[8px]">
                <span className="text-[#98A2B3] text-[11px] block font-medium">Final Ticket Price</span>
                <span className="text-xl font-black text-[#F9DE9B] mt-1 block">{formatINR(finalPrice)}</span>
                <span className="text-[10px] text-[#CBD5E1]">Charged per booked ticket</span>
              </div>
            </div>
            <p className="text-[11px] text-[#667085] mt-3">
              Formula: ₹{basePrice} (Base) + ₹{partnerMarkup} (Partner) + ₹{distMarkup} (Distributor) = <strong>₹{finalPrice} Final Ticket Price</strong>
            </p>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-3">
              <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#C98219]" />
                <span>Distributor Contact & Territory</span>
              </h3>
              <div className="space-y-2 text-xs text-[#475467]">
                <div className="flex items-center justify-between py-1.5 border-b border-[#F0F3F7]">
                  <span className="text-[#667085]">Full Name:</span>
                  <span className="font-semibold text-[#172033]">{distributor.name}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#F0F3F7]">
                  <span className="text-[#667085]">Business Name:</span>
                  <span className="font-semibold text-[#172033]">{distributor.businessName || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#F0F3F7]">
                  <span className="text-[#667085]">Mobile Number:</span>
                  <span className="font-semibold text-[#172033]">{distributor.mobile}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#F0F3F7]">
                  <span className="text-[#667085]">Email Address:</span>
                  <span className="font-semibold text-[#172033]">{distributor.email || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#F0F3F7]">
                  <span className="text-[#667085]">Territory District:</span>
                  <span className="font-semibold text-[#172033]">{distributor.district || 'All Districts'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#667085]">Taluk:</span>
                  <span className="font-semibold text-[#172033]">{distributor.taluk || '—'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-3">
              <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <Percent className="h-4 w-4 text-[#C98219]" />
                <span>Commercial Configuration</span>
              </h3>
              <div className="space-y-2 text-xs text-[#475467]">
                <div className="flex items-center justify-between py-1.5 border-b border-[#F0F3F7]">
                  <span className="text-[#667085]">Commission Slab:</span>
                  <span className="font-bold text-[#172033]">{distributor.commissionSlab || 'STANDARD'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#F0F3F7]">
                  <span className="text-[#667085]">Commission Percentage:</span>
                  <span className="font-bold text-[#198754]">{distributor.commissionPercentage || 10}%</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#F0F3F7]">
                  <span className="text-[#667085]">Assigned Markup:</span>
                  <span className="font-bold text-[#C98219]">+{formatINR(distMarkup)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#F0F3F7]">
                  <span className="text-[#667085]">Account Status:</span>
                  <span className="font-bold text-[#172033]">{distributor.status}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#667085]">Onboarded Date:</span>
                  <span className="text-[#667085]">{formatDate(distributor.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CENTRES */}
      {activeTab === 'centres' && (
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172033]">
              Centres Under {distributor.name} ({distributor.centres?.length || 0})
            </h3>
            <Link
              href={`/partner/centres?distributorId=${distributor.id}`}
              className="text-xs font-semibold text-[#175CD3] hover:underline flex items-center gap-1"
            >
              <span>View in Network Centres Manager</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {(!distributor.centres || distributor.centres.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#667085]">
              <Building2 className="h-8 w-8 text-[#CBD5E1] mx-auto mb-2" />
              <p className="font-semibold text-[#172033]">No Centres Onboarded Yet</p>
              <p className="mt-1">This distributor has not onboarded any active centres yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6EAF0] bg-[#F8FAFC] text-[11px] font-bold text-[#667085] uppercase">
                    <th className="py-2.5 px-3">Centre Code</th>
                    <th className="py-2.5 px-3">Centre Name</th>
                    <th className="py-2.5 px-3">Operator Name</th>
                    <th className="py-2.5 px-3">District / Taluk</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Onboarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F3F7]">
                  {distributor.centres.map((c: any) => (
                    <tr key={c.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#C98219]">{c.centreCode}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#172033]">{c.centreName}</td>
                      <td className="py-2.5 px-3 text-[#475467]">{c.user?.name || c.user?.mobile || '—'}</td>
                      <td className="py-2.5 px-3 text-[#667085]">{c.district} {c.taluk ? `(${c.taluk})` : ''}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold border ${
                            c.status === 'ACTIVE'
                              ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                              : 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#667085]">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-[#172033]">
            Invitation Links Issued by {distributor.name} ({distributor.invitations?.length || 0})
          </h3>

          {(!distributor.invitations || distributor.invitations.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#667085]">
              <Clock className="h-8 w-8 text-[#CBD5E1] mx-auto mb-2" />
              <p className="font-semibold text-[#172033]">No Invitations Issued</p>
              <p className="mt-1">This distributor has not generated any centre onboarding invitation links yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6EAF0] bg-[#F8FAFC] text-[11px] font-bold text-[#667085] uppercase">
                    <th className="py-2.5 px-3">Token</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Issued Date</th>
                    <th className="py-2.5 px-3">Expiry</th>
                    <th className="py-2.5 px-3">Used At</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F3F7]">
                  {distributor.invitations.map((inv: any) => {
                    const isExpired = inv.status === 'ACTIVE' && inv.expiresAt && new Date(inv.expiresAt) < new Date();
                    const isUsed = !!inv.usedAt;
                    return (
                      <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-3 font-mono text-[11px] font-medium text-[#172033]">
                          {inv.token.substring(0, 16)}...
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold border ${
                              isUsed
                                ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                                : isExpired
                                ? 'bg-[#FDECEC] text-[#C2413B] border-[#F5C6CB]'
                                : 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]'
                            }`}
                          >
                            {isUsed ? 'REDEEMED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#667085]">{formatDate(inv.createdAt)}</td>
                        <td className="py-2.5 px-3 text-[#667085]">{inv.expiresAt ? formatDate(inv.expiresAt) : '30 mins'}</td>
                        <td className="py-2.5 px-3 text-[#667085]">{inv.usedAt ? formatDate(inv.usedAt) : '—'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleCopy(inv.token, inv.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#175CD3] hover:underline"
                          >
                            {copiedToken === inv.id ? (
                              <>
                                <Check className="h-3 w-3 text-[#198754]" />
                                <span className="text-[#198754]">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Link</span>
                              </>
                            )}
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
      )}

      {/* TAB 4: PROFILE */}
      {activeTab === 'profile' && (
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-[#172033]">Full Profile & System Record</h3>
          <div className="space-y-3 text-xs text-[#475467]">
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Distributor ID (Internal):</span>
              <span className="font-mono text-[11px] text-[#172033]">{distributor.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Distributor Code:</span>
              <span className="font-mono font-bold text-[#C98219]">{distributor.distributorCode}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Assigned Partner:</span>
              <span className="font-semibold text-[#172033]">
                {distributor.partner?.name} ({distributor.partner?.partnerCode})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Mobile Number:</span>
              <span className="font-semibold text-[#172033]">{distributor.mobile}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Email Address:</span>
              <span className="font-semibold text-[#172033]">{distributor.email || 'None'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Physical Address:</span>
              <span className="text-[#172033]">{distributor.address || '—'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">District & Taluk:</span>
              <span className="text-[#172033]">{distributor.district || 'All Districts'} / {distributor.taluk || 'All'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2">
              <span className="text-[#667085]">Record Created:</span>
              <span className="text-[#172033]">{formatDate(distributor.createdAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DISTRIBUTOR MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[12px] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3 mb-4">
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-[#C98219]" />
                <span>Edit Distributor Profile</span>
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-[#667085] hover:text-[#172033]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#172033] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">Business Name</label>
                <input
                  type="text"
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">District</label>
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Taluk</label>
                  <input
                    type="text"
                    value={editForm.taluk}
                    onChange={(e) => setEditForm({ ...editForm, taluk: e.target.value })}
                    className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Commission Slab</label>
                  <select
                    value={editForm.commissionSlab}
                    onChange={(e) => {
                      const slab = e.target.value;
                      const pct = slab === 'PREMIUM' ? 15 : slab === 'GROWTH' ? 12 : 10;
                      setEditForm({ ...editForm, commissionSlab: slab, commissionPercentage: pct });
                    }}
                    className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                  >
                    <option value="STANDARD">Standard (10%)</option>
                    <option value="GROWTH">Growth (12%)</option>
                    <option value="PREMIUM">Premium (15%)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Markup (Max ₹{distributor.maxAllowedMarkup || 2})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={distributor.maxAllowedMarkup || 2}
                    value={editForm.markup}
                    onChange={(e) => setEditForm({ ...editForm, markup: Number(e.target.value) })}
                    className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6EAF0]">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-[8px] border border-[#E6EAF0] px-4 py-2 font-semibold text-[#667085] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#C98219] px-4 py-2 font-bold text-white hover:bg-[#A86B14]"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{actionLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isConfirmToggleOpen}
        title={distributor?.status === 'ACTIVE' ? 'Deactivate Distributor' : 'Activate Distributor'}
        description={
          distributor?.status === 'ACTIVE'
            ? `Are you sure you want to deactivate ${distributor?.name}? Centres under this distributor will not be able to process new bookings.`
            : `Are you sure you want to activate ${distributor?.name}?`
        }
        confirmLabel={distributor?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        cancelLabel="Cancel"
        isDestructive={distributor?.status === 'ACTIVE'}
        loading={actionLoading}
        onConfirm={confirmToggleStatus}
        onCancel={() => setIsConfirmToggleOpen(false)}
      />

      {/* Generated Credentials Modal */}
      {isCredsModalOpen && credentialsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[12px] bg-white shadow-xl overflow-hidden border border-[#C3E6CB]">
            {/* Header */}
            <div className="bg-[#EAF7EE] p-5 border-b border-[#C3E6CB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#198754] p-2 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#106A3B]">
                    {credentialsData.isRegenerated ? 'Distributor Password Regenerated' : 'Distributor Account Provisioned'}
                  </h3>
                  <p className="text-xs text-[#198754]">
                    {credentialsData.isRegenerated
                      ? 'New temporary login credentials generated successfully'
                      : 'Distributor created & ₹399 deducted from Partner Wallet'}
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
                  <span className="text-[#667085] font-medium">Distributor Name</span>
                  <span className="font-bold text-[#172033] text-sm">{credentialsData.distributorName}</span>
                </div>
                {credentialsData.businessName && (
                  <div className="flex justify-between items-center pb-2 border-b border-[#E6EAF0]">
                    <span className="text-[#667085] font-medium">Business / Agency</span>
                    <span className="font-semibold text-[#172033]">{credentialsData.businessName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b border-[#E6EAF0]">
                  <span className="text-[#667085] font-medium">Distributor Code</span>
                  <span className="font-mono font-bold text-[#C98219] bg-[#FEF7E6] px-2 py-0.5 rounded border border-[#F9DE9B]">
                    {credentialsData.distributorCode}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#E6EAF0]">
                  <span className="text-[#667085] font-medium">Login Mobile / User ID</span>
                  <span className="font-mono font-bold text-[#172033]">{credentialsData.mobile}</span>
                </div>
                {credentialsData.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#667085] font-medium">Email</span>
                    <span className="font-semibold text-[#172033]">{credentialsData.email}</span>
                  </div>
                )}
              </div>

              {/* Temporary Password Highlight Box */}
              <div className="rounded-[10px] border-2 border-dashed border-[#C98219] bg-[#FEF7E6] p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#8F5A0D]">
                  <KeyRound className="h-4 w-4" />
                  <span>TEMPORARY ACTIVATION PASSWORD</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-wider text-[#172033] bg-white px-4 py-1.5 rounded-[8px] border border-[#F9DE9B] select-all shadow-xs">
                    {credentialsData.temporaryPassword || '—'}
                  </span>
                  <button
                    type="button"
                    onClick={copyPasswordOnly}
                    className="rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-bold text-[#344054] hover:bg-[#F2F4F7] transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                    title="Copy Password"
                  >
                    {copiedPassword ? <Check className="h-3.5 w-3.5 text-[#198754]" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedPassword ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#8F5A0D]">
                  The distributor will use this temporary password to log in and will be prompted to set their permanent password upon first access.
                </p>
              </div>

              {/* Portal Login URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033]">
                  Distributor First Login Portal URL:
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
                    <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy All Details'}</span>
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

