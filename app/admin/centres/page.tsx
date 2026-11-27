'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatDate, formatTime, formatINR } from '../../../lib/utils';
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
  ExternalLink,
  Share2,
  Globe,
  Wallet,
  ArrowDown,
  ArrowUp,
  Trash2,
  Receipt,
  History,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  Coins,
  CreditCard,
  SlidersHorizontal,
  Eye,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { MetricBlock } from '../../../components/MetricBlock';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { EmptyState } from '../../../components/EmptyState';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';

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
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);
  const [copiedUrlCode, setCopiedUrlCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Wallet Adjustment Modal State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTargetCentre, setWalletTargetCentre] = useState<any>(null);
  const [walletAdjustAction, setWalletAdjustAction] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [walletAdjustAmount, setWalletAdjustAmount] = useState<string>('500');
  const [walletAdjustReason, setWalletAdjustReason] = useState<string>('');
  const [walletSubmitting, setWalletSubmitting] = useState(false);

  // Active Tab: Directory vs All Centre Wallet History
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ALL_WALLETS'>('DIRECTORY');

  // Single Centre Wallet History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyCentre, setHistoryCentre] = useState<any>(null);
  const [centreHistoryLoading, setCentreHistoryLoading] = useState(false);
  const [centreHistoryData, setCentreHistoryData] = useState<any>(null);
  const [centreHistoryType, setCentreHistoryType] = useState('ALL');
  const [centreHistoryPage, setCentreHistoryPage] = useState(1);

  // All Centres Wallet History View State
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLimit, setLedgerLimit] = useState(25);
  const [ledgerType, setLedgerType] = useState('ALL');
  const [ledgerStatus, setLedgerStatus] = useState('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerDateFrom, setLedgerDateFrom] = useState('');
  const [ledgerDateTo, setLedgerDateTo] = useState('');

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
    latitude: '',
    longitude: '',
  });

  const toast = useToast();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    isDestructive: boolean;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    isDestructive: false,
    action: async () => {},
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
    latitude: '',
    longitude: '',
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

  const loadCentreHistory = async (centreId: string, page = 1, type = 'ALL') => {
    setCentreHistoryLoading(true);
    try {
      const data: any = await api.getCentreWalletHistory(centreId, { page, limit: 25, type });
      setCentreHistoryData(data);
      setCentreHistoryPage(page);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load centre wallet history');
    } finally {
      setCentreHistoryLoading(false);
    }
  };

  const openCentreHistoryModal = (centre: any) => {
    setHistoryCentre(centre);
    setCentreHistoryType('ALL');
    setCentreHistoryPage(1);
    setIsHistoryModalOpen(true);
    loadCentreHistory(centre.id, 1, 'ALL');
  };

  const loadAllCentresWalletHistory = () => {
    setLedgerLoading(true);
    api.getLedgerTransactions({
      onlyCentres: true,
      page: ledgerPage,
      limit: ledgerLimit,
      type: ledgerType,
      status: ledgerStatus,
      search: ledgerSearch,
      dateFrom: ledgerDateFrom || undefined,
      dateTo: ledgerDateTo || undefined,
    }).then((data: any) => {
      setLedgerData(data);
      setLedgerLoading(false);
    }).catch((err: any) => {
      console.error(err);
      setLedgerLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [filterDistrict, filterStatus, searchQuery]);

  useEffect(() => {
    if (activeTab === 'ALL_WALLETS') {
      loadAllCentresWalletHistory();
    }
  }, [activeTab, ledgerPage, ledgerLimit, ledgerType, ledgerStatus, ledgerSearch, ledgerDateFrom, ledgerDateTo]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    try {
      const payload: any = { ...createForm };
      if (createForm.latitude.trim() !== '') {
        payload.latitude = parseFloat(createForm.latitude);
      }
      if (createForm.longitude.trim() !== '') {
        payload.longitude = parseFloat(createForm.longitude);
      }

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
        latitude: '',
        longitude: '',
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
    const loc = centre.user?.registeredLocation;
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
      latitude: loc?.latitude !== undefined && loc?.latitude !== null ? loc.latitude.toString() : '',
      longitude: loc?.longitude !== undefined && loc?.longitude !== null ? loc.longitude.toString() : '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    try {
      const payload: any = { ...editForm };
      if (editForm.latitude.trim() !== '') {
        payload.latitude = parseFloat(editForm.latitude);
      }
      if (editForm.longitude.trim() !== '') {
        payload.longitude = parseFloat(editForm.longitude);
      }

      await api.updateCentre(editForm.id, payload);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update centre');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = (centre: any) => {
    const isCurrentlyActive = centre.status === 'ACTIVE';
    setConfirmAction({
      isOpen: true,
      title: isCurrentlyActive ? 'Suspend Centre' : 'Activate Centre',
      description: isCurrentlyActive
        ? `Are you sure you want to suspend centre '${centre.centreName}' (${centre.centreCode})? The operator will not be able to log in or book passes.`
        : `Activate centre '${centre.centreName}' (${centre.centreCode}) and renew license cycle?`,
      confirmLabel: isCurrentlyActive ? 'Suspend Centre' : 'Activate Centre',
      isDestructive: isCurrentlyActive,
      action: async () => {
        setConfirmLoading(true);
        try {
          if (isCurrentlyActive) {
            await api.suspendCentre(centre.id);
            toast.success(`Centre '${centre.centreName}' suspended.`);
          } else {
            await api.activateCentre(centre.id);
            toast.success(`Centre '${centre.centreName}' activated.`);
          }
          setConfirmAction((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err: any) {
          toast.error(err.message || 'Action failed');
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  const handleReissueActivation = (centre: any) => {
    setConfirmAction({
      isOpen: true,
      title: 'Reissue Activation Password',
      description: `Reissue activation password for '${centre.centreName}'? The operator will be required to change password upon sign in.`,
      confirmLabel: 'Reissue Password',
      isDestructive: false,
      action: async () => {
        setConfirmLoading(true);
        try {
          const res = await api.reissueCentreActivation(centre.id);
          const code = res.centreCode || centre.centreCode;
          const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${code}` : `/c/${code}`;
          setCredentialsData({
            centreName: centre.centreName,
            centreCode: code,
            ownerName: centre.user?.name,
            email: res.operatorEmail || centre.user?.email,
            mobile: centre.user?.mobile,
            temporaryPassword: res.temporaryPassword,
            portalUrl,
          });
          setIsCredsModalOpen(true);
          setConfirmAction((prev) => ({ ...prev, isOpen: false }));
          toast.success('Activation password reissued.');
          loadData();
        } catch (err: any) {
          toast.error(err.message || 'Failed to reissue activation');
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  const handleDeleteCentre = (centre: any) => {
    setConfirmAction({
      isOpen: true,
      title: 'Delete Centre Account',
      description: `Are you sure you want to permanently delete centre '${centre.centreName}' (${centre.centreCode || 'Pending Code'})? This will permanently remove the centre profile, user login credentials, registered location, and associated wallet. This action cannot be undone.`,
      confirmLabel: 'Delete Centre',
      isDestructive: true,
      action: async () => {
        setConfirmLoading(true);
        try {
          await api.deleteCentre(centre.id);
          toast.success(`Centre '${centre.centreName}' has been permanently deleted.`);
          setConfirmAction((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err: any) {
          toast.error(err.message || 'Failed to delete centre');
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  const openWalletAdjustModal = (centre: any) => {
    setWalletTargetCentre(centre);
    setWalletAdjustAction('CREDIT');
    setWalletAdjustAmount('500');
    setWalletAdjustReason('');
    setIsWalletModalOpen(true);
  };

  const handleWalletAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletTargetCentre) return;
    const amt = parseFloat(walletAdjustAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    const currentBal = Number(walletTargetCentre.user?.wallet?.availableBalance ?? 0);
    if (walletAdjustAction === 'DEBIT' && amt > currentBal) {
      toast.error(`Cannot deduct ₹ ${amt}: Centre only has ₹ ${currentBal.toFixed(2)} available.`);
      return;
    }

    setWalletSubmitting(true);
    try {
      const res: any = await api.adjustCentreWallet(walletTargetCentre.id, {
        amount: amt,
        action: walletAdjustAction,
        reason: walletAdjustReason.trim() || undefined,
      });
      toast.success(res.message || `Wallet balance successfully ${walletAdjustAction === 'CREDIT' ? 'credited' : 'deducted'}.`);
      setIsWalletModalOpen(false);
      loadData();
      if (historyCentre && historyCentre.id === walletTargetCentre.id && isHistoryModalOpen) {
        loadCentreHistory(walletTargetCentre.id, centreHistoryPage, centreHistoryType);
      }
      if (activeTab === 'ALL_WALLETS') {
        loadAllCentresWalletHistory();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust wallet balance');
    } finally {
      setWalletSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!credentialsData) return;
    const portalUrl = credentialsData.portalUrl || `${window.location.origin}/c/${credentialsData.centreCode}`;
    const text = `SevaTN Centre Onboarding Credentials\n------------------------------------\nCentre Name: ${credentialsData.centreName}\nCentre Code: ${credentialsData.centreCode}\nOperator: ${credentialsData.ownerName}\nLogin Email: ${credentialsData.email}\nMobile: ${credentialsData.mobile}\nTemporary Password: ${credentialsData.temporaryPassword}\n\nUnique Centre Login URL: ${portalUrl}\n\nNote: Open the unique portal link above to log into your centre. You will be prompted to set your permanent private password upon first sign-in.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPortalUrlOnly = () => {
    if (!credentialsData) return;
    const portalUrl = credentialsData.portalUrl || `${window.location.origin}/c/${credentialsData.centreCode}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedPortalUrl(true);
    setTimeout(() => setCopiedPortalUrl(false), 2000);
  };

  const copyCentrePortalUrl = (centreCode: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const portalUrl = `${window.location.origin}/c/${centreCode}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedUrlCode(centreCode);
    setTimeout(() => setCopiedUrlCode(null), 2000);
  };

  const shareViaWhatsApp = () => {
    if (!credentialsData) return;
    const portalUrl = credentialsData.portalUrl || `${window.location.origin}/c/${credentialsData.centreCode}`;
    const msg =
      `*SevaTN Centre Onboarding Credentials*\n` +
      `------------------------------------\n` +
      `*Centre Name:* ${credentialsData.centreName}\n` +
      `*Centre Code:* ${credentialsData.centreCode}\n` +
      `*Operator Name:* ${credentialsData.ownerName}\n` +
      `*Login ID:* ${credentialsData.email}\n` +
      `*Temporary Password:* ${credentialsData.temporaryPassword}\n\n` +
      `*Unique Centre Portal Login URL:*\n${portalUrl}\n\n` +
      `_Note: Open the link above to sign in. You will be required to create your permanent password on first login._`;
    const mobileDigits = (credentialsData.mobile || '').replace(/\D/g, '');
    const phoneParam = mobileDigits.length === 10 ? `91${mobileDigits}` : mobileDigits;
    window.open(`https://api.whatsapp.com/send?phone=${phoneParam}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Admin Centre Management & Network Wallets</h1>
            <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-[10.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
              Admin-Controlled Network
            </span>
          </div>
          <p className="text-xs text-secondary-500 mt-0.5">
            Provision, authorize, and audit statewide centres and inspect complete network wallet transaction histories
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => (activeTab === 'DIRECTORY' ? loadData() : loadAllCentresWalletHistory())}
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-border-default bg-white text-secondary-600 hover:bg-neutral-50 hover:text-text-primary transition-colors shadow-subtle cursor-pointer"
            title="Refresh View"
          >
            <RefreshCw className={`h-4 w-4 ${loading || ledgerLoading ? 'animate-spin' : ''}`} />
          </button>

          {activeTab === 'DIRECTORY' && (
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
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E6EAF0]">
        <button
          type="button"
          onClick={() => setActiveTab('DIRECTORY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'DIRECTORY'
              ? 'border-[#C98219] text-[#172033] bg-white'
              : 'border-transparent text-[#667085] hover:text-[#172033] hover:border-[#D0D5DD]'
          }`}
        >
          <Building2 className={`h-4 w-4 ${activeTab === 'DIRECTORY' ? 'text-[#C98219]' : 'text-[#667085]'}`} />
          <span>Centres Directory</span>
          <span className="rounded-full bg-[#F0F3F8] px-2 py-0.2 text-[10.5px] font-bold text-[#475467]">
            {centres.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALL_WALLETS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ALL_WALLETS'
              ? 'border-[#198754] text-[#155724] bg-white'
              : 'border-transparent text-[#667085] hover:text-[#155724] hover:border-[#D0D5DD]'
          }`}
        >
          <Receipt className={`h-4 w-4 ${activeTab === 'ALL_WALLETS' ? 'text-[#198754]' : 'text-[#667085]'}`} />
          <span>All Centres Wallet History</span>
          <span className="rounded-full bg-[#EAF7EE] border border-[#C3E6CB] px-2 py-0.2 text-[10.5px] font-bold text-[#155724]">
            Live Ledger
          </span>
        </button>
      </div>

      {activeTab === 'DIRECTORY' && (
        <div className="space-y-5">
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
                  <th className="py-2.5 px-4 font-semibold">Wallet Balance</th>
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-brand-900">{c.centreCode || 'SEVA-TN'}</span>
                          {c.centreCode && (
                            <button
                              type="button"
                              onClick={(e) => copyCentrePortalUrl(c.centreCode, e)}
                              className="p-1 rounded hover:bg-neutral-200/60 text-secondary-500 hover:text-brand-700 transition-colors cursor-pointer"
                              title="Copy Unique Login Portal URL (/c/[code])"
                            >
                              {copiedUrlCode === c.centreCode ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        {c.centreCode && (
                          <a
                            href={`/c/${c.centreCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10.5px] text-brand-700 hover:text-brand-900 font-semibold hover:underline mt-0.5"
                          >
                            <span>Open Portal</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-text-primary">{c.centreName}</p>
                        <p className="text-[10.5px] text-secondary-500 truncate max-w-xs">{c.address || `${c.taluk}, ${c.district}`}</p>
                        {c.user?.registeredLocation ? (
                          <p className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 inline text-emerald-600 shrink-0" />
                            GPS: {c.user.registeredLocation.latitude.toFixed(4)}, {c.user.registeredLocation.longitude.toFixed(4)}
                          </p>
                        ) : (
                          <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 inline text-amber-500 shrink-0" />
                            GPS: Not Configured
                          </p>
                        )}
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
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openCentreHistoryModal(c)}
                            className="text-left font-mono font-bold text-xs hover:underline cursor-pointer"
                            title="Click to view centre wallet history"
                          >
                            <span className={Number(c.user?.wallet?.availableBalance ?? 0) > 0 ? 'text-emerald-700' : 'text-neutral-600'}>
                              {formatINR(c.user?.wallet?.availableBalance ?? 0)}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openCentreHistoryModal(c)}
                            className="p-1 rounded hover:bg-emerald-50 text-[#155724] hover:text-[#198754] transition-colors cursor-pointer"
                            title="View Centre Wallet History"
                          >
                            <Receipt className="h-3.5 w-3.5 text-[#198754]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openWalletAdjustModal(c)}
                            className="p-1 rounded hover:bg-neutral-200/60 text-secondary-500 hover:text-brand-700 transition-colors cursor-pointer"
                            title="Adjust Centre Wallet (Credit/Debit)"
                          >
                            <Wallet className="h-3.5 w-3.5 text-brand-600" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => openCentreHistoryModal(c)}
                          className="text-[10px] text-secondary-500 hover:text-emerald-700 font-mono block hover:underline cursor-pointer text-left"
                        >
                          View Ledger History ↗
                        </button>
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
                          {/* Wallet History Button */}
                          <button
                            onClick={() => openCentreHistoryModal(c)}
                            className="flex h-7 px-2 items-center gap-1 rounded border border-[#C3E6CB] bg-[#F4FBF6] text-[#155724] hover:bg-[#EAF7EE] transition-colors"
                            title="View Centre Wallet Transaction History"
                          >
                            <Receipt className="h-3.5 w-3.5 text-[#198754]" />
                            <span className="text-[11px] font-semibold">History</span>
                          </button>

                          {/* Wallet Adjust Button */}
                          <button
                            onClick={() => openWalletAdjustModal(c)}
                            className="flex h-7 px-2 items-center gap-1 rounded border border-border-default bg-white text-secondary-700 hover:text-brand-700 hover:border-brand-500 hover:bg-brand-50/40 transition-colors"
                            title="Credit or Debit Centre Wallet"
                          >
                            <Wallet className="h-3.5 w-3.5 text-brand-600" />
                            <span className="text-[11px] font-semibold">Adjust</span>
                          </button>

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

                          {/* Delete Centre Button */}
                          <button
                            onClick={() => handleDeleteCentre(c)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-red-200 bg-white text-red-600 hover:text-white hover:bg-red-600 hover:border-red-600 transition-colors"
                            title="Delete Centre Permanently"
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
        )}
      </div>
      </div>
      )}

      {/* VIEW 2: ALL CENTRES WALLET HISTORY */}
      {activeTab === 'ALL_WALLETS' && (
        <div className="space-y-5">
          {/* Centre Wallets Overview Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricBlock
              label="TOTAL CENTRES WALLET HOLDINGS"
              value={formatINR(
                centres.reduce((sum, c) => sum + Number(c.user?.wallet?.availableBalance || 0), 0)
              )}
              helper="Combined liquid balance across all centre wallets"
              icon={Wallet}
            />
            <MetricBlock
              label="TOTAL TRANSACTIONS"
              value={String(ledgerData?.counts?.all ?? ledgerData?.pagination?.total ?? 0)}
              helper="Audit ledger entries across network"
              icon={Receipt}
            />
            <MetricBlock
              label="COMPLETED SETTLEMENTS"
              value={String(ledgerData?.counts?.completed ?? 0)}
              helper="Successfully posted wallet ledger transactions"
              icon={CheckCircle2}
            />
            <MetricBlock
              label="PENDING VERIFICATIONS"
              value={String(ledgerData?.counts?.pending ?? 0)}
              helper="Pending manual topup verifications"
              icon={Clock}
            />
          </div>

          {/* Filters & Transaction Ledger Card */}
          <div className="rounded-card border border-border-default bg-white shadow-subtle overflow-hidden">
            <div className="p-4 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
              <div>
                <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-[#198754]" />
                  <span>All Centre Wallet Transactions ({ledgerData?.pagination?.total ?? 0})</span>
                </h2>
                <p className="text-[11px] text-secondary-500 mt-0.5">
                  Complete real-time ledger of topups, manual adjustments, ticket fees, and escrow reserves across Tamil Nadu centres
                </p>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLedgerSearch('');
                    setLedgerType('ALL');
                    setLedgerStatus('ALL');
                    setLedgerDateFrom('');
                    setLedgerDateTo('');
                    setLedgerPage(1);
                  }}
                  className="px-3 py-1.5 rounded text-xs font-semibold border border-border-default hover:bg-neutral-50 text-secondary-600 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="p-4 bg-[#F8FAFC] border-b border-border-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search centre, code, ref, UTR, mobile..."
                  value={ledgerSearch}
                  onChange={(e) => {
                    setLedgerSearch(e.target.value);
                    setLedgerPage(1);
                  }}
                  className="w-full rounded-input border border-border-default bg-white pl-8 pr-3 py-1.5 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={ledgerType}
                  onChange={(e) => {
                    setLedgerType(e.target.value);
                    setLedgerPage(1);
                  }}
                  className="w-full rounded-input border border-border-default bg-white px-3 py-1.5 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="TOPUP">Topup Deposits (TOPUP)</option>
                  <option value="ADJUSTMENT">Admin Adjustments (ADJUSTMENT)</option>
                  <option value="RESERVE">Slot Reservations (RESERVE)</option>
                  <option value="CAPTURE">Ticket Fee Captures (CAPTURE)</option>
                  <option value="RELEASE">Reservation Releases (RELEASE)</option>
                  <option value="REFUND">Refunds (REFUND)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={ledgerStatus}
                  onChange={(e) => {
                    setLedgerStatus(e.target.value);
                    setLedgerPage(1);
                  }}
                  className="w-full rounded-input border border-border-default bg-white px-3 py-1.5 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Date From & To */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={ledgerDateFrom}
                  onChange={(e) => {
                    setLedgerDateFrom(e.target.value);
                    setLedgerPage(1);
                  }}
                  title="From Date"
                  className="w-full rounded-input border border-border-default bg-white px-2 py-1.5 text-[11px] text-text-primary focus:border-brand-500 focus:outline-none"
                />
                <span className="text-secondary-400 text-xs">to</span>
                <input
                  type="date"
                  value={ledgerDateTo}
                  onChange={(e) => {
                    setLedgerDateTo(e.target.value);
                    setLedgerPage(1);
                  }}
                  title="To Date"
                  className="w-full rounded-input border border-border-default bg-white px-2 py-1.5 text-[11px] text-text-primary focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Transactions Table */}
            {ledgerLoading ? (
              <div className="p-8">
                <LoadingSkeleton rows={8} className="h-10" />
              </div>
            ) : !ledgerData?.transactions || ledgerData.transactions.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No Wallet Transactions Found"
                description={
                  ledgerSearch || ledgerType !== 'ALL' || ledgerStatus !== 'ALL' || ledgerDateFrom || ledgerDateTo
                    ? 'No transactions match the selected filter criteria. Try clearing search or date filters.'
                    : 'There are no wallet ledger transactions recorded for registered centres yet.'
                }
                actionLabel={ledgerSearch || ledgerType !== 'ALL' ? 'Reset Filters' : undefined}
                onAction={() => {
                  setLedgerSearch('');
                  setLedgerType('ALL');
                  setLedgerStatus('ALL');
                  setLedgerDateFrom('');
                  setLedgerDateTo('');
                  setLedgerPage(1);
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border-subtle bg-neutral-50/75 text-secondary-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 font-bold">Date & Time</th>
                      <th className="py-3 px-4 font-bold">Centre Details</th>
                      <th className="py-3 px-4 font-bold">Type</th>
                      <th className="py-3 px-4 font-bold">Reference / Txn ID</th>
                      <th className="py-3 px-4 font-bold">Amount</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Details / Reason</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {ledgerData.transactions.map((tx: any) => {
                      const amt = Number(tx.amount || 0);
                      const isCredit = amt > 0;
                      const centreInfo = tx.user?.centre;

                      return (
                        <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                          {/* Date & Time */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-text-primary block font-medium">
                              {formatDate(tx.createdAt)}
                            </span>
                            <span className="text-[10.5px] text-secondary-400 font-mono block">
                              {formatTime(tx.createdAt)}
                            </span>
                          </td>

                          {/* Centre Details */}
                          <td className="py-3 px-4">
                            {centreInfo ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => openCentreHistoryModal({ ...centreInfo, user: tx.user })}
                                  className="font-bold text-text-primary hover:text-brand-700 hover:underline text-left block"
                                  title="Click to view full centre ledger"
                                >
                                  {centreInfo.centreName}
                                </button>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono text-[10.5px] text-brand-700 font-semibold bg-brand-50 px-1 rounded">
                                    {centreInfo.centreCode}
                                  </span>
                                  {centreInfo.district && (
                                    <span className="text-[10px] text-secondary-500">
                                      • {centreInfo.district}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="font-semibold text-text-primary">{tx.user?.name || 'Authorized Centre User'}</span>
                                <span className="text-[10.5px] text-secondary-400 block font-mono">{tx.user?.email}</span>
                              </div>
                            )}
                          </td>

                          {/* Transaction Type */}
                          <td className="py-3 px-4">
                            {tx.type === 'TOPUP' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#EAF7EE] text-[#155724] border border-[#C3E6CB]">
                                <ArrowDownLeft className="h-3 w-3 text-[#198754]" />
                                Topup Deposit
                              </span>
                            ) : tx.type === 'ADJUSTMENT' ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                isCredit
                                  ? 'bg-[#EAF7EE] text-[#155724] border border-[#C3E6CB]'
                                  : 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]'
                              }`}>
                                <SlidersHorizontal className="h-3 w-3" />
                                {isCredit ? 'Admin Credit' : 'Admin Deduction'}
                              </span>
                            ) : tx.type === 'CAPTURE' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                                <Receipt className="h-3 w-3 text-[#D92D20]" />
                                Ticket Fee Capture
                              </span>
                            ) : tx.type === 'RESERVE' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF7E6] text-[#8F5A0D] border border-[#F9DE9B]">
                                <Lock className="h-3 w-3 text-[#C98219]" />
                                Slot Reserve
                              </span>
                            ) : tx.type === 'RELEASE' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
                                <RotateCcw className="h-3 w-3" />
                                Reserve Release
                              </span>
                            ) : tx.type === 'REFUND' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <Coins className="h-3 w-3 text-purple-600" />
                                Refund
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 text-neutral-700">
                                {tx.type}
                              </span>
                            )}
                          </td>

                          {/* Reference / Txn ID */}
                          <td className="py-3 px-4 font-mono">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-text-primary font-semibold max-w-[150px] truncate" title={tx.reference || tx.id}>
                                {tx.reference || tx.id}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(tx.reference || tx.id);
                                  toast.success('Reference copied to clipboard');
                                }}
                                className="text-secondary-400 hover:text-brand-700 p-0.5 rounded transition-colors"
                                title="Copy Reference"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            {tx.metadata?.utr && (
                              <span className="text-[10px] text-secondary-500 block">
                                UTR: {tx.metadata.utr}
                              </span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`font-mono font-extrabold text-[12.5px] ${
                              tx.type === 'RESERVE'
                                ? 'text-[#8F5A0D]'
                                : isCredit
                                ? 'text-[#155724]'
                                : 'text-[#B42318]'
                            }`}>
                              {tx.type === 'RESERVE'
                                ? `₹ ${formatINR(Math.abs(amt))}`
                                : isCredit
                                ? `+ ₹ ${formatINR(amt)}`
                                : `- ₹ ${formatINR(Math.abs(amt))}`}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {tx.status === 'COMPLETED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#EAF7EE] text-[#155724] border border-[#C3E6CB]">
                                <Check className="h-3 w-3" />
                                COMPLETED
                              </span>
                            ) : tx.status === 'PENDING' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#FEF7E6] text-[#8F5A0D] border border-[#F9DE9B]">
                                <Clock className="h-3 w-3" />
                                PENDING
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                                <X className="h-3 w-3" />
                                {tx.status}
                              </span>
                            )}
                          </td>

                          {/* Details / Notes / Booking */}
                          <td className="py-3 px-4 max-w-[220px]">
                            {tx.booking && (
                              <div className="mb-0.5">
                                <span className="text-[11px] font-semibold text-[#175CD3] bg-[#EFF8FF] border border-[#B2DDFF] px-1.5 py-0.2 rounded inline-block font-mono">
                                  #{tx.booking.bookingCode}
                                </span>
                                {tx.booking.route && (
                                  <span className="text-[10px] text-secondary-500 block truncate">
                                    {tx.booking.route}
                                  </span>
                                )}
                              </div>
                            )}
                            {tx.metadata?.reason && (
                              <p className="text-[11px] text-[#344054] truncate italic" title={tx.metadata.reason}>
                                {tx.metadata.reason}
                              </p>
                            )}
                            {tx.metadata?.adminEmail && (
                              <span className="text-[10px] text-secondary-400 block font-mono">
                                By: {tx.metadata.adminEmail}
                              </span>
                            )}
                            {!tx.booking && !tx.metadata?.reason && !tx.metadata?.adminEmail && (
                              <span className="text-secondary-400 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {centreInfo && (
                              <button
                                type="button"
                                onClick={() => openCentreHistoryModal({ ...centreInfo, user: tx.user })}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#C3E6CB] bg-[#F4FBF6] hover:bg-[#EAF7EE] text-[#155724] text-[11px] font-semibold transition-colors"
                                title="View this centre's complete wallet ledger"
                              >
                                <Receipt className="h-3 w-3" />
                                <span>Centre Ledger</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {ledgerData?.pagination && ledgerData.pagination.totalPages > 1 && (
              <div className="p-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs text-secondary-600">
                <div>
                  Showing Page <strong className="text-text-primary">{ledgerData.pagination.page}</strong> of{' '}
                  <strong className="text-text-primary">{ledgerData.pagination.totalPages}</strong> (
                  {ledgerData.pagination.total} total transactions)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={ledgerData.pagination.page <= 1 || ledgerLoading}
                    onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded border border-border-default hover:bg-neutral-50 disabled:opacity-50 text-xs font-semibold text-text-primary transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Previous</span>
                  </button>

                  <span className="px-3 py-1 font-mono font-bold text-text-primary bg-neutral-100 rounded">
                    {ledgerData.pagination.page}
                  </span>

                  <button
                    type="button"
                    disabled={ledgerData.pagination.page >= ledgerData.pagination.totalPages || ledgerLoading}
                    onClick={() => setLedgerPage((p) => p + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded border border-border-default hover:bg-neutral-50 disabled:opacity-50 text-xs font-semibold text-text-primary transition-colors cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                      placeholder="e.g. Sri Murugan CSC & Online Service Centre"
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

                  <div className="pt-2 border-t border-[#F2F4F7]">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#344054] mb-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#C98219]" />
                      <span>Optional Initial GPS Coordinates (5 KM Geofence)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#667085] mb-1">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={createForm.latitude}
                          onChange={(e) => setCreateForm({ ...createForm, latitude: e.target.value })}
                          placeholder="e.g. 13.0067"
                          className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs font-mono text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#667085] mb-1">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={createForm.longitude}
                          onChange={(e) => setCreateForm({ ...createForm, longitude: e.target.value })}
                          placeholder="e.g. 80.2024"
                          className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs font-mono text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                        />
                      </div>
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
                          placeholder="muthu.centre@gmail.com"
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
                    value={credentialsData.portalUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/c/${credentialsData.centreCode}`}
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
                    href={credentialsData.portalUrl || `/c/${credentialsData.centreCode}`}
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
                <span className="text-sm">🔒</span>
                <span>
                  <strong>First Login Security:</strong> The operator will be automatically required to set their permanent private password upon entering these credentials.
                </span>
              </div>

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

                {/* GPS Coordinates Section */}
                <div className="md:col-span-2 rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-[#172033] text-xs">
                      <MapPin className="h-4 w-4 text-[#C98219]" />
                      <span>Registered Centre GPS Coordinates (5 KM Geofence)</span>
                    </div>
                    <span className="text-[10.5px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                      Super Admin Only
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667085] leading-relaxed">
                    Operators cannot modify their centre coordinates once registered. Only Super Administrators can update or reassign latitude & longitude coordinates.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#344054] mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 13.0067"
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs font-mono text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#344054] mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 80.2024"
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                        className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs font-mono text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219]"
                      />
                    </div>
                  </div>
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

      {/* MODAL: ADJUST CENTRE WALLET (SUPER ADMIN) */}
      {isWalletModalOpen && walletTargetCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-[12px] border border-[#E6EAF0] bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-[8px] text-white shadow-sm ${
                  walletAdjustAction === 'CREDIT' ? 'bg-emerald-600' : 'bg-red-600'
                }`}>
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033] tracking-tight">
                    {walletAdjustAction === 'CREDIT' ? 'Credit Centre Wallet' : 'Deduct Centre Wallet'}
                  </h3>
                  <p className="text-xs text-[#667085]">Super Admin Direct Financial Adjustment</p>
                </div>
              </div>
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#172033] hover:bg-[#F2F4F7] transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleWalletAdjustSubmit} className="p-6 space-y-5 text-xs">
              {/* Centre Identity & Current Balance Banner */}
              <div className="rounded-[10px] border border-[#E6EAF0] bg-[#FDFEFE] p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#172033] text-sm">{walletTargetCentre.centreName}</p>
                  <p className="text-[11px] font-mono text-secondary-500 mt-0.5">
                    Code: <span className="text-brand-900 font-semibold">{walletTargetCentre.centreCode}</span>
                    {walletTargetCentre.user?.name && ` • Operator: ${walletTargetCentre.user.name}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-secondary-500 uppercase tracking-wider block">
                    Current Balance
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    {formatINR(walletTargetCentre.user?.wallet?.availableBalance ?? 0)}
                  </span>
                </div>
              </div>

              {/* Action Switcher: CREDIT vs DEBIT */}
              <div>
                <label className="block font-semibold text-[#344054] mb-1.5">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-[8px] bg-neutral-100 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setWalletAdjustAction('CREDIT')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-[6px] text-xs font-bold transition-all ${
                      walletAdjustAction === 'CREDIT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-secondary-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                    }`}
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span>Credit (+) Add Funds</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletAdjustAction('DEBIT')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-[6px] text-xs font-bold transition-all ${
                      walletAdjustAction === 'DEBIT'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-secondary-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                    }`}
                  >
                    <ArrowDown className="h-4 w-4" />
                    <span>Deduct (-) Decrease Funds</span>
                  </button>
                </div>
              </div>

              {/* Amount Input & Preset Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-[#344054]">
                    Adjustment Amount (Chips) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1">
                    {[500, 1000, 2000, 5000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWalletAdjustAmount(preset.toString())}
                        className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-[10.5px] font-mono font-semibold text-secondary-700 border border-neutral-300 transition-colors"
                      >
                        ₹ {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-secondary-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={walletAdjustAmount}
                    onChange={(e) => setWalletAdjustAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-[7px] border border-[#D0D5DD] pl-8 pr-3 py-2 text-sm font-mono font-bold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
                  />
                </div>
              </div>

              {/* Reason / Reference */}
              <div>
                <label className="block font-semibold text-[#344054] mb-1">
                  Reason / Audit Reference (Optional)
                </label>
                <input
                  type="text"
                  value={walletAdjustReason}
                  onChange={(e) => setWalletAdjustReason(e.target.value)}
                  placeholder="e.g. Bank IMPS Ref #92831, Admin Correction, Direct Deposit"
                  className="w-full rounded-[7px] border border-[#D0D5DD] px-3 py-2 text-xs text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 focus:border-[#C98219] transition-all"
                />
              </div>

              {/* Dynamic Projection Summary */}
              {(() => {
                const currentBal = Number(walletTargetCentre.user?.wallet?.availableBalance ?? 0);
                const amt = parseFloat(walletAdjustAmount) || 0;
                const newBal = walletAdjustAction === 'CREDIT' ? currentBal + amt : currentBal - amt;
                const isInsufficient = walletAdjustAction === 'DEBIT' && amt > currentBal;

                return (
                  <div className={`p-3.5 rounded-[8px] border ${
                    isInsufficient ? 'bg-red-50 border-red-200 text-red-800' : 'bg-neutral-50 border-border-default'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-secondary-600">Current Balance:</span>
                      <span className="font-mono font-semibold">{formatINR(currentBal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-secondary-600">
                        {walletAdjustAction === 'CREDIT' ? 'Credit Addition:' : 'Deduction:'}
                      </span>
                      <span className={`font-mono font-bold ${
                        walletAdjustAction === 'CREDIT' ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {walletAdjustAction === 'CREDIT' ? `+ ${formatINR(amt)}` : `- ${formatINR(amt)}`}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                      <span className="font-bold text-text-primary">Projected New Balance:</span>
                      <span className={`font-mono font-bold text-sm ${
                        isInsufficient ? 'text-red-700' : 'text-brand-900'
                      }`}>
                        {formatINR(Math.max(0, newBal))}
                      </span>
                    </div>
                    {isInsufficient && (
                      <p className="text-[11px] text-red-700 font-medium mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>Cannot deduct more than available balance ({formatINR(currentBal)})</span>
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#E6EAF0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(false)}
                  className="px-4 py-2 rounded-[7px] border border-[#D0D5DD] text-[#344054] hover:bg-[#F2F4F7] text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walletSubmitting || (
                    walletAdjustAction === 'DEBIT' &&
                    (parseFloat(walletAdjustAmount) || 0) > Number(walletTargetCentre.user?.wallet?.availableBalance ?? 0)
                  )}
                  className={`px-5 py-2 rounded-[7px] text-white text-xs font-bold disabled:opacity-50 transition-all shadow-subtle ${
                    walletAdjustAction === 'CREDIT'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {walletSubmitting
                    ? 'Processing...'
                    : walletAdjustAction === 'CREDIT'
                    ? 'Confirm Credit Balance'
                    : 'Confirm Deduct Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: SINGLE CENTRE WALLET HISTORY MODAL */}
      {isHistoryModalOpen && historyCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl rounded-[12px] border border-[#E6EAF0] bg-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#198754] text-white shadow-sm">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033] tracking-tight flex items-center gap-2">
                    <span>{historyCentre.centreName}</span>
                    <span className="font-mono text-xs bg-neutral-200/70 text-text-primary px-1.5 py-0.5 rounded font-bold">
                      {historyCentre.centreCode}
                    </span>
                  </h3>
                  <p className="text-xs text-[#667085]">
                    Wallet Ledger & Audit History • {historyCentre.district || 'District Centre'}
                    {historyCentre.user?.mobile ? ` • Mobile: ${historyCentre.user.mobile}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setHistoryCentre(null);
                }}
                className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#172033] hover:bg-[#F2F4F7] transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Centre Balance & Action Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[10px] bg-gradient-to-br from-emerald-50/50 via-white to-neutral-50 border border-emerald-200/60 shadow-sm">
                <div>
                  <span className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider block">
                    Available Liquid Balance
                  </span>
                  <p className="text-2xl font-extrabold text-emerald-800 font-mono mt-1">
                    {formatINR(
                      historyCentre.user?.wallet?.availableBalance ??
                      centreHistoryData?.wallet?.availableBalance ??
                      0
                    )}
                  </p>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    Ready for booking slot allocations
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider block">
                    Escrow Reserved Balance
                  </span>
                  <p className="text-xl font-bold text-[#8F5A0D] font-mono mt-1">
                    {formatINR(
                      historyCentre.user?.wallet?.reservedBalance ??
                      centreHistoryData?.wallet?.reservedBalance ??
                      0
                    )}
                  </p>
                  <span className="text-[10px] text-secondary-400 block mt-0.5">
                    Held in active slot reservation queues
                  </span>
                </div>

                <div className="flex items-center sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWalletTargetCentre(historyCentre);
                      setWalletAdjustAction('CREDIT');
                      setWalletAdjustAmount('500');
                      setWalletAdjustReason('');
                      setIsWalletModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[7px] bg-[#198754] hover:bg-[#146c43] text-white font-bold text-xs shadow-subtle transition-all cursor-pointer"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Credit / Debit Balance</span>
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-secondary-500 text-[11px] font-bold mr-1">Filter Type:</span>
                  {[
                    { id: 'ALL', label: 'All Transactions' },
                    { id: 'TOPUP', label: 'Topups / Deposits' },
                    { id: 'ADJUSTMENT', label: 'Admin Adjustments' },
                    { id: 'CAPTURE', label: 'Ticket Fees' },
                    { id: 'RESERVE', label: 'Slot Reserves' },
                    { id: 'REFUND', label: 'Refunds' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setCentreHistoryType(f.id);
                        loadCentreHistory(historyCentre.id, 1, f.id);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                        centreHistoryType === f.id
                          ? 'bg-[#198754] text-white shadow-xs'
                          : 'bg-[#F2F4F7] text-[#475467] hover:bg-[#E4E7EC]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => loadCentreHistory(historyCentre.id, centreHistoryPage, centreHistoryType)}
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-secondary-600 hover:text-brand-700 p-1 cursor-pointer"
                  title="Reload Transactions"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${centreHistoryLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Ledger</span>
                </button>
              </div>

              {/* Transactions List */}
              {centreHistoryLoading ? (
                <div className="py-8">
                  <LoadingSkeleton rows={6} className="h-10" />
                </div>
              ) : !centreHistoryData?.transactions || centreHistoryData.transactions.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-[8px] border border-dashed border-border-default space-y-2">
                  <Receipt className="h-8 w-8 mx-auto text-secondary-400" />
                  <p className="font-bold text-text-primary text-xs">No transactions found</p>
                  <p className="text-[11px] text-secondary-500">
                    {centreHistoryType !== 'ALL'
                      ? 'No transactions match this type filter.'
                      : 'This centre has not performed any wallet transactions yet.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-[8px] border border-border-default overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border-subtle bg-neutral-50/75 text-secondary-500 uppercase tracking-wider text-[10.5px]">
                        <th className="py-2.5 px-3 font-bold">Date & Time</th>
                        <th className="py-2.5 px-3 font-bold">Type</th>
                        <th className="py-2.5 px-3 font-bold">Reference / ID</th>
                        <th className="py-2.5 px-3 font-bold">Amount</th>
                        <th className="py-2.5 px-3 font-bold">Status</th>
                        <th className="py-2.5 px-3 font-bold">Details / Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {centreHistoryData.transactions.map((tx: any) => {
                        const amt = Number(tx.amount || 0);
                        const isCredit = amt > 0;

                        return (
                          <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-mono text-text-primary block font-medium">
                                {formatDate(tx.createdAt)}
                              </span>
                              <span className="text-[10px] text-secondary-400 font-mono block">
                                {formatTime(tx.createdAt)}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              {tx.type === 'TOPUP' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EAF7EE] text-[#155724] border border-[#C3E6CB]">
                                  <ArrowDownLeft className="h-3 w-3 text-[#198754]" />
                                  Topup
                                </span>
                              ) : tx.type === 'ADJUSTMENT' ? (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isCredit
                                    ? 'bg-[#EAF7EE] text-[#155724] border border-[#C3E6CB]'
                                    : 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]'
                                }`}>
                                  <SlidersHorizontal className="h-3 w-3" />
                                  {isCredit ? 'Credit' : 'Debit'}
                                </span>
                              ) : tx.type === 'CAPTURE' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                                  <Receipt className="h-3 w-3 text-[#D92D20]" />
                                  Booking Fee
                                </span>
                              ) : tx.type === 'RESERVE' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF7E6] text-[#8F5A0D] border border-[#F9DE9B]">
                                  <Lock className="h-3 w-3 text-[#C98219]" />
                                  Reserve
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700">
                                  {tx.type}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 font-mono">
                              <div className="flex items-center gap-1">
                                <span className="text-[10.5px] text-text-primary font-semibold max-w-[140px] truncate" title={tx.reference || tx.id}>
                                  {tx.reference || tx.id}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(tx.reference || tx.id);
                                    toast.success('Reference copied');
                                  }}
                                  className="text-secondary-400 hover:text-brand-700 p-0.5 rounded"
                                  title="Copy"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                              {tx.metadata?.utr && (
                                <span className="text-[9.5px] text-secondary-500 block">
                                  UTR: {tx.metadata.utr}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`font-mono font-extrabold text-[12px] ${
                                tx.type === 'RESERVE'
                                  ? 'text-[#8F5A0D]'
                                  : isCredit
                                  ? 'text-[#155724]'
                                  : 'text-[#B42318]'
                              }`}>
                                {tx.type === 'RESERVE'
                                  ? `₹ ${formatINR(Math.abs(amt))}`
                                  : isCredit
                                  ? `+ ₹ ${formatINR(amt)}`
                                  : `- ₹ ${formatINR(Math.abs(amt))}`}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              {tx.status === 'COMPLETED' ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EAF7EE] text-[#155724]">
                                  <Check className="h-2.5 w-2.5" />
                                  COMPLETED
                                </span>
                              ) : tx.status === 'PENDING' ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FEF7E6] text-[#8F5A0D]">
                                  <Clock className="h-2.5 w-2.5" />
                                  PENDING
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FEF3F2] text-[#B42318]">
                                  {tx.status}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 max-w-[200px]">
                              {tx.booking && (
                                <span className="text-[10px] font-semibold text-[#175CD3] font-mono block">
                                  Booking #{tx.booking.bookingCode}
                                </span>
                              )}
                              {tx.metadata?.reason && (
                                <p className="text-[10.5px] text-[#344054] truncate italic" title={tx.metadata.reason}>
                                  {tx.metadata.reason}
                                </p>
                              )}
                              {tx.metadata?.adminEmail && (
                                <span className="text-[9.5px] text-secondary-400 font-mono block">
                                  By: {tx.metadata.adminEmail}
                                </span>
                              )}
                              {!tx.booking && !tx.metadata?.reason && !tx.metadata?.adminEmail && (
                                <span className="text-secondary-400 text-[10px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Centre Pagination */}
              {centreHistoryData?.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs text-secondary-600">
                  <span>
                    Page {centreHistoryData.page} of {centreHistoryData.totalPages} ({centreHistoryData.total} transactions)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={centreHistoryData.page <= 1 || centreHistoryLoading}
                      onClick={() => loadCentreHistory(historyCentre.id, centreHistoryData.page - 1, centreHistoryType)}
                      className="px-2.5 py-1 rounded border border-border-default hover:bg-neutral-50 disabled:opacity-50 text-xs font-semibold cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={centreHistoryData.page >= centreHistoryData.totalPages || centreHistoryLoading}
                      onClick={() => loadCentreHistory(historyCentre.id, centreHistoryData.page + 1, centreHistoryType)}
                      className="px-2.5 py-1 rounded border border-border-default hover:bg-neutral-50 disabled:opacity-50 text-xs font-semibold cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#E6EAF0] bg-[#F8FAFC] flex items-center justify-between">
              <span className="text-[11px] text-[#667085] font-mono">
                Centre ID: {historyCentre.id}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setHistoryCentre(null);
                }}
                className="px-4 py-1.5 rounded-[7px] border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F2F4F7] text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Action Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmAction.isOpen}
        title={confirmAction.title}
        description={confirmAction.description}
        confirmLabel={confirmAction.confirmLabel}
        cancelLabel="Cancel"
        isDestructive={confirmAction.isDestructive}
        loading={confirmLoading}
        onConfirm={confirmAction.action}
        onCancel={() => setConfirmAction((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
