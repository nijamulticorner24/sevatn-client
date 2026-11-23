'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatINR, formatDate } from '../../../lib/utils';
import {
  DollarSign,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  SlidersHorizontal,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  Wallet,
  BadgeDollarSign,
} from 'lucide-react';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';

export default function AdminPricingConfigPage() {
  // Three-Level Ticket Markup State
  const [pricingConfig, setPricingConfig] = useState<any>({
    baseTicketPrice: 10,
    maxPartnerMarkup: 2,
    maxDistributorMarkup: 2,
    isActive: true,
    version: 1,
  });

  // Platform Financial Fee & License Architecture State
  const [feeConfig, setFeeConfig] = useState<any>({
    serviceFee: 100,
    registrationFee: 249,
    distributorFee: 399,
    franchiseFee: 599,
    partnerMinWithdrawal: 100,
  });

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cfgRes, systemRes, auditRes] = await Promise.all([
        api.getAdminPricingConfig().catch(() => null),
        api.getSystemConfig().catch(() => null),
        api.getPricingAuditLogs(50).catch(() => []),
      ]);

      if (cfgRes) {
        setPricingConfig({
          baseTicketPrice: Number(cfgRes.baseTicketPrice || 10),
          maxPartnerMarkup: Number(cfgRes.maxPartnerMarkup || 2),
          maxDistributorMarkup: Number(cfgRes.maxDistributorMarkup || 2),
          isActive: cfgRes.isActive !== false,
          version: cfgRes.version || 1,
        });
      }

      if (systemRes) {
        setFeeConfig({
          serviceFee: Number(systemRes.serviceFee ?? 100),
          registrationFee: Number(systemRes.registrationFee ?? 249),
          distributorFee: Number(systemRes.distributorFee ?? 399),
          franchiseFee: Number(systemRes.franchiseFee ?? 599),
          partnerMinWithdrawal: Number(systemRes.partnerMinWithdrawal ?? 100),
        });
      }

      if (auditRes) setAuditLogs(auditRes);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load pricing configuration:', err);
      setErrorMsg('Failed to load pricing configuration.');
      setLoading(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const base = Number(pricingConfig.baseTicketPrice);
    const partnerMax = Number(pricingConfig.maxPartnerMarkup);
    const distMax = Number(pricingConfig.maxDistributorMarkup);

    if (isNaN(base) || base < 0) {
      setErrorMsg('Base ticket price must be a valid non-negative number.');
      setSaving(false);
      return;
    }
    if (isNaN(partnerMax) || partnerMax < 0) {
      setErrorMsg('Maximum Partner markup must be a valid non-negative number.');
      setSaving(false);
      return;
    }
    if (isNaN(distMax) || distMax < 0) {
      setErrorMsg('Maximum Distributor markup must be a valid non-negative number.');
      setSaving(false);
      return;
    }

    try {
      // 1. Update Three-Level Ticket Markup & Base Pricing
      const updatedPricing = await api.updateAdminPricingConfig({
        baseTicketPrice: base,
        maxPartnerMarkup: partnerMax,
        maxDistributorMarkup: distMax,
        isActive: pricingConfig.isActive,
      });

      setPricingConfig((prev: any) => ({
        ...prev,
        baseTicketPrice: Number(updatedPricing.baseTicketPrice),
        maxPartnerMarkup: Number(updatedPricing.maxPartnerMarkup),
        maxDistributorMarkup: Number(updatedPricing.maxDistributorMarkup),
        version: updatedPricing.version,
      }));

      // 2. Update Platform Financial Fee & License Architecture
      await api.updateSystemConfig({
        serviceFee: Number(feeConfig.serviceFee),
        registrationFee: Number(feeConfig.registrationFee),
        distributorFee: Number(feeConfig.distributorFee),
        franchiseFee: Number(feeConfig.franchiseFee),
        partnerMinWithdrawal: Number(feeConfig.partnerMinWithdrawal),
      });

      setSuccessMsg('All Pricing, Markups & Platform Financial Fees updated successfully!');
      setTimeout(() => setSuccessMsg(null), 5000);

      // Refresh audit logs
      const freshLogs = await api.getPricingAuditLogs(50).catch(() => []);
      if (freshLogs) setAuditLogs(freshLogs);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update pricing & fee configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={4} />;
  }

  const basePrice = Number(pricingConfig.baseTicketPrice || 0);
  const maxPartner = Number(pricingConfig.maxPartnerMarkup || 0);
  const maxDistributor = Number(pricingConfig.maxDistributorMarkup || 0);
  const maxPossiblePrice = basePrice + maxPartner + maxDistributor;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E6EAF0]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-xs text-[#8F5A0D] font-bold mb-3">
            <DollarSign className="h-3.5 w-3.5 text-[#C98219]" />
            <span>Super Admin Control Hub • Pricing, Markups &amp; Financial Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            Pricing, Markups &amp; Financial Architecture
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1 max-w-2xl">
            Unified management of customer-facing Three-Level Ticket Markups, Platform Service Fees, Franchise License Fees, and Centre Onboarding rates.
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSaveAll}
          className="rounded-[8px] bg-[#C98219] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#B57414] shadow-subtle flex items-center gap-2 self-start sm:self-auto transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving Parameters...' : 'Save All Pricing & Fees'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="rounded-[8px] border border-[#C3E6CB] bg-[#EAF7EE] p-3 text-xs font-semibold text-[#198754] flex items-center gap-2 shadow-subtle">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#198754]" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-[8px] border border-[#F5C6CB] bg-[#FDECEC] p-3 text-xs font-semibold text-[#C2413B] flex items-center gap-2 shadow-subtle">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. THREE-LEVEL TICKET PRICING SYSTEM                         */}
      {/* ============================================================ */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#FEF7E6] border border-[#F9DE9B] text-[#8F5A0D]">
              <DollarSign className="h-4 w-4 text-[#C98219]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033]">
                1. Three-Level Ticket Markup Architecture
              </h2>
              <p className="text-xs text-[#667085]">
                Hierarchy: <strong className="text-[#172033]">SUPER_ADMIN → PARTNER → DISTRIBUTOR → CENTRE</strong>
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-[#C98219] bg-[#FEF7E6] px-2.5 py-1 rounded border border-[#F9DE9B]">
            v{pricingConfig.version || 1}
          </span>
        </div>

        {/* Real-time Pricing Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#667085] mb-1">
              <span>Base Ticket Price</span>
              <ShieldCheck className="h-4 w-4 text-[#C98219]" />
            </div>
            <div className="text-2xl font-black text-[#172033]">{formatINR(basePrice)}</div>
            <p className="text-[10.5px] text-[#667085] mt-1">Universal base fee per ticket</p>
          </div>

          <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#667085] mb-1">
              <span>Max Partner Markup</span>
              <Users className="h-4 w-4 text-[#175CD3]" />
            </div>
            <div className="text-2xl font-black text-[#175CD3]">+{formatINR(maxPartner)}</div>
            <p className="text-[10.5px] text-[#667085] mt-1">Cap for Regional Partners</p>
          </div>

          <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#667085] mb-1">
              <span>Max Distributor Markup</span>
              <Building2 className="h-4 w-4 text-[#7A5AF8]" />
            </div>
            <div className="text-2xl font-black text-[#7A5AF8]">+{formatINR(maxDistributor)}</div>
            <p className="text-[10.5px] text-[#667085] mt-1">Cap for Taluk Distributors</p>
          </div>

          <div className="rounded-[8px] border border-[#198754]/30 bg-[#EAF7EE] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#198754] mb-1">
              <span>Max Final Ticket Price</span>
              <Sparkles className="h-4 w-4 text-[#198754]" />
            </div>
            <div className="text-2xl font-black text-[#198754]">{formatINR(maxPossiblePrice)}</div>
            <p className="text-[10.5px] text-[#198754] mt-1">🪙 {basePrice} + 🪙 {maxPartner} + 🪙 {maxDistributor}</p>
          </div>
        </div>

        {/* Form Fields for Ticket Markups */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Base Ticket Price (Chips) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#667085] font-bold">🪙</span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={pricingConfig.baseTicketPrice}
                onChange={(e) => setPricingConfig({ ...pricingConfig, baseTicketPrice: e.target.value })}
                className="w-full rounded-[8px] border border-[#E6EAF0] bg-white pl-8 pr-3 py-2 text-sm font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] mt-1">Universal base price before any markups.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Maximum Partner Markup Cap (Chips) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#667085] font-bold">🪙</span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={pricingConfig.maxPartnerMarkup}
                onChange={(e) => setPricingConfig({ ...pricingConfig, maxPartnerMarkup: e.target.value })}
                className="w-full rounded-[8px] border border-[#E6EAF0] bg-white pl-8 pr-3 py-2 text-sm font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] mt-1">Partners cannot set markup exceeding this cap.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Maximum Distributor Markup Cap (Chips) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#667085] font-bold">🪙</span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={pricingConfig.maxDistributorMarkup}
                onChange={(e) => setPricingConfig({ ...pricingConfig, maxDistributorMarkup: e.target.value })}
                className="w-full rounded-[8px] border border-[#E6EAF0] bg-white pl-8 pr-3 py-2 text-sm font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] mt-1">Distributors cannot set markup exceeding this cap.</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. PLATFORM FINANCIAL FEE & LICENSE ARCHITECTURE             */}
      {/* ============================================================ */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#EFF8FF] border border-[#B2DDFF] text-[#175CD3]">
              <Receipt className="h-4 w-4 text-[#175CD3]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172033]">
                2. Platform Financial Fee &amp; License Architecture
              </h2>
              <p className="text-xs text-[#667085]">
                Configure standard booking service fees, one-time onboarding licenses, and partner withdrawal limits.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#198754] bg-[#EAF7EE] px-2.5 py-1 rounded-full border border-[#C3E6CB]">
            Platform Global Rates
          </span>
        </div>

        {/* Fee Architecture Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3.5">
            <span className="text-[11px] font-semibold text-[#667085]">Booking Service Fee</span>
            <div className="text-2xl font-black text-[#172033] mt-1">{formatINR(feeConfig.serviceFee || 100)}</div>
            <p className="text-[10.5px] text-[#667085] mt-1">Debited from centre wallet</p>
          </div>

          <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3.5">
            <span className="text-[11px] font-semibold text-[#667085]">Centre Onboarding Fee</span>
            <div className="text-2xl font-black text-[#175CD3] mt-1">{formatINR(feeConfig.registrationFee || 249)}</div>
            <p className="text-[10.5px] text-[#667085] mt-1">One-time centre license</p>
          </div>

          <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3.5">
            <span className="text-[11px] font-semibold text-[#667085]">Distributor License Fee</span>
            <div className="text-2xl font-black text-[#7F56D9] mt-1">{formatINR(feeConfig.distributorFee || 399)}</div>
            <p className="text-[10.5px] text-[#667085] mt-1">One-time distributor network</p>
          </div>

          <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3.5">
            <span className="text-[11px] font-semibold text-[#667085]">Franchise License Fee</span>
            <div className="text-2xl font-black text-[#C98219] mt-1">{formatINR(feeConfig.franchiseFee || 599)}</div>
            <p className="text-[10.5px] text-[#667085] mt-1">One-time partner onboarding</p>
          </div>

          <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3.5">
            <span className="text-[11px] font-semibold text-[#667085]">Partner Min Withdrawal</span>
            <div className="text-2xl font-black text-[#198754] mt-1">{formatINR(feeConfig.partnerMinWithdrawal || 100)}</div>
            <p className="text-[10.5px] text-[#667085] mt-1">Minimum payout threshold</p>
          </div>
        </div>

        {/* Input Fields for Platform Fees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Service Fee per Booking (Chips) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#667085] font-bold">🪙</span>
              <input
                type="number"
                min="0"
                value={feeConfig.serviceFee}
                onChange={(e) => setFeeConfig({ ...feeConfig, serviceFee: Number(e.target.value) })}
                className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-8 pr-3 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] mt-1">Standard fee debited on confirmed pass booking.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Centre Onboarding Fee (Chips) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#667085] font-bold">🪙</span>
              <input
                type="number"
                min="0"
                value={feeConfig.registrationFee}
                onChange={(e) => setFeeConfig({ ...feeConfig, registrationFee: Number(e.target.value) })}
                className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-8 pr-3 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] mt-1">One-time registration for Booking / CSC centres (Default: 🪙 249).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Distributor License Fee (Chips) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#667085] font-bold">🪙</span>
              <input
                type="number"
                min="0"
                value={feeConfig.distributorFee}
                onChange={(e) => setFeeConfig({ ...feeConfig, distributorFee: Number(e.target.value) })}
                className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-8 pr-3 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#7F56D9] focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] mt-1">One-time authorized distributor network license (Default: 🪙 399).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5">
              Partner Franchise License Fee (Chips) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#667085] font-bold">🪙</span>
              <input
                type="number"
                min="0"
                value={feeConfig.franchiseFee}
                onChange={(e) => setFeeConfig({ ...feeConfig, franchiseFee: Number(e.target.value) })}
                className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-8 pr-3 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] mt-1">One-time regional franchise partner onboarding fee (Default: 🪙 599).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1.5 flex items-center justify-between">
              <span>Partner Min Withdrawal (Chips) *</span>
              <span className="text-[10px] font-bold text-[#C98219] bg-[#FEF7E6] px-1.5 py-0.5 rounded border border-[#F9DE9B]">Payout Limit</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#667085] font-bold">🪙</span>
              <input
                type="number"
                min="1"
                value={feeConfig.partnerMinWithdrawal}
                onChange={(e) => setFeeConfig({ ...feeConfig, partnerMinWithdrawal: Number(e.target.value) })}
                className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-8 pr-3 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-[#667085] mt-1">Minimum wallet balance partner can request to withdraw (Default: 🪙 100).</p>
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[10px] border border-[#E6EAF0] shadow-subtle">
        <span className="text-xs text-[#667085]">
          Changes to pricing caps and platform fees take effect immediately across all booking workflows and registration portals.
        </span>
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveAll}
          className="inline-flex items-center gap-2 rounded-[8px] bg-[#C98219] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#A86B14] transition-all shadow-subtle disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving Parameters...' : 'Save All Pricing & Fees'}</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 3. PRICING AUDIT HISTORY & VERSION LOG                       */}
      {/* ============================================================ */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#C98219]" />
            <span>Pricing &amp; Fee Audit History</span>
          </h2>
          <span className="text-xs text-[#667085]">Immutable audit records</span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-[#667085] py-4">No pricing audit entries recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] uppercase tracking-wider font-semibold border-b border-[#E6EAF0]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-3 text-[#667085] whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="py-3 px-3 font-semibold text-[#172033]">{log.actorRole || 'SUPER_ADMIN'}</td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-[#EFF8FF] px-2 py-0.5 text-[10px] font-bold text-[#175CD3] border border-[#B2DDFF]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#172033] font-mono">{log.targetEntity}</td>
                    <td className="py-3 px-3 text-[#475467]">
                      {log.newValues ? (
                        <pre className="text-[10px] bg-[#F8FAFC] p-1.5 rounded border border-[#E6EAF0] font-mono">
                          {JSON.stringify(log.newValues, null, 1)}
                        </pre>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
