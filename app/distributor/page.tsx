'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  Building2,
  Users,
  DollarSign,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export default function DistributorOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDistributorOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load distributor overview:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingSkeleton rows={3} />;
  }

  const distributor = data?.distributor;
  const metrics = data?.metrics;
  const pricing = data?.pricing;

  const basePrice = Number(pricing?.baseTicketPrice || 10);
  const partnerMarkup = Number(pricing?.partnerMarkup || 0);
  const distributorMarkup = Number(pricing?.distributorMarkup || 0);
  const finalPrice = Number(pricing?.finalTicketPrice || basePrice + partnerMarkup + distributorMarkup);

  return (
    <div className="space-y-6">
      {/* Identity Banner */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-xs text-[#8F5A0D] font-bold mb-3">
              <Building2 className="h-3.5 w-3.5 text-[#C98219]" />
              <span>Regional Sub-tier Distributor • Jurisdiction: {distributor?.district || 'Tamil Nadu'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
              {distributor?.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Distributor Code: <span className="font-mono font-bold text-[#172033]">{distributor?.distributorCode}</span> • Assigned Partner:{' '}
              <span className="font-semibold text-[#175CD3]">{distributor?.partner?.name} ({distributor?.partner?.partnerCode})</span>
            </p>
          </div>

          <div className="rounded-[8px] bg-[#F8FAFC] p-3.5 border border-[#E6EAF0] text-xs space-y-1.5 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#667085]">Status:</span>
              <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                {distributor?.status || 'ACTIVE'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#667085]">Commission Slab:</span>
              <span className="font-bold text-[#172033]">{distributor?.commissionSlab || 'STANDARD'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#667085]">
              <span>Managed Centres</span>
              <Building2 className="h-4 w-4 text-[#C98219]" />
            </div>
            <div className="text-2xl font-black text-[#172033] mt-2">{metrics?.totalCentres || 0}</div>
            <span className="text-[11px] text-[#198754] font-semibold mt-1">
              {metrics?.activeCentres || 0} Active &amp; Validated
            </span>
          </div>
          <Link
            href="/distributor/centres"
            className="mt-3 text-xs font-bold text-[#C98219] hover:underline flex items-center gap-1"
          >
            <span>View All Centres</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#667085]">
              <span>Active Onboard Links</span>
              <Sparkles className="h-4 w-4 text-[#175CD3]" />
            </div>
            <div className="text-2xl font-black text-[#172033] mt-2">{metrics?.pendingInvites || 0}</div>
            <span className="text-[11px] text-[#667085] mt-1">30-Minute Single Use</span>
          </div>
          <Link
            href="/distributor/invitations"
            className="mt-3 text-xs font-bold text-[#175CD3] hover:underline flex items-center gap-1"
          >
            <span>Generate New Link</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#667085]">
              <span>Your Ticket Markup</span>
              <DollarSign className="h-4 w-4 text-[#C98219]" />
            </div>
            <div className="text-2xl font-black text-[#C98219] mt-2">+{formatINR(distributorMarkup)}</div>
            <span className="text-[11px] text-[#667085] mt-1">Cap: +{formatINR(pricing?.maxAllowedMarkup || 2)}</span>
          </div>
          <Link
            href="/distributor/markup"
            className="mt-3 text-xs font-bold text-[#C98219] hover:underline flex items-center gap-1"
          >
            <span>Configure Markup</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-[10px] border border-[#198754]/30 bg-[#EAF7EE] p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#198754] font-semibold">
              <span>Customer Ticket Price</span>
              <ShieldCheck className="h-4 w-4 text-[#198754]" />
            </div>
            <div className="text-2xl font-black text-[#198754] mt-2">{formatINR(finalPrice)}</div>
            <span className="text-[11px] text-[#198754] mt-1">Final rate across your centres</span>
          </div>
          <div className="mt-3 text-[11px] text-[#198754] font-medium">
            3-Level Guaranteed Rate
          </div>
        </div>
      </div>

      {/* THREE-LEVEL PRICING FORMULA BREAKDOWN */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle">
        <h2 className="text-base font-bold text-[#172033] mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#C98219]" />
          <span>Active Three-Level Ticket Pricing Breakdown</span>
        </h2>

        <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center text-center">
            <div className="p-3 bg-white rounded-[8px] border border-[#E6EAF0]">
              <span className="text-[11px] text-[#667085] font-semibold">1. Base Ticket Price</span>
              <p className="text-xl font-black text-[#172033] mt-1">{formatINR(basePrice)}</p>
              <span className="text-[10px] text-[#667085]">Super Admin</span>
            </div>

            <div className="p-3 bg-white rounded-[8px] border border-[#E6EAF0]">
              <span className="text-[11px] text-[#667085] font-semibold">2. Partner Markup</span>
              <p className="text-xl font-black text-[#175CD3] mt-1">+{formatINR(partnerMarkup)}</p>
              <span className="text-[10px] text-[#175CD3] font-mono">{distributor?.partner?.partnerCode}</span>
            </div>

            <div className="p-3 bg-white rounded-[8px] border border-[#E6EAF0]">
              <span className="text-[11px] text-[#667085] font-semibold">3. Your Markup</span>
              <p className="text-xl font-black text-[#C98219] mt-1">+{formatINR(distributorMarkup)}</p>
              <span className="text-[10px] text-[#C98219] font-mono">{distributor?.distributorCode}</span>
            </div>

            <div className="p-3 bg-[#EAF7EE] rounded-[8px] border border-[#C3E6CB]">
              <span className="text-[11px] text-[#198754] font-bold">Final Customer Rate</span>
              <p className="text-xl font-black text-[#198754] mt-1">{formatINR(finalPrice)}</p>
              <span className="text-[10px] text-[#198754] font-semibold">Formula: 1 + 2 + 3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
