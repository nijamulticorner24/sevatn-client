'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatINR, formatDate } from '../../../lib/utils';
import {
  Building2,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  DollarSign,
  MapPin,
  ShieldCheck,
  Phone,
  Mail,
  LayoutGrid,
  List,
  Copy,
  Check,
  Wallet,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  X,
  Loader2,
  Trash2,
  Receipt,
  History,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Lock,
  RotateCcw,
  Filter,
  RefreshCw,
  Eye,
  Plus,
  Coins,
} from 'lucide-react';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';

export default function AdminDistributorsPage() {
  const toast = useToast();
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ALL_WALLETS'>('DIRECTORY');

  // Single Distributor Wallet History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyDistributor, setHistoryDistributor] = useState<any>(null);
  const [distributorHistoryData, setDistributorHistoryData] = useState<any>(null);
  const [distributorHistoryLoading, setDistributorHistoryLoading] = useState(false);
  const [distributorHistoryType, setDistributorHistoryType] = useState<string>('ALL');
  const [distributorHistoryPage, setDistributorHistoryPage] = useState<number>(1);

  // All Distributors Wallet History Ledger State
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerPage, setLedgerPage] = useState<number>(1);
  const [ledgerLimit] = useState<number>(20);
  const [ledgerType, setLedgerType] = useState<string>('ALL');
  const [ledgerStatus, setLedgerStatus] = useState<string>('ALL');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [ledgerDateFrom, setLedgerDateFrom] = useState<string>('');
  const [ledgerDateTo, setLedgerDateTo] = useState<string>('');

  // Wallet Adjustment Modal State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTargetDistributor, setWalletTargetDistributor] = useState<any>(null);
  const [walletAdjustAction, setWalletAdjustAction] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [walletAdjustAmount, setWalletAdjustAmount] = useState<string>('500');
  const [walletAdjustReason, setWalletAdjustReason] = useState<string>('');
  const [walletSubmitting, setWalletSubmitting] = useState(false);

  // Confirm Dialog State
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

  useEffect(() => {
    loadDistributors();
  }, []);

  const loadDistributors = async () => {
    try {
      const data = await api.getAllDistributorsAdmin();
      setDistributors(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load distributors:', err);
      setLoading(false);
    }
  };

  const loadDistributorHistory = async (distributorId: string, page = 1, type = 'ALL') => {
    try {
      setDistributorHistoryLoading(true);
      const res = await api.getDistributorWalletHistory(distributorId, { page, limit: 15, type });
      setDistributorHistoryData(res);
      setDistributorHistoryLoading(false);
    } catch (err: any) {
      console.error('Failed to load distributor wallet history:', err);
      toast.error(err.message || 'Failed to load distributor wallet history.');
      setDistributorHistoryLoading(false);
    }
  };

  const openDistributorHistoryModal = (distributor: any) => {
    setHistoryDistributor(distributor);
    setDistributorHistoryType('ALL');
    setDistributorHistoryPage(1);
    setIsHistoryModalOpen(true);
    loadDistributorHistory(distributor.id, 1, 'ALL');
  };

  const loadAllDistributorsWalletHistory = async (page = 1) => {
    try {
      setLedgerLoading(true);
      const res = await api.getLedgerTransactions({
        page,
        limit: ledgerLimit,
        type: ledgerType,
        status: ledgerStatus,
        search: ledgerSearch,
        dateFrom: ledgerDateFrom || undefined,
        dateTo: ledgerDateTo || undefined,
        onlyDistributors: true,
      });
      setLedgerData(res);
      setLedgerPage(page);
      setLedgerLoading(false);
    } catch (err: any) {
      console.error('Failed to load all distributors wallet history:', err);
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ALL_WALLETS') {
      loadAllDistributorsWalletHistory(1);
    }
  }, [activeTab, ledgerType, ledgerStatus, ledgerDateFrom, ledgerDateTo]);

  const openWalletAdjustModal = (distributor: any) => {
    setWalletTargetDistributor(distributor);
    setWalletAdjustAction('CREDIT');
    setWalletAdjustAmount('500');
    setWalletAdjustReason('');
    setIsWalletModalOpen(true);
  };

  const handleWalletAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletTargetDistributor) return;
    const amt = parseFloat(walletAdjustAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setWalletSubmitting(true);
    try {
      const res: any = await api.adjustDistributorWallet(walletTargetDistributor.id, {
        amount: amt,
        action: walletAdjustAction,
        reason: walletAdjustReason.trim() || undefined,
      });
      toast.success(res.message || `Wallet balance successfully ${walletAdjustAction === 'CREDIT' ? 'credited' : 'deducted'}.`);
      setIsWalletModalOpen(false);
      loadDistributors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust wallet balance');
    } finally {
      setWalletSubmitting(false);
    }
  };

  const handleDeleteDistributor = (distributor: any) => {
    setConfirmAction({
      isOpen: true,
      title: 'Delete Distributor Account',
      description: `Are you sure you want to permanently delete distributor '${distributor.name}' (${distributor.distributorCode})? This will permanently remove the distributor account, login credentials, and wallet balance. Any affiliated centres will be detached. This action cannot be undone.`,
      confirmLabel: 'Delete Distributor',
      isDestructive: true,
      action: async () => {
        setConfirmLoading(true);
        try {
          await api.deleteDistributor(distributor.id);
          toast.success(`Distributor '${distributor.name}' has been permanently deleted.`);
          setConfirmAction((prev) => ({ ...prev, isOpen: false }));
          loadDistributors();
        } catch (err: any) {
          toast.error(err.message || 'Failed to delete distributor');
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = distributors.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.distributorCode?.toLowerCase().includes(q) ||
      d.mobile?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.partner?.name?.toLowerCase().includes(q) ||
      d.partner?.partnerCode?.toLowerCase().includes(q) ||
      d.district?.toLowerCase().includes(q) ||
      d.taluk?.toLowerCase().includes(q)
    );
  });

  const totalDistributorBalance = distributors.reduce(
    (sum, d) => sum + Number(d.availableBalance ?? d.user?.wallet?.availableBalance ?? 0),
    0
  );

  if (loading) {
    return <LoadingSkeleton rows={4} />;
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-xs text-[#8F5A0D] font-bold mb-3">
            <Building2 className="h-3.5 w-3.5 text-[#C98219]" />
            <span>Super Admin Operations • Network Oversight</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            Distributors Fleet ({distributors.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            All regional sub-tier Distributors operating between Partners and Centres across Tamil Nadu.
          </p>
        </div>

        {activeTab === 'DIRECTORY' && (
          /* Search & View Toggle */
          <div className="flex items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#667085]" />
              <input
                type="text"
                placeholder="Search code, name, phone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[8px] border border-[#E6EAF0] bg-white pl-9 pr-3 py-2 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-[8px] border border-[#E6EAF0] bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-[6px] transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#FEF7E6] text-[#C98219]'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-[6px] transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-[#FEF7E6] text-[#C98219]'
                    : 'text-[#667085] hover:text-[#172033]'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-[#E6EAF0] gap-6 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('DIRECTORY')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'DIRECTORY'
              ? 'border-[#C98219] text-[#172033]'
              : 'border-transparent text-[#667085] hover:text-[#172033]'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Distributors Directory</span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">
            {distributors.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('ALL_WALLETS');
            loadAllDistributorsWalletHistory(1);
          }}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'ALL_WALLETS'
              ? 'border-[#C98219] text-[#172033]'
              : 'border-transparent text-[#667085] hover:text-[#172033]'
          }`}
        >
          <History className="h-4 w-4" />
          <span>All Distributors Wallet History</span>
          <span className="rounded-full bg-[#FEF7E6] px-2 py-0.5 text-[10px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
            Ledger
          </span>
        </button>
      </div>

      {activeTab === 'DIRECTORY' ? (
        <>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-12 text-center text-xs text-[#667085] shadow-subtle">
          <Building2 className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
          <p className="font-semibold text-[#172033]">No Distributors Found</p>
          <p className="mt-1">No distributors match your search query.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* COMPACT TABLE VIEW - FITS ON SCREEN WITHOUT HORIZONTAL SCROLL */
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
          <div className="w-full overflow-x-auto xl:overflow-x-visible">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] uppercase tracking-wider font-semibold border-b border-[#E6EAF0] text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Distributor</th>
                  <th className="py-2.5 px-2.5">Contact</th>
                  <th className="py-2.5 px-2.5">Partner</th>
                  <th className="py-2.5 px-2">Jurisdiction</th>
                  <th className="py-2.5 px-2 text-center">Markup</th>
                  <th className="py-2.5 px-2.5">Wallet Balance</th>
                  <th className="py-2.5 px-2 text-center">Centres</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 text-center">Created</th>
                  <th className="py-2.5 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0]">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Distributor Name & Code */}
                    <td className="py-2.5 px-3 font-semibold text-[#172033]">
                      <div className="text-[12.5px] truncate max-w-[135px]" title={d.name}>{d.name}</div>
                      {d.businessName && (
                        <div className="text-[10.5px] font-normal text-[#667085] truncate max-w-[135px]" title={d.businessName}>
                          {d.businessName}
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-[#C98219] font-bold">{d.distributorCode}</div>
                    </td>

                    {/* Contact Details (Phone & Email) */}
                    <td className="py-2.5 px-2.5">
                      <div className="space-y-0.5 text-[11.5px]">
                        {d.mobile && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-[#175CD3] shrink-0" />
                            <a
                              href={`tel:${d.mobile}`}
                              className="font-mono font-medium text-[#172033] hover:text-[#175CD3] hover:underline"
                            >
                              {d.mobile}
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(d.mobile, `phone-${d.id}`)}
                              className="text-[#98A2B3] hover:text-[#172033] p-0.5"
                              title="Copy Mobile"
                            >
                              {copiedId === `phone-${d.id}` ? (
                                <Check className="h-2.5 w-2.5 text-[#198754]" />
                              ) : (
                                <Copy className="h-2.5 w-2.5" />
                              )}
                            </button>
                          </div>
                        )}
                        {d.email ? (
                          <div className="flex items-center gap-1 text-[10.5px]">
                            <Mail className="h-2.5 w-2.5 text-[#C98219] shrink-0" />
                            <a
                              href={`mailto:${d.email}`}
                              className="font-mono text-[#667085] hover:text-[#C98219] hover:underline truncate max-w-[125px]"
                              title={d.email}
                            >
                              {d.email}
                            </a>
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#98A2B3] italic">No email</div>
                        )}
                      </div>
                    </td>

                    {/* Partner Franchise */}
                    <td className="py-2.5 px-2.5">
                      <div className="font-medium text-[#172033] text-[11.5px] truncate max-w-[110px]" title={d.partner?.name || 'N/A'}>
                        {d.partner?.name || 'N/A'}
                      </div>
                      <div className="text-[10px] font-mono text-[#175CD3]">{d.partner?.partnerCode}</div>
                    </td>

                    {/* Jurisdiction */}
                    <td className="py-2.5 px-2 text-[#667085] text-[11.5px]">
                      <div className="truncate max-w-[95px]" title={`${d.district || 'All TN'} ${d.taluk ? `(${d.taluk})` : ''}`}>
                        {d.district || 'All TN'}
                      </div>
                    </td>

                    {/* Current Markup */}
                    <td className="py-2.5 px-2 text-center font-bold text-[#172033] text-[11.5px] whitespace-nowrap">
                      +{formatINR(d.markup || 0)}
                    </td>

                    {/* Wallet Balance */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <div className="font-bold text-[12.5px] font-mono text-[#102A43]">
                        {formatINR(d.availableBalance ?? d.user?.wallet?.availableBalance ?? 0)}
                      </div>
                      {Number(d.reservedBalance ?? d.user?.wallet?.reservedBalance ?? 0) > 0 && (
                        <div className="text-[9.5px] text-[#667085] font-mono">
                          Res: {formatINR(d.reservedBalance ?? d.user?.wallet?.reservedBalance ?? 0)}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => openDistributorHistoryModal(d)}
                        className="text-[10px] text-[#175CD3] hover:underline font-bold flex items-center gap-1 cursor-pointer mt-0.5"
                      >
                        <Receipt className="h-2.5 w-2.5" />
                        <span>View Ledger ↗</span>
                      </button>
                    </td>

                    {/* Centres Count */}
                    <td className="py-2.5 px-2 font-semibold text-[#172033] text-center text-[11.5px]">
                      {d.centresCount || 0}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      {!d.feePaid && d.paymentReference ? (
                        <div className="flex flex-col items-center">
                          <span className="rounded bg-[#FEF7E6] px-1.5 py-0.5 text-[9.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B] flex items-center gap-0.5">
                            <Clock className="h-2 w-2 text-[#C98219]" />
                            FEE PENDING
                          </span>
                        </div>
                      ) : d.status === 'ACTIVE' ? (
                        <span className="rounded bg-[#EAF7EE] px-1.5 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="rounded bg-[#FDECEC] px-1.5 py-0.5 text-[10px] font-bold text-[#C2413B] border border-[#F5C6CB]">
                          {d.status}
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-2.5 px-2 text-[#667085] text-[11px] text-center whitespace-nowrap">
                      {formatDate(d.createdAt)}
                    </td>

                    {/* Actions: History, Adjust Wallet & Delete */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDistributorHistoryModal(d)}
                          className="p-1.5 rounded-[6px] border border-[#B2DDFF] bg-[#EFF8FF] text-[#175CD3] hover:bg-[#D1E9FF] transition-colors shadow-2xs inline-flex items-center justify-center cursor-pointer"
                          title="View Wallet Transaction History"
                          aria-label="Wallet History"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openWalletAdjustModal(d)}
                          className="p-1.5 rounded-[6px] border border-[#F9DE9B] bg-[#FEF7E6] text-[#C98219] hover:bg-[#FCE0A6] hover:text-[#8F5A0D] transition-colors shadow-2xs inline-flex items-center justify-center cursor-pointer"
                          title="Adjust Wallet (Increase / Decrease Funds)"
                          aria-label="Adjust Wallet"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDistributor(d)}
                          className="p-1.5 rounded-[6px] border border-red-200 bg-white text-red-600 hover:text-white hover:bg-red-600 hover:border-red-600 transition-colors shadow-2xs inline-flex items-center justify-center cursor-pointer"
                          title="Delete Distributor Permanently"
                          aria-label="Delete Distributor"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between hover:border-[#D0D5DD] transition-all"
            >
              <div>
                {/* Card Top: Code & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono text-[10.5px] font-bold text-[#C98219] bg-[#FEF7E6] px-2.5 py-0.5 rounded border border-[#F9DE9B]">
                      {d.distributorCode}
                    </span>
                    <h3 className="text-base font-extrabold text-[#172033] mt-2">{d.name}</h3>
                    {d.businessName && <p className="text-xs text-[#667085]">{d.businessName}</p>}
                  </div>
                  <span
                    className={`rounded px-2.5 py-0.5 text-[10px] font-bold border ${
                      d.status === 'ACTIVE'
                        ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                        : 'bg-[#FDECEC] text-[#C2413B] border-[#F5C6CB]'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                {/* Prominent Contact Info Card Section */}
                <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-3 space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider">
                      Contact Information
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#175CD3]" />
                      <a
                        href={`tel:${d.mobile}`}
                        className="font-mono font-semibold text-[#172033] hover:text-[#175CD3] hover:underline"
                      >
                        {d.mobile || 'Not Available'}
                      </a>
                    </div>
                    {d.mobile && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(d.mobile, `c-phone-${d.id}`)}
                        className="text-[#98A2B3] hover:text-[#172033] p-1 rounded hover:bg-white"
                        title="Copy Phone Number"
                      >
                        {copiedId === `c-phone-${d.id}` ? (
                          <Check className="h-3 w-3 text-[#198754]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-[#C98219] shrink-0" />
                      {d.email ? (
                        <a
                          href={`mailto:${d.email}`}
                          className="font-mono text-[#667085] hover:text-[#C98219] hover:underline truncate"
                          title={d.email}
                        >
                          {d.email}
                        </a>
                      ) : (
                        <span className="text-[#98A2B3] italic text-[11px]">No Email Provided</span>
                      )}
                    </div>
                    {d.email && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(d.email, `c-mail-${d.id}`)}
                        className="text-[#98A2B3] hover:text-[#172033] p-1 rounded hover:bg-white shrink-0 ml-1"
                        title="Copy Email Address"
                      >
                        {copiedId === `c-mail-${d.id}` ? (
                          <Check className="h-3 w-3 text-[#198754]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-2 text-xs text-[#475467] border-t border-[#F0F3F7] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#667085]">Partner Franchise:</span>
                    <span className="font-semibold text-[#172033] flex items-center gap-1">
                      <span>{d.partner?.name || 'N/A'}</span>
                      <span className="text-[10px] font-mono text-[#175CD3]">({d.partner?.partnerCode})</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#667085]">Jurisdiction:</span>
                    <span className="font-medium text-[#172033]">
                      {d.district || 'All TN'} {d.taluk ? `(${d.taluk})` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#667085]">Ticket Markup:</span>
                    <span className="font-bold text-[#C98219]">+{formatINR(d.markup || 0)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#667085]">Affiliated Centres:</span>
                    <span className="font-extrabold text-[#172033]">{d.centresCount || 0} Centres</span>
                  </div>

                  {/* Wallet Balance Card Row */}
                  <div className="flex items-center justify-between bg-[#F8FAFC] rounded-[8px] p-2.5 border border-[#E6EAF0] mt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                        Wallet Balance
                      </span>
                      <span className="font-mono font-bold text-sm text-[#102A43]">
                        {formatINR(d.availableBalance ?? d.user?.wallet?.availableBalance ?? 0)}
                      </span>
                      {Number(d.reservedBalance ?? d.user?.wallet?.reservedBalance ?? 0) > 0 && (
                        <span className="text-[10px] text-[#667085] font-mono block">
                          Reserved: {formatINR(d.reservedBalance ?? d.user?.wallet?.reservedBalance ?? 0)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openDistributorHistoryModal(d)}
                        className="p-1.5 rounded-[6px] border border-[#B2DDFF] bg-[#EFF8FF] text-[#175CD3] hover:bg-[#D1E9FF] transition-colors shadow-2xs inline-flex items-center justify-center cursor-pointer"
                        title="View Wallet Ledger History"
                        aria-label="Wallet History"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openWalletAdjustModal(d)}
                        className="p-1.5 rounded-[6px] border border-[#F9DE9B] bg-[#FEF7E6] text-[#C98219] hover:bg-[#FCE0A6] hover:text-[#8F5A0D] transition-colors shadow-2xs inline-flex items-center justify-center"
                        title="Adjust Wallet (Increase / Decrease Funds)"
                        aria-label="Adjust Wallet"
                      >
                        <Wallet className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDistributor(d)}
                        className="p-1.5 rounded-[6px] border border-red-200 bg-white text-red-600 hover:text-white hover:bg-red-600 hover:border-red-600 transition-colors shadow-2xs inline-flex items-center justify-center"
                        title="Delete Distributor Permanently"
                        aria-label="Delete Distributor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-[#F0F3F7] flex items-center justify-between text-[11px] text-[#667085]">
                <span>Registered:</span>
                <span className="font-medium text-[#172033]">{formatDate(d.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      ) : (
        /* ALL DISTRIBUTORS WALLET HISTORY VIEW */
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="rounded-[10px] border border-[#B2DDFF] bg-[#F5FAFF] p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#175CD3]">
                Total Distributor Holdings
              </span>
              <div className="mt-2 text-2xl font-black text-[#175CD3]">
                {formatINR(totalDistributorBalance)}
              </div>
              <div className="mt-1 text-[11px] text-[#667085] font-medium">
                Combined available liquid balance
              </div>
            </div>

            <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                Total Transactions
              </span>
              <div className="mt-2 text-2xl font-black text-[#172033]">
                {ledgerData?.counts?.all ?? ledgerData?.pagination?.total ?? 0}
              </div>
              <div className="mt-1 text-[11px] text-[#667085] font-medium">
                Audited distributor ledger records
              </div>
            </div>

            <div className="rounded-[10px] border border-[#A6F4C5] bg-[#ECFDF3] p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#027A48]">
                Completed
              </span>
              <div className="mt-2 text-2xl font-black text-[#027A48]">
                {ledgerData?.counts?.completed ?? 0}
              </div>
              <div className="mt-1 text-[11px] text-[#027A48] font-medium">
                Settled transactions
              </div>
            </div>

            <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6] p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F5A0D]">
                Pending / In-Flight
              </span>
              <div className="mt-2 text-2xl font-black text-[#8F5A0D]">
                {ledgerData?.counts?.pending ?? 0}
              </div>
              <div className="mt-1 text-[11px] text-[#8F5A0D] font-medium">
                Awaiting clearance
              </div>
            </div>
          </div>

          {/* Interactive Ledger Section */}
          <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-[#E6EAF0]">
              <div>
                <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-[#C98219]" />
                  <span>All Distributor Wallet Transactions ({ledgerData?.pagination?.total ?? 0})</span>
                </h2>
                <p className="text-[11px] text-[#667085] mt-0.5">
                  Complete real-time ledger of topups, manual adjustments, markups, and transfers across Tamil Nadu distributors
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadAllDistributorsWalletHistory(ledgerPage)}
                  disabled={ledgerLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#D0D5DD] bg-white text-xs font-bold text-[#344054] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${ledgerLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#98A2B3]" />
                <input
                  type="text"
                  placeholder="Search distributor, code, ref, tx ID..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadAllDistributorsWalletHistory(1);
                  }}
                  className="w-full rounded-[6px] border border-[#D0D5DD] bg-white pl-9 pr-3 py-1.5 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={ledgerType}
                  onChange={(e) => {
                    setLedgerType(e.target.value);
                  }}
                  className="w-full rounded-[6px] border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
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
                  }}
                  className="w-full rounded-[6px] border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <input
                  type="date"
                  value={ledgerDateFrom}
                  onChange={(e) => setLedgerDateFrom(e.target.value)}
                  className="w-full rounded-[6px] border border-[#D0D5DD] bg-white px-2 py-1.5 text-[11px] text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
              </div>
            </div>

            {/* Transactions Table */}
            {ledgerLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-[#C98219]" />
                <p className="text-xs text-[#667085] mt-2">Loading distributor wallet ledger...</p>
              </div>
            ) : !ledgerData?.transactions || ledgerData.transactions.length === 0 ? (
              <div className="p-12 text-center bg-[#F8FAFC] rounded-[8px] border border-dashed border-[#D0D5DD] space-y-2">
                <Receipt className="h-8 w-8 mx-auto text-[#98A2B3]" />
                <p className="font-bold text-[#172033] text-sm">No Distributor Wallet Transactions Found</p>
                <p className="text-xs text-[#667085]">
                  {ledgerSearch || ledgerType !== 'ALL' || ledgerStatus !== 'ALL' || ledgerDateFrom
                    ? 'Try adjusting your filters or search keywords.'
                    : 'Distributor transactions will appear here as wallets are credited, debited, or adjusted.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[8px] border border-[#E6EAF0]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#667085] uppercase tracking-wider font-semibold border-b border-[#E6EAF0] text-[10.5px]">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Distributor</th>
                      <th className="py-2.5 px-3">Tx ID / Ref</th>
                      <th className="py-2.5 px-2.5 text-center">Type</th>
                      <th className="py-2.5 px-2.5 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0]">
                    {ledgerData.transactions.map((tx: any) => {
                      const isCredit = Number(tx.amount) > 0;
                      const distCode = tx.user?.distributorProfile?.distributorCode || 'DT';
                      const distName = tx.user?.distributorProfile?.name || tx.user?.name || 'Distributor';
                      const notes = tx.metadata?.notes || tx.metadata?.reason || tx.reference || '—';

                      return (
                        <tr key={tx.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap text-[#667085] font-mono text-[11px]">
                            {formatDate(tx.createdAt)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#172033] truncate max-w-[160px]" title={distName}>
                              {distName}
                            </div>
                            <span className="font-mono text-[10px] text-[#C98219] font-bold">
                              {distCode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#475467] truncate max-w-[150px]" title={tx.id}>
                            {tx.reference || tx.id.slice(0, 16)}
                          </td>
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              tx.type === 'TOPUP'
                                ? 'bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]'
                                : tx.type === 'ADJUSTMENT'
                                ? isCredit
                                  ? 'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]'
                                  : 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]'
                                : tx.type === 'CAPTURE'
                                ? 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]'
                                : tx.type === 'RESERVE'
                                ? 'bg-[#FEF7E6] text-[#8F5A0D] border border-[#F9DE9B]'
                                : tx.type === 'REFUND'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}>
                              {tx.type === 'TOPUP' ? (
                                <Plus className="h-3 w-3" />
                              ) : tx.type === 'ADJUSTMENT' ? (
                                <SlidersHorizontal className="h-3 w-3" />
                              ) : tx.type === 'CAPTURE' ? (
                                <Receipt className="h-3 w-3" />
                              ) : tx.type === 'RESERVE' ? (
                                <Lock className="h-3 w-3" />
                              ) : tx.type === 'REFUND' ? (
                                <Coins className="h-3 w-3" />
                              ) : null}
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              tx.status === 'COMPLETED'
                                ? 'bg-[#ECFDF3] text-[#027A48]'
                                : tx.status === 'PENDING'
                                ? 'bg-[#FEF7E6] text-[#8F5A0D]'
                                : 'bg-[#FEF3F2] text-[#B42318]'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                            <span className={isCredit ? 'text-[#027A48]' : 'text-[#D92D20]'}>
                              {isCredit ? '+' : ''}{formatINR(tx.amount)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-[#667085] truncate max-w-[200px]" title={notes}>
                            {notes}
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
              <div className="flex items-center justify-between pt-3 border-t border-[#E6EAF0] text-xs">
                <span className="text-[#667085]">
                  Showing Page <strong className="text-[#172033]">{ledgerPage}</strong> of{' '}
                  <strong className="text-[#172033]">{ledgerData.pagination.totalPages}</strong> (
                  {ledgerData.pagination.total} total transactions)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={ledgerPage <= 1 || ledgerLoading}
                    onClick={() => loadAllDistributorsWalletHistory(ledgerPage - 1)}
                    className="p-1.5 rounded-[6px] border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8FAFC] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={ledgerPage >= ledgerData.pagination.totalPages || ledgerLoading}
                    onClick={() => loadAllDistributorsWalletHistory(ledgerPage + 1)}
                    className="p-1.5 rounded-[6px] border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8FAFC] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wallet Adjustment Modal (Increase / Decrease Wallet Amount) */}
      {isWalletModalOpen && walletTargetDistributor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-[12px] bg-white shadow-modal border border-[#E6EAF0] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E6EAF0] flex items-center justify-between bg-[#FAFBFD]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#FEF7E6] border border-[#F9DE9B] flex items-center justify-center shrink-0">
                  <Wallet className="h-5 w-5 text-[#C98219]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#172033]">
                    Adjust Distributor Wallet
                  </h3>
                  <p className="text-xs text-[#667085]">Super Admin Direct Financial Adjustment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#172033] hover:bg-[#F2F4F7] transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleWalletAdjustSubmit} className="p-6 space-y-5 text-xs">
              {/* Distributor Identity & Current Balance Banner */}
              <div className="rounded-[10px] border border-[#E6EAF0] bg-[#FDFEFE] p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#172033] text-sm">{walletTargetDistributor.name}</p>
                  <p className="text-[11px] font-mono text-[#667085] mt-0.5">
                    Code: <span className="text-[#C98219] font-bold">{walletTargetDistributor.distributorCode}</span>
                    {walletTargetDistributor.district && ` • ${walletTargetDistributor.district}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider block">
                    Current Balance
                  </span>
                  <span className="text-base font-bold font-mono text-[#198754]">
                    {formatINR(walletTargetDistributor.availableBalance ?? walletTargetDistributor.user?.wallet?.availableBalance ?? 0)}
                  </span>
                </div>
              </div>

              {/* Action Switcher: CREDIT vs DEBIT */}
              <div>
                <label className="block font-semibold text-[#344054] mb-1.5">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-[8px] bg-[#F2F4F7] border border-[#E6EAF0]">
                  <button
                    type="button"
                    onClick={() => setWalletAdjustAction('CREDIT')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-[6px] text-xs font-bold transition-all ${
                      walletAdjustAction === 'CREDIT'
                        ? 'bg-[#198754] text-white shadow-xs'
                        : 'text-[#475467] hover:text-[#172033] hover:bg-white/60'
                    }`}
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span>Increase (+) Credit Funds</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletAdjustAction('DEBIT')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-[6px] text-xs font-bold transition-all ${
                      walletAdjustAction === 'DEBIT'
                        ? 'bg-[#C2413B] text-white shadow-xs'
                        : 'text-[#475467] hover:text-[#172033] hover:bg-white/60'
                    }`}
                  >
                    <ArrowDown className="h-4 w-4" />
                    <span>Decrease (-) Deduct Funds</span>
                  </button>
                </div>
              </div>

              {/* Amount Input & Preset Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-[#344054]">
                    Adjustment Amount (Chips) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {[500, 1000, 2000, 5000, 10000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWalletAdjustAmount(preset.toString())}
                        className="px-2 py-0.5 rounded bg-[#F8FAFC] hover:bg-[#F2F4F7] text-[10.5px] font-mono font-semibold text-[#475467] border border-[#D0D5DD] transition-colors"
                      >
                        ₹ {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#667085] font-bold">₹</span>
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
                const currentBal = Number(walletTargetDistributor.availableBalance ?? walletTargetDistributor.user?.wallet?.availableBalance ?? 0);
                const amt = parseFloat(walletAdjustAmount) || 0;
                const newBal = walletAdjustAction === 'CREDIT' ? currentBal + amt : currentBal - amt;
                const isInsufficient = walletAdjustAction === 'DEBIT' && amt > currentBal;

                return (
                  <div className={`p-3.5 rounded-[8px] border ${
                    isInsufficient ? 'bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]' : 'bg-[#FAFBFD] border-[#E6EAF0]'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#667085]">Current Balance:</span>
                      <span className="font-mono font-semibold">{formatINR(currentBal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#667085]">
                        {walletAdjustAction === 'CREDIT' ? 'Credit Addition:' : 'Deduction:'}
                      </span>
                      <span className={`font-mono font-bold ${
                        walletAdjustAction === 'CREDIT' ? 'text-[#198754]' : 'text-[#C2413B]'
                      }`}>
                        {walletAdjustAction === 'CREDIT' ? `+ ${formatINR(amt)}` : `- ${formatINR(amt)}`}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#E6EAF0] flex items-center justify-between text-xs">
                      <span className="font-bold text-[#172033]">Projected New Balance:</span>
                      <span className={`font-mono font-bold text-sm ${
                        isInsufficient ? 'text-[#C2413B]' : 'text-[#102A43]'
                      }`}>
                        {formatINR(Math.max(0, newBal))}
                      </span>
                    </div>
                    {isInsufficient && (
                      <p className="text-[11px] text-[#B42318] font-medium mt-2 flex items-center gap-1">
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
                    (parseFloat(walletAdjustAmount) || 0) > Number(walletTargetDistributor.availableBalance ?? walletTargetDistributor.user?.wallet?.availableBalance ?? 0)
                  )}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-[7px] text-white text-xs font-bold disabled:opacity-50 transition-all shadow-subtle ${
                    walletAdjustAction === 'CREDIT'
                      ? 'bg-[#198754] hover:bg-[#146c43]'
                      : 'bg-[#C2413B] hover:bg-[#a5332e]'
                  }`}
                >
                  {walletSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>
                      {walletAdjustAction === 'CREDIT' ? 'Increase Wallet Amount' : 'Decrease Wallet Amount'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: DELETE DISTRIBUTOR */}
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

      {/* SINGLE DISTRIBUTOR WALLET HISTORY MODAL */}
      {isHistoryModalOpen && historyDistributor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-4xl rounded-[14px] border border-[#E6EAF0] bg-white p-6 shadow-modal flex flex-col my-auto max-h-[90vh] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3.5 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-xs font-mono font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                      {historyDistributor.distributorCode}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[#172033]">
                      {historyDistributor.name} — Wallet Ledger History
                    </h3>
                  </div>
                  <p className="text-xs text-[#667085] mt-0.5">
                    {historyDistributor.district || 'Tamil Nadu'} • {historyDistributor.mobile} • Audited wallet transaction ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="rounded-[6px] p-1.5 text-[#667085] hover:bg-[#F0F3F8] hover:text-[#172033] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Distributor Balance Overview & Adjust Shortcut */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-[8px] border border-[#B2DDFF] bg-[#F5FAFF] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-[#175CD3] block">Available Balance</span>
                  <span className="font-mono text-lg font-black text-[#0B4FBA]">
                    {formatINR(distributorHistoryData?.distributor?.availableBalance ?? historyDistributor.availableBalance ?? historyDistributor.user?.wallet?.availableBalance ?? 0)}
                  </span>
                </div>
                <Wallet className="h-5 w-5 text-[#175CD3]" />
              </div>

              <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-[#667085] block">Reserved Balance</span>
                  <span className="font-mono text-lg font-black text-[#475467]">
                    {formatINR(distributorHistoryData?.distributor?.reservedBalance ?? historyDistributor.reservedBalance ?? historyDistributor.user?.wallet?.reservedBalance ?? 0)}
                  </span>
                </div>
                <Lock className="h-5 w-5 text-[#98A2B3]" />
              </div>

              <div className="rounded-[8px] border border-[#F9DE9B] bg-[#FEF7E6] p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-[#8F5A0D] block">Admin Adjust</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsHistoryModalOpen(false);
                      openWalletAdjustModal(historyDistributor);
                    }}
                    className="mt-1 inline-flex items-center gap-1 rounded-[6px] bg-[#C98219] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#B57414] shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Credit / Debit</span>
                  </button>
                </div>
                <SlidersHorizontal className="h-5 w-5 text-[#C98219]" />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E6EAF0] overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                {[
                  { id: 'ALL', label: 'All Transactions' },
                  { id: 'TOPUP', label: 'Topups / Credits' },
                  { id: 'ADJUSTMENT', label: 'Admin Adjustments' },
                  { id: 'CAPTURE', label: 'Ticket Fees' },
                  { id: 'RESERVE', label: 'Reserves' },
                  { id: 'REFUND', label: 'Refunds' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setDistributorHistoryType(f.id);
                      setDistributorHistoryPage(1);
                      loadDistributorHistory(historyDistributor.id, 1, f.id);
                    }}
                    className={`rounded-[6px] px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                      distributorHistoryType === f.id
                        ? 'bg-[#C98219] text-white shadow-2xs'
                        : 'bg-[#F8FAFC] text-[#475467] hover:bg-[#E6EAF0]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => loadDistributorHistory(historyDistributor.id, distributorHistoryPage, distributorHistoryType)}
                disabled={distributorHistoryLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#D0D5DD] bg-white text-[11px] font-bold text-[#344054] hover:bg-[#F8FAFC] cursor-pointer shrink-0"
              >
                <RefreshCw className={`h-3 w-3 ${distributorHistoryLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Transactions List */}
            <div className="overflow-y-auto flex-1 pr-1">
              {distributorHistoryLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-[#C98219]" />
                  <p className="text-xs text-[#667085] mt-2">Loading distributor ledger records...</p>
                </div>
              ) : !distributorHistoryData?.transactions || distributorHistoryData.transactions.length === 0 ? (
                <div className="p-8 text-center bg-[#F8FAFC] rounded-[8px] border border-dashed border-[#D0D5DD] space-y-2">
                  <Receipt className="h-8 w-8 mx-auto text-[#98A2B3]" />
                  <p className="font-bold text-[#172033] text-xs">No transactions recorded for this distributor</p>
                  <p className="text-[11px] text-[#667085]">
                    Wallet credits, debits, and transfers will appear here in chronological order.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[8px] border border-[#E6EAF0]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-[#667085] uppercase tracking-wider font-semibold border-b border-[#E6EAF0] text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Reference / Tx ID</th>
                        <th className="py-2.5 px-2 text-center">Type</th>
                        <th className="py-2.5 px-2 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EAF0]">
                      {distributorHistoryData.transactions.map((tx: any) => {
                        const isCredit = Number(tx.amount) > 0;
                        const notes = tx.metadata?.notes || tx.metadata?.reason || tx.reference || '—';

                        return (
                          <tr key={tx.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-3 whitespace-nowrap text-[#667085] font-mono text-[11px]">
                              {formatDate(tx.createdAt)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[10.5px] text-[#475467] truncate max-w-[140px]" title={tx.id}>
                              {tx.reference || tx.id.slice(0, 16)}
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                tx.type === 'TOPUP'
                                  ? 'bg-[#ECFDF3] text-[#027A48]'
                                  : tx.type === 'ADJUSTMENT'
                                  ? isCredit
                                    ? 'bg-[#EFF8FF] text-[#175CD3]'
                                    : 'bg-[#FEF3F2] text-[#B42318]'
                                  : tx.type === 'CAPTURE'
                                  ? 'bg-[#FEF3F2] text-[#B42318]'
                                  : 'bg-neutral-100 text-neutral-700'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                tx.status === 'COMPLETED'
                                  ? 'bg-[#ECFDF3] text-[#027A48]'
                                  : tx.status === 'PENDING'
                                  ? 'bg-[#FEF7E6] text-[#8F5A0D]'
                                  : 'bg-[#FEF3F2] text-[#B42318]'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                              <span className={isCredit ? 'text-[#027A48]' : 'text-[#D92D20]'}>
                                {isCredit ? '+' : ''}{formatINR(tx.amount)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-[#667085] truncate max-w-[180px]" title={notes}>
                              {notes}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Pagination */}
            {distributorHistoryData?.pagination && distributorHistoryData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E6EAF0] text-xs">
                <span className="text-[#667085]">
                  Page <strong>{distributorHistoryPage}</strong> of{' '}
                  <strong>{distributorHistoryData.pagination.totalPages}</strong> ({distributorHistoryData.pagination.total} total)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={distributorHistoryPage <= 1 || distributorHistoryLoading}
                    onClick={() => {
                      const prev = distributorHistoryPage - 1;
                      setDistributorHistoryPage(prev);
                      loadDistributorHistory(historyDistributor.id, prev, distributorHistoryType);
                    }}
                    className="p-1 rounded border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8FAFC] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={distributorHistoryPage >= distributorHistoryData.pagination.totalPages || distributorHistoryLoading}
                    onClick={() => {
                      const next = distributorHistoryPage + 1;
                      setDistributorHistoryPage(next);
                      loadDistributorHistory(historyDistributor.id, next, distributorHistoryType);
                    }}
                    className="p-1 rounded border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8FAFC] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
