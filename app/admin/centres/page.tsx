'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
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
  Lock,
  Phone,
  Mail,
  User,
  X,
  Clock,
  Ban,
  ShieldAlert,
} from 'lucide-react';
import { MetricBlock } from '../../../components/MetricBlock';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { EmptyState } from '../../../components/EmptyState';

const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
  'Viluppuram', 'Virudhunagar'
];

export default function AdminCentresPage() {
  const [centres, setCentres] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState<any>(null);
  const [credentialsData, setCredentialsData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Create Form State
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
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    id: '',
    centreName: '',
    name: '',
    mobile: '',
    email: '',
    district: '',
    taluk: '',
    address: '',
    pincode: '',
    centreCode: '',
    status: 'ACTIVE',
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getCentres(1, filterDistrict, filterStatus, searchQuery),
      api.getNetworkStats().catch(() => null),
    ]).then(([cData, sData]) => {
      if (cData?.centres) setCentres(cData.centres);
      if (sData) setNetworkStats(sData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [filterDistrict, filterStatus, searchQuery]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await api.createCentre(createForm);
      setIsCreateModalOpen(false);
      setCredentialsData({
        centreName: res.centre.centreName,
        centreCode: res.centre.centreCode,
        ownerName: res.user.name,
        email: res.user.email,
        mobile: res.user.mobile,
        temporaryPassword: res.temporaryPassword,
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
      });
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create centre account');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (centre: any) => {
    setSelectedCentre(centre);
    setEditForm({
      id: centre.id,
      centreName: centre.centreName,
      name: centre.user?.name || '',
      mobile: centre.user?.mobile || '',
      email: centre.user?.email || '',
      district: centre.district || 'Chennai',
      taluk: centre.taluk || '',
      address: centre.address || '',
      pincode: centre.pincode || '',
      centreCode: centre.centreCode || '',
      status: centre.status || 'ACTIVE',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    try {
      await api.updateCentre(editForm.id, editForm);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update centre');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (centre: any) => {
    const isCurrentlyActive = centre.status === 'ACTIVE';
    const confirmMsg = isCurrentlyActive
      ? `Are you sure you want to suspend centre '${centre.centreName}' (${centre.centreCode})?`
      : `Activate centre '${centre.centreName}' (${centre.centreCode}) and renew license cycle?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      if (isCurrentlyActive) {
        await api.suspendCentre(centre.id);
      } else {
        await api.activateCentre(centre.id);
      }
      loadData();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleReissueActivation = async (centre: any) => {
    const confirmMsg = `Reissue activation password for '${centre.centreName}'? The operator will be required to change password upon sign in.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.reissueCentreActivation(centre.id);
      setCredentialsData({
        centreName: centre.centreName,
        centreCode: res.centreCode || centre.centreCode,
        ownerName: centre.user?.name,
        email: res.operatorEmail || centre.user?.email,
        mobile: centre.user?.mobile,
        temporaryPassword: res.temporaryPassword,
      });
      setIsCredsModalOpen(true);
      loadData();
    } catch (err: any) {
      alert(`Failed to reissue activation: ${err.message}`);
    }
  };

  const copyCredentials = () => {
    if (!credentialsData) return;
    const text = `TicketAssist Centre Onboarding Credentials\n------------------------------------\nCentre Name: ${credentialsData.centreName}\nCentre Code: ${credentialsData.centreCode}\nOperator: ${credentialsData.ownerName}\nLogin Email: ${credentialsData.email}\nMobile: ${credentialsData.mobile}\nTemporary Password: ${credentialsData.temporaryPassword}\nLogin Portal: ${window.location.origin}/auth/login\n\nNote: You will be prompted to set your permanent private password upon first sign-in.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Admin Centre Management</h1>
            <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-[10.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
              Admin-Controlled Network
            </span>
          </div>
          <p className="text-xs text-secondary-500 mt-0.5">
            Provision, authorize, and audit statewide eSevai and computer centres across Tamil Nadu
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-border-default bg-white text-secondary-600 hover:bg-neutral-50 hover:text-text-primary transition-colors shadow-subtle cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              setActionError(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-btn bg-[#C98219] px-4 py-2 text-xs font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Centre</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics (Real operational counts, no demo constants) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBlock
          label="TOTAL CENTRES"
          value={String(networkStats?.registeredCount ?? centres.length)}
          helper="Total registered centres in network"
          icon={Building2}
        />
        <MetricBlock
          label="ACTIVE CENTRES"
          value={String(networkStats?.activeCount ?? centres.filter(c => c.status === 'ACTIVE').length)}
          helper="Authorized & actively operating"
          icon={CheckCircle2}
        />
        <MetricBlock
          label="SUSPENDED CENTRES"
          value={String(networkStats?.suspendedCount ?? centres.filter(c => c.status === 'SUSPENDED').length)}
          helper="Temporarily suspended or on hold"
          icon={Ban}
        />
        <MetricBlock
          label="DISTRICTS COVERED"
          value={`${networkStats?.districtCount ?? (networkStats?.districtGrouping?.length ?? (new Set(centres.map(c => c.district).filter(Boolean))).size)} / 38`}
          helper="Districts with registered centres"
          icon={MapPin}
        />
      </div>

      {/* Directory Filters & Table */}
      <div className="rounded-card border border-border-default bg-white shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Centre Directory ({centres.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search name, code, email, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-input border border-border-default bg-white pl-8 pr-3 py-1.5 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
              />
            </div>

            {/* District Filter */}
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="rounded-input border border-border-default bg-white px-3 py-1.5 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
            >
              <option value="ALL">All Districts</option>
              {TN_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-input border border-border-default bg-white px-3 py-1.5 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : centres.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No centres found"
              description="No centre accounts match the selected filters or search keyword."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-left text-secondary-500 bg-neutral-50/50">
                  <th className="py-2.5 px-4 font-semibold">Centre Code</th>
                  <th className="py-2.5 px-4 font-semibold">Commercial Name & Address</th>
                  <th className="py-2.5 px-4 font-semibold">Operator Contact</th>
                  <th className="py-2.5 px-4 font-semibold">District / Taluk</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">License Validity</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {centres.map((c) => {
                  const isActive = c.status === 'ACTIVE' && c.user?.status === 'ACTIVE';
                  const isSuspended = c.status === 'SUSPENDED' || c.user?.status === 'SUSPENDED';

                  return (
                    <tr key={c.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand-900">
                        {c.centreCode || 'SEVA-TN'}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-text-primary">{c.centreName}</p>
                        <p className="text-[10.5px] text-secondary-500 truncate max-w-xs">{c.address || `${c.taluk}, ${c.district}`}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-text-primary">{c.user?.name}</p>
                        <p className="text-[10.5px] text-secondary-500 font-mono">{c.user?.email}</p>
                        <p className="text-[10.5px] text-secondary-500 font-mono">{c.user?.mobile}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-text-primary">{c.district}</span>
                        {c.taluk && <span className="text-secondary-500 font-normal"> ({c.taluk})</span>}
                      </td>
                      <td className="py-3 px-4">
                        {isActive && (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                            ACTIVE
                          </span>
                        )}
                        {isSuspended && (
                          <span className="inline-block px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[11px] font-semibold text-red-800">
                            SUSPENDED
                          </span>
                        )}
                        {!isActive && !isSuspended && (
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                            {c.status || 'EXPIRED'}
                          </span>
                        )}
                        {c.user?.mustChangePassword && (
                          <span className="block mt-1 text-[9.5px] text-amber-700 font-medium">
                            • First login pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-secondary-600">
                        {c.user?.expiryDate ? formatDate(c.user.expiryDate) : 'Active License'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(c)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-border-default bg-white text-secondary-600 hover:text-brand-700 hover:border-brand-500 transition-colors"
                            title="Edit Centre"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Reissue Activation Password */}
                          <button
                            onClick={() => handleReissueActivation(c)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-border-default bg-white text-secondary-600 hover:text-amber-700 hover:border-amber-500 transition-colors"
                            title="Reissue Temporary Activation Password"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>

                          {/* Suspend / Activate Toggle */}
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                              isActive
                                ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                                : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                            title={isActive ? 'Suspend Centre' : 'Activate Centre'}
                          >
                            {isActive ? 'Suspend' : 'Activate'}
                          </button>
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

      {/* MODAL 1: CREATE NEW CENTRE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl rounded-[12px] border border-[#E6EAF0] bg-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#C98219] text-white shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033] tracking-tight">Create New Centre Account</h3>
                  <p className="text-xs text-[#667085]">Authorized administrative onboarding and credential provisioning</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#172033] hover:bg-[#F2F4F7] transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body - 2 Columns */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {actionError && (
                <div className="p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* LEFT COLUMN: Centre Profile & Location */}
                <div className="space-y-4 rounded-[10px] border border-[#E6EAF0] bg-[#FDFEFE] p-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#F2F4F7]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FDF7ED] text-[#C98219] font-bold text-[10.5px]">
                      1
                    </span>
                    <h4 className="font-bold text-[#172033] uppercase tracking-wider text-[11px]">
                      Centre Commercial Profile & Location
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
                      placeholder="e.g. Sri Murugan eSevai & CSC Centre"
                      className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#344054] mb-1">
                        Tamil Nadu District <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={createForm.district}
                        onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
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
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
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
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
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
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Operator Account & Administrative Configuration */}
                <div className="space-y-4">
                  {/* Operator Login Account */}
                  <div className="space-y-4 rounded-[10px] border border-[#E6EAF0] bg-[#FDFEFE] p-4">
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
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#344054] mb-1">
                          Mobile Number (WhatsApp) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={createForm.mobile}
                          onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })}
                          placeholder="9443100001"
                          className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all font-mono"
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
                          placeholder="muthu.esevai@gmail.com"
                          className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* System Configuration */}
                  <div className="space-y-4 rounded-[10px] border border-[#E6EAF0] bg-[#FDFEFE] p-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#F2F4F7]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7EE] text-[#198754] font-bold text-[10.5px]">
                        3
                      </span>
                      <h4 className="font-bold text-[#172033] uppercase tracking-wider text-[11px]">
                        System Configuration & Identification
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-[#344054] mb-1">
                          Custom Centre Code
                        </label>
                        <input
                          type="text"
                          value={createForm.centreCode}
                          onChange={(e) => setCreateForm({ ...createForm, centreCode: e.target.value })}
                          placeholder="Auto (e.g. TN-CHE-001)"
                          className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs font-mono text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#344054] mb-1">
                          Initial Status
                        </label>
                        <select
                          value={createForm.status}
                          onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                          className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#344054] mb-1">
                          Validity Cycle
                        </label>
                        <select
                          value={createForm.validityDays}
                          onChange={(e) => setCreateForm({ ...createForm, validityDays: parseInt(e.target.value) })}
                          className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
                        >
                          <option value={365}>365 Days (1 Year)</option>
                          <option value={90}>90 Days (Quarterly)</option>
                          <option value={30}>30 Days (Monthly)</option>
                        </select>
                      </div>
                    </div>

                    <div className="rounded-[8px] border border-[#F9DE9B] bg-[#FEF7E6] p-3 text-[11px] text-[#8F5A0D] leading-relaxed flex items-start gap-2">
                      <span className="text-sm">💡</span>
                      <span>
                        A secure temporary activation credential will be automatically generated. The operator will be required to create their permanent private password upon first sign in.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Bottom Action Footer */}
              <div className="pt-4 border-t border-[#E6EAF0] flex items-center justify-between gap-3 bg-white">
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
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-[7px] bg-[#C98219] text-white hover:bg-[#B57414] text-xs font-bold disabled:opacity-50 shadow-subtle transition-all"
                  >
                    {submitting ? 'Creating Account...' : 'Create & Generate Credentials'}
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

              <div className="rounded-[8px] bg-[#EAF7EE] border border-[#BFE4C9] p-3 text-[11.5px] text-[#198754] leading-relaxed flex items-start gap-2">
                <span className="text-sm">🔒</span>
                <span>
                  <strong>First Login Security:</strong> The operator will be automatically required to set their permanent private password upon entering these credentials.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-[7px] bg-[#172033] text-white hover:bg-[#263550] text-xs font-bold transition-colors shadow-subtle"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Credentials Copied!' : 'Copy All Credentials'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCredsModalOpen(false)}
                  className="px-5 py-2.5 rounded-[7px] bg-[#C98219] text-white hover:bg-[#B57414] text-xs font-bold shadow-subtle transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT CENTRE */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-[12px] border border-[#E6EAF0] bg-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#C98219] text-white shadow-sm">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">Edit Centre Information</h3>
                  <p className="text-[11px] text-[#667085]">Update profile, contact, or operational status</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-[#98A2B3] hover:text-[#172033] hover:bg-[#F2F4F7] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {actionError && (
                <div className="p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-red-800 text-xs">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-semibold text-[#344054] mb-1">Centre Commercial Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.centreName}
                    onChange={(e) => setEditForm({ ...editForm, centreName: e.target.value })}
                    className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#344054] mb-1">Operator Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#344054] mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs font-mono text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#344054] mb-1">Tamil Nadu District *</label>
                  <select
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                  >
                    {TN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#344054] mb-1">Taluk *</label>
                  <input
                    type="text"
                    required
                    value={editForm.taluk}
                    onChange={(e) => setEditForm({ ...editForm, taluk: e.target.value })}
                    className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-[#344054] mb-1">Street Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#344054] mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#344054] mb-1">Centre Code</label>
                  <input
                    type="text"
                    value={editForm.centreCode}
                    onChange={(e) => setEditForm({ ...editForm, centreCode: e.target.value })}
                    className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs font-mono text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6EAF0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-[7px] border border-[#D0D5DD] text-[#344054] hover:bg-[#F2F4F7] text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-[7px] bg-[#C98219] text-white hover:bg-[#B57414] text-xs font-bold disabled:opacity-50 transition-all shadow-subtle"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
