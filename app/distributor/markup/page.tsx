'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  DollarSign,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  Info,
  TrendingUp,
  RefreshCw,
  Layers,
  HelpCircle,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export default function DistributorMarkupPage() {
  const [data, setData] = useState<any>(null);
  const [markupInput, setMarkupInput] = useState<number>(0);
  const [savedMarkup, setSavedMarkup] = useState<number>(0);
  const [simulationVolume, setSimulationVolume] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMarkup();
  }, []);

  const loadMarkup = async () => {
    try {
      const res = await api.getDistributorMarkup();
      setData(res);
      const current = Number(res?.currentMarkup || 0);
      setMarkupInput(current);
      setSavedMarkup(current);
      setLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load distributor markup settings');
      setLoading(false);
    }
  };

  const basePrice = Number(data?.baseTicketPrice || 10);
  const partnerMarkup = Number(data?.partnerMarkup || 0);
  const maxCap = Number(data?.maxAllowedMarkup || 2);
  const currentMarkup = Number(markupInput || 0);
  const finalPrice = basePrice + partnerMarkup + currentMarkup;
  const isDirty = markupInput !== savedMarkup;

  // Preset markup values within maxCap
  const quickPresets = useMemo(() => {
    const list = [0];
    if (maxCap >= 0.5) list.push(0.5);
    if (maxCap >= 1.0) list.push(1.0);
    if (maxCap >= 1.5) list.push(1.5);
    if (!list.includes(maxCap)) list.push(maxCap);
    return list;
  }, [maxCap]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const val = Number(markupInput);
    if (val < 0) {
      setErrorMsg('Markup cannot be negative.');
      setSaving(false);
      return;
    }
    if (val > maxCap) {
      setErrorMsg(`Markup cannot exceed the Super Admin limit of ₹ ${maxCap.toFixed(2)}`);
      setSaving(false);
      return;
    }

    try {
      await api.updateDistributorMarkup(val);
      setSavedMarkup(val);
      setData((prev: any) => ({
        ...prev,
        currentMarkup: val,
        finalTicketPrice: basePrice + partnerMarkup + val,
      }));
      setSuccessMsg('Your Distributor markup has been saved successfully!');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update distributor markup');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMarkupInput(savedMarkup);
    setErrorMsg(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  // Calculate percentages for stacked progress bar
  const totalBar = Math.max(finalPrice, basePrice + partnerMarkup + maxCap);
  const basePct = (basePrice / totalBar) * 100;
  const partnerPct = (partnerMarkup / totalBar) * 100;
  const distributorPct = (currentMarkup / totalBar) * 100;
  const projectedRevenue = currentMarkup * simulationVolume;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#667085] mb-1 font-medium">
            <Link href="/distributor" className="hover:text-[#172033] transition-colors">
              Distributor Portal
            </Link>
            <span>/</span>
            <span className="text-[#172033] font-semibold">Ticket Markup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            Distributor Ticket Markup
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Configure your independent markup per ticket. This value applies to all bookings created by Centres in your network.
          </p>
        </div>

        {/* Distributor Context Chips */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E6EAF0] bg-white px-3 py-1 text-xs font-semibold text-[#344054] shadow-xs">
            <Building2 className="h-3.5 w-3.5 text-[#667085]" />
            <span>Code:</span>
            <span className="font-mono font-bold text-[#172033]">{data?.distributorCode || 'DT-001'}</span>
          </div>
          {data?.partnerCode && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#B2DDFF] bg-[#EFF8FF] px-3 py-1 text-xs font-semibold text-[#175CD3] shadow-xs">
              <span>Partner:</span>
              <span className="font-mono font-bold">{data.partnerCode}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-xs font-bold text-[#8F5A0D] shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-[#C98219]" />
            <span>Cap: {formatINR(maxCap)}</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-[10px] border border-[#C3E6CB] bg-[#EAF7EE] p-4 text-xs font-semibold text-[#198754] flex items-center justify-between shadow-xs transition-all">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#198754]" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-[#198754] hover:opacity-75 text-[11px] underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-[10px] border border-[#F5C6CB] bg-[#FDECEC] p-4 text-xs font-semibold text-[#C2413B] flex items-center justify-between shadow-xs transition-all">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B]" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-[#C2413B] hover:opacity-75 text-[11px] underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4-Tier Interactive Pricing Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Base Ticket Price (Based on Partner Base Rate) */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                1. Base Ticket
              </span>
              <span className="rounded-[6px] bg-[#EFF8FF] px-1.5 py-0.5 text-[10px] font-bold text-[#175CD3] border border-[#B2DDFF]">
                {data?.isCustomPartnerRate ? 'Partner Base' : 'Base Rate'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-2">
              {formatINR(basePrice)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F2F4F7] flex items-center justify-between text-[11px] text-[#667085]">
            <span>{data?.partnerCode ? `Partner (${data.partnerCode}) Rate` : 'Partner Base Rate'}</span>
            <span className="font-medium text-[#175CD3] font-semibold">
              {data?.isCustomPartnerRate ? 'Custom Partner Rate' : 'Standard Base'}
            </span>
          </div>
        </div>

        {/* 2. Partner Markup */}
        <div className="rounded-[10px] border border-[#B2DDFF]/60 bg-[#F8FBFF] p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#175CD3] uppercase tracking-wider">
                2. Partner Markup
              </span>
              <span className="rounded-[6px] bg-[#D1E9FF] px-1.5 py-0.5 text-[10px] font-bold text-[#175CD3]">
                Tier 2
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#175CD3] mt-2">
              +{formatINR(partnerMarkup)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#B2DDFF]/40 flex items-center justify-between text-[11px] text-[#175CD3]">
            <span>Franchise Partner</span>
            <span className="font-mono font-semibold">{data?.partnerCode || 'PT'}</span>
          </div>
        </div>

        {/* 3. Distributor Markup */}
        <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FFFDF5] p-4 sm:p-5 shadow-subtle flex flex-col justify-between relative overflow-hidden">
          {isDirty && (
            <span className="absolute top-0 right-0 rounded-bl-[8px] bg-[#C98219] px-2 py-0.5 text-[9.5px] font-bold text-white uppercase tracking-wider">
              Draft
            </span>
          )}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8F5A0D] uppercase tracking-wider">
                3. Your Markup
              </span>
              <span className="rounded-[6px] bg-[#FEF7E6] border border-[#F9DE9B] px-1.5 py-0.5 text-[10px] font-bold text-[#8F5A0D]">
                Tier 3
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#C98219] mt-2">
              +{formatINR(currentMarkup)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F9DE9B]/60 flex items-center justify-between text-[11px] text-[#8F5A0D]">
            <span>Max Cap: {formatINR(maxCap)}</span>
            <span className="font-bold">{((currentMarkup / maxCap) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* 4. Final Booking Rate */}
        <div className="rounded-[10px] border border-[#198754]/30 bg-[#EAF7EE] p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#198754] uppercase tracking-wider">
                Final Ticket Rate
              </span>
              <span className="rounded-[6px] bg-[#198754] px-1.5 py-0.5 text-[10px] font-bold text-white">
                Centre Cost
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#198754] mt-2">
              {formatINR(finalPrice)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#C3E6CB] flex items-center justify-between text-[11px] text-[#198754]">
            <span>1 + 2 + 3</span>
            <span className="font-semibold">Deducted per ticket</span>
          </div>
        </div>
      </div>

      {/* Visual Stacked Progress Bar */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#172033] flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-[#C98219]" />
            Ticket Price Composition & Distribution
          </span>
          <span className="text-[11px] text-[#667085]">
            Total: <strong className="text-[#172033]">{formatINR(finalPrice)}</strong>
          </span>
        </div>

        <div className="h-4 w-full rounded-full bg-[#F2F4F7] overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${basePct}%` }}
            className="bg-[#475467] h-full transition-all duration-300"
            title={`Base Price: ₹ ${basePrice}`}
          />
          <div
            style={{ width: `${partnerPct}%` }}
            className="bg-[#175CD3] h-full transition-all duration-300"
            title={`Partner Markup: ₹ ${partnerMarkup}`}
          />
          <div
            style={{ width: `${distributorPct}%` }}
            className="bg-[#C98219] h-full transition-all duration-300"
            title={`Distributor Markup: ₹ ${currentMarkup}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#667085]">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#475467]" />
            <span>Partner Base Price ({formatINR(basePrice)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#175CD3]" />
            <span>Partner Markup (+{formatINR(partnerMarkup)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C98219]" />
            <span className="font-bold text-[#8F5A0D]">Your Distributor Markup (+{formatINR(currentMarkup)})</span>
          </div>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F2F4F7] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#C98219]" />
              Adjust Markup Value
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Select or slide to configure your markup. You may set any value from ₹ 0.00 up to the maximum limit of {formatINR(maxCap)}.
            </p>
          </div>
          {isDirty && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF7E6] border border-[#F9DE9B] px-2.5 py-0.5 text-[11px] font-bold text-[#8F5A0D]">
                ● Unsaved Changes
              </span>
            </div>
          )}
        </div>

        {/* Quick Select Presets */}
        <div>
          <label className="block text-xs font-semibold text-[#344054] mb-2">
            Quick Preset Select:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {quickPresets.map((val) => {
              const active = markupInput === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMarkupInput(val)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#C98219] text-white shadow-xs'
                      : 'bg-[#F8FAFC] border border-[#E6EAF0] text-[#344054] hover:bg-[#F2F4F7]'
                  }`}
                >
                  +{formatINR(val)}
                  {val === 0 && ' (No Markup)'}
                  {val === maxCap && ' (Max Cap)'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider & Numeric Input Controls */}
        <div className="space-y-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-[10px] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#172033]">
              Configure Ticket Markup (Chips)
            </span>
            <span className="text-xs font-mono font-bold text-[#C98219]">
              Current: +{formatINR(currentMarkup)} / Max: +{formatINR(maxCap)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max={maxCap}
              step="0.25"
              value={markupInput}
              onChange={(e) => setMarkupInput(parseFloat(e.target.value) || 0)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#C98219] bg-[#E2E8F0]"
            />
            <div className="w-32 shrink-0 relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#667085] font-bold">₹</span>
              <input
                type="number"
                min="0"
                max={maxCap}
                step="0.25"
                value={markupInput}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMarkupInput(isNaN(val) ? 0 : Math.min(Math.max(0, val), maxCap));
                }}
                className="w-full rounded-[8px] border border-[#D0D5DD] bg-white pl-7 pr-3 py-2 text-sm font-bold text-[#172033] focus:border-[#C98219] focus:outline-none focus:ring-1 focus:ring-[#C98219]"
              />
            </div>
          </div>

          {/* Pricing Equation Display */}
          <div className="rounded-[8px] bg-white border border-[#E6EAF0] p-3 text-xs text-[#344054] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="font-mono text-[11.5px]">
              <span className="text-[#667085]">Base:</span> <strong>₹ {basePrice}</strong>
              <span className="text-[#667085] mx-1.5">+</span>
              <span className="text-[#175CD3]">Partner:</span> <strong>+₹ {partnerMarkup}</strong>
              <span className="text-[#667085] mx-1.5">+</span>
              <span className="text-[#C98219]">Distributor:</span> <strong>+₹ {currentMarkup.toFixed(2)}</strong>
              <span className="text-[#667085] mx-1.5">=</span>
              <span className="text-[#198754] font-bold">Total: ₹ {finalPrice.toFixed(2)}</span>
            </div>
            <span className="text-[10.5px] text-[#667085]">Per completed ticket</span>
          </div>
        </div>

        {/* Projected Revenue Simulator */}
        <div className="rounded-[10px] border border-[#B2DDFF]/50 bg-[#F5FAFF] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#175CD3]" />
              <span className="text-xs font-bold text-[#175CD3]">
                Distributor Earnings Simulator
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#344054]">
              <span>Sample Volume:</span>
              <select
                value={simulationVolume}
                onChange={(e) => setSimulationVolume(Number(e.target.value))}
                className="rounded-[6px] border border-[#B2DDFF] bg-white px-2 py-0.5 text-xs font-bold text-[#175CD3] focus:outline-none"
              >
                <option value={50}>50 tickets</option>
                <option value={100}>100 tickets</option>
                <option value={250}>250 tickets</option>
                <option value={500}>500 tickets</option>
                <option value={1000}>1,000 tickets</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-white rounded-[8px] border border-[#B2DDFF]/40 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-[#667085]">Network Volume</span>
              <div className="text-lg font-black text-[#172033] mt-0.5">{simulationVolume} Bookings</div>
            </div>
            <div className="bg-white rounded-[8px] border border-[#B2DDFF]/40 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-[#667085]">Your Margin / Ticket</span>
              <div className="text-lg font-black text-[#C98219] mt-0.5">+{formatINR(currentMarkup)}</div>
            </div>
            <div className="bg-white rounded-[8px] border border-[#198754]/30 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-[#198754]">Est. Markup Revenue</span>
              <div className="text-lg font-black text-[#198754] mt-0.5">{formatINR(projectedRevenue)}</div>
            </div>
          </div>
          <p className="text-[11px] text-[#667085]">
            * Revenue estimate reflects your independent distributor ticket markup across all processed bookings.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#F2F4F7]">
          <div className="flex items-center gap-2 text-xs text-[#667085]">
            <Info className="h-4 w-4 text-[#175CD3] shrink-0" />
            <span>Changes take effect immediately for newly created bookings.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-[8px] border border-[#D0D5DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#667085]" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving || !isDirty}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[8px] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all ${
                isDirty
                  ? 'bg-[#C98219] hover:bg-[#A86B14] cursor-pointer'
                  : 'bg-[#98A2B3] cursor-not-allowed opacity-60'
              }`}
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Markup Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Invariants & Guidelines Card */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-4">
        <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#198754]" />
          Platform Financial Invariants & RBAC Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#475467]">
          <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-4 space-y-1.5">
            <span className="font-bold text-[#172033] flex items-center gap-1">
              <span>● Non-Negative Minimum</span>
            </span>
            <p className="text-[#667085] text-[11.5px] leading-relaxed">
              Ticket markup cannot be negative. The minimum permitted value is ₹ 0.00 (zero distributor surcharge).
            </p>
          </div>

          <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-4 space-y-1.5">
            <span className="font-bold text-[#172033] flex items-center gap-1">
              <span>● Super Admin Ceiling</span>
            </span>
            <p className="text-[#667085] text-[11.5px] leading-relaxed">
              Super Admin enforces a maximum ceiling of {formatINR(maxCap)}. Distributor requests exceeding this cap are rejected by the backend.
            </p>
          </div>

          <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-4 space-y-1.5">
            <span className="font-bold text-[#172033] flex items-center gap-1">
              <span>● Immutable Booking Snapshots</span>
            </span>
            <p className="text-[#667085] text-[11.5px] leading-relaxed">
              Every booking captures an immutable price snapshot at time of booking. Past bookings and audit logs remain untouched.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
