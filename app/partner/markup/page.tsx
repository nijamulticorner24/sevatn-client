'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  DollarSign,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Info,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export default function PartnerMarkupPage() {
  const [data, setData] = useState<any>(null);
  const [markupInput, setMarkupInput] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMarkup();
  }, []);

  const loadMarkup = async () => {
    try {
      const res = await api.getPartnerMarkup();
      setData(res);
      setMarkupInput(Number(res?.currentMarkup || 0));
      setLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load partner markup settings');
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const val = Number(markupInput);
    if (val < 0) {
      setErrorMsg('Markup cannot be negative.');
      setSaving(false);
      return;
    }
    if (val > (data?.maxAllowedMarkup || 2)) {
      setErrorMsg(`Markup cannot exceed the Super Admin limit of ₹ ${data?.maxAllowedMarkup || 2}`);
      setSaving(false);
      return;
    }

    try {
      const res = await api.updatePartnerMarkup(val);
      setData((prev: any) => ({
        ...prev,
        currentMarkup: val,
        effectivePrice: Number(prev.baseTicketPrice) + val,
      }));
      setSuccessMsg('Your Partner markup has been successfully saved!');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update markup');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={3} />;
  }

  const baseTicket = Number(data?.baseTicketPrice || 10);
  const maxCap = Number(data?.maxAllowedMarkup || 2);
  const currentMarkup = Number(markupInput || 0);
  const effectivePrice = baseTicket + currentMarkup;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-xs text-[#8F5A0D] font-bold mb-3">
          <DollarSign className="h-3.5 w-3.5 text-[#C98219]" />
          <span>Regional Franchise • Pricing Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
          Partner Ticket Markup Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-1">
          Configure your independent franchise markup per ticket. This value applies to all bookings processed across your regional network.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-[8px] border border-[#C3E6CB] bg-[#EAF7EE] p-3 text-xs font-semibold text-[#198754] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#198754]" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-[8px] border border-[#F5C6CB] bg-[#FDECEC] p-3 text-xs font-semibold text-[#C2413B] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Pricing Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#667085]">Base Ticket Price</span>
            {data?.isCustomRate && (
              <span className="rounded bg-[#EFF8FF] px-1.5 py-0.5 text-[10px] font-bold text-[#175CD3] border border-[#B2DDFF]">
                Custom Partner Rate
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-[#172033] mt-1">{formatINR(baseTicket)}</div>
          <span className="text-[10.5px] text-[#667085]">
            {data?.isCustomRate ? 'Configured by Admin in /admin/partners' : 'Standard Base Rate'}
          </span>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <span className="text-[11px] font-semibold text-[#667085]">Your Configured Markup</span>
          <div className="text-2xl font-black text-[#C98219] mt-1">+{formatINR(currentMarkup)}</div>
          <span className="text-[10.5px] text-[#667085]">Max allowed: +{formatINR(maxCap)}</span>
        </div>

        <div className="rounded-[10px] border border-[#175CD3]/20 bg-[#EFF8FF] p-5 shadow-subtle">
          <span className="text-[11px] font-semibold text-[#175CD3]">Effective Price (Base + Partner)</span>
          <div className="text-2xl font-black text-[#175CD3] mt-1">{formatINR(effectivePrice)}</div>
          <span className="text-[10.5px] text-[#175CD3]">Before Distributor markup</span>
        </div>
      </div>

      {/* Three-Level Formula Breakdown Card */}
      <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6]/40 p-5 shadow-subtle space-y-3">
        <h3 className="text-sm font-bold text-[#8F5A0D] flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#C98219]" />
          <span>Three-Level Independent Markup Formula</span>
        </h3>
        <p className="text-xs text-[#475467]">
          The customer-facing final ticket price is calculated independently at booking time:
        </p>
        <div className="rounded-[8px] bg-white border border-[#E6EAF0] p-4 font-mono text-xs text-[#172033] space-y-1">
          <p className="font-bold text-[#C98219]">
            Final Ticket Price = Base Ticket Price + Partner Markup + Distributor Markup
          </p>
          <div className="text-[#667085] pt-2 border-t border-[#F0F3F7] grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              Base Price: <strong className="text-[#172033]">₹ {baseTicket}</strong>
              {data?.isCustomRate && (
                <span className="block text-[10px] text-[#175CD3] font-sans font-bold">Custom Partner Rate</span>
              )}
            </div>
            <div>Partner Markup: <strong className="text-[#C98219]">+₹ {currentMarkup}</strong></div>
            <div>Distributor Markup: <strong className="text-[#175CD3]">+₹ 0 to ₹ 2</strong> (Independent)</div>
            <div>Final Ticket: <strong className="text-[#198754]">₹ {baseTicket + currentMarkup} – ₹ {baseTicket + currentMarkup + 2}</strong></div>
          </div>
        </div>
        <p className="text-[11px] text-[#8F5A0D]">
          * Distributor markups are set independently by each Distributor within their own Super Admin cap and cannot be modified by the Partner.
        </p>
      </div>

      {/* Markup Configuration Form */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#172033]">
                Your Independent Partner Markup (Chips)
              </label>
              <span className="text-xs font-mono font-bold text-[#C98219]">
                {formatINR(currentMarkup)} / {formatINR(maxCap)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max={maxCap}
                step="0.5"
                value={markupInput}
                onChange={(e) => setMarkupInput(parseFloat(e.target.value) || 0)}
                className="w-full accent-[#C98219] cursor-pointer"
              />
              <div className="w-28 shrink-0 relative">
                <span className="absolute left-3 top-2.5 text-xs text-[#667085] font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  max={maxCap}
                  step="0.5"
                  value={markupInput}
                  onChange={(e) => setMarkupInput(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-[8px] border border-[#E6EAF0] pl-7 pr-3 py-2 text-sm font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[11.5px] text-[#667085] mt-2">
              Permitted range: ₹ 0.00 to ₹ {maxCap.toFixed(2)}. This amount is added to every ticket booked by centres in your network.
            </p>
          </div>

          <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-4 text-xs text-[#475467] flex items-start gap-2.5">
            <Info className="h-4 w-4 text-[#175CD3] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#172033]">Pricing Invariant:</span> Changing your markup will only affect future bookings. Existing bookings already created will retain their immutable pricing snapshot.
            </div>
          </div>

          <div className="border-t border-[#E6EAF0] pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-[8px] bg-[#C98219] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#A86B14] transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Markup'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

