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

        {/* Search & View Toggle */}
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
      </div>

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
                  <th className="py-2.5 px-2 text-center">Comm.</th>
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

                    {/* Commission Slab */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className="rounded bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] font-semibold text-[#475467] border border-[#E6EAF0]">
                        {d.commissionPercentage}%
                      </span>
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

                    {/* Actions: Adjust Wallet & Delete */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openWalletAdjustModal(d)}
                          className="p-1.5 rounded-[6px] border border-[#F9DE9B] bg-[#FEF7E6] text-[#C98219] hover:bg-[#FCE0A6] hover:text-[#8F5A0D] transition-colors shadow-2xs inline-flex items-center justify-center"
                          title="Adjust Wallet (Increase / Decrease Funds)"
                          aria-label="Adjust Wallet"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDistributor(d)}
                          className="p-1.5 rounded-[6px] border border-red-200 bg-white text-red-600 hover:text-white hover:bg-red-600 hover:border-red-600 transition-colors shadow-2xs inline-flex items-center justify-center"
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
                    <span className="text-[#667085]">Commission Slab:</span>
                    <span className="font-mono font-bold text-[#8F5A0D]">
                      {d.commissionSlab || 'STANDARD'} ({d.commissionPercentage}%)
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
                        🪙 {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#667085] font-bold">🪙</span>
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
    </div>
  );
}
