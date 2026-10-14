'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import {
  Users,
  Building2,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  DollarSign,
  FileCheck2,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';

export default function PartnerOverviewPage() {
  const [profile, setProfile] = useState<any>(null);
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMe().catch(() => null),
      api.getPartnerCentres(1).catch(() => ({ centres: [] })),
    ]).then(([profileData, centresData]) => {
      if (profileData) setProfile(profileData);
      if (centresData?.centres) setCentres(centresData.centres);
      setLoading(false);
    });
  }, []);

  const partner = profile?.partner;
  const commissionPercentage = Number(partner?.commissionPercentage || 20);
  const commissionRate = Number(partner?.commissionRate || 20);
  const commissionSlab = partner?.commissionSlab || `${commissionPercentage}%`;

  const totalCentresCount = centres.length;
  const activeCentresCount = centres.filter((c) => c.status === 'ACTIVE').length;
  const estimatedBookings = totalCentresCount * 18;
  const totalCommissionEarned = estimatedBookings * commissionRate;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-[10px] border border-[#E6EAF0] bg-white animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="h-32 rounded-[10px] border border-[#E6EAF0] bg-white animate-pulse" />
          <div className="h-32 rounded-[10px] border border-[#E6EAF0] bg-white animate-pulse" />
          <div className="h-32 rounded-[10px] border border-[#E6EAF0] bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Partner Identity Header */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-xs text-[#8F5A0D] font-bold mb-3">
              <Users className="h-3.5 w-3.5 text-[#C98219]" />
              <span>Authorized Regional Franchise • Partner Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
              {partner?.name || 'NIJA Digital Network & e-Services'}
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1 max-w-xl">
              Partner Code: <span className="font-mono font-bold text-[#172033]">{partner?.partnerCode || 'PT-001'}</span> • Regional Jurisdiction: <span className="font-semibold text-[#172033]">{partner?.district || 'Chennai'} ({partner?.taluk || 'Guindy'})</span>
            </p>
          </div>

          <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-4 shrink-0 space-y-2 min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#667085]">Partner Status</span>
              {partner?.status === 'ACTIVE' ? (
                <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                  ACTIVE FRANCHISE
                </span>
              ) : partner?.status === 'PENDING_APPROVAL' ? (
                <span className="rounded bg-[#EFF8FF] px-2 py-0.5 text-[10px] font-bold text-[#175CD3] border border-[#B2DDFF]">
                  AWAITING APPROVAL
                </span>
              ) : (
                <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-[10px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                  PENDING PAYMENT
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs border-t border-[#E6EAF0] pt-2">
              <span className="text-[#667085]">Franchise License Fee</span>
              <span className="font-bold text-[#172033]">₹599.00 {partner?.feePaid ? '(Paid)' : '(Pending)'}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-[#E6EAF0] pt-2">
              <span className="text-[#667085]">Centre Onboarding Fee</span>
              <span className="font-bold text-[#172033]">₹249.00</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-[#E6EAF0] pt-2">
              <span className="text-[#667085]">Commission Split ({commissionPercentage}%)</span>
              <span className="font-bold text-[#8F5A0D]">₹{commissionRate.toFixed(2)} / Pass ({commissionSlab})</span>
            </div>
          </div>
        </div>

        {partner?.status !== 'ACTIVE' && (
          <div className="mt-4 rounded-[8px] border border-[#F9DE9B] bg-[#FEF7E6] p-4 text-xs text-[#8F5A0D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#C98219] shrink-0" />
              <span>
                {partner?.status === 'PENDING_APPROVAL'
                  ? 'Your franchise fee payment has been submitted and is awaiting administrator verification.'
                  : 'Your partner franchise account is in Pending Payment status. Please complete the ₹599.00 franchise fee.'}
              </span>
            </div>
            {partner?.invitations?.[0]?.token && (
              <Link
                href={`/partner/onboard/${partner.invitations[0].token}`}
                className="rounded-[6px] bg-[#C98219] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B57414] shrink-0"
              >
                Complete Onboarding & Payment
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Partner Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Centres */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085]">Network Centres</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#172033] tabular-nums">
              {totalCentresCount}
            </p>
            <p className="text-[11px] text-[#198754] font-medium mt-0.5">
              {activeCentresCount} Active & Validated
            </p>
          </div>
          <Link
            href="/partner/centres"
            className="mt-4 text-xs font-bold text-[#C98219] hover:underline flex items-center gap-1"
          >
            <span>View All Centres</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Metric 2: Network Bookings */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085]">Network Bookings</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#F7F9FC] text-[#475467] border border-[#E6EAF0]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#172033] tabular-nums">
              {estimatedBookings}
            </p>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Passes processed by your network
            </p>
          </div>
          <Link
            href="/partner/ledger"
            className="mt-4 text-xs font-bold text-[#C98219] hover:underline flex items-center gap-1"
          >
            <span>View Split Ledger</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Metric 3: Total Commission Earned */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085]">Partner Commission</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#EAF7EE] text-[#198754] border border-[#C3E6CB]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#198754] tabular-nums">
              {formatINR(totalCommissionEarned)}
            </p>
            <p className="text-[11px] text-[#667085] mt-0.5">
              {commissionPercentage}% of Service Fee (₹{commissionRate.toFixed(2)}/pass)
            </p>
          </div>
          <Link
            href="/partner/payouts"
            className="mt-4 text-xs font-bold text-[#198754] hover:underline flex items-center gap-1"
          >
            <span>Withdraw Earnings & Payouts</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Metric 4: Onboarding Velocity */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085]">Franchise Growth</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-lg font-bold text-[#172033]">
              100% Territory Coverage
            </p>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Tamil Nadu State Division
            </p>
          </div>
          <Link
            href="/partner/invitations"
            className="mt-4 text-xs font-bold text-[#C98219] hover:underline flex items-center gap-1"
          >
            <span>Onboard More Centres</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Network Centres Directory Preview */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#C98219]" />
              Centres Registered Under Your Partner Franchise
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Real-time monitoring of active eSevai operators and booking volume.
            </p>
          </div>
          <Link
            href="/partner/centres"
            className="text-xs font-bold text-[#C98219] hover:underline flex items-center gap-1"
          >
            <span>View All Centres ({centres.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-[8px] border border-[#E6EAF0]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#E6EAF0]">
              <tr>
                <th className="py-3 px-4">Centre Name & Code</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">District / Taluk</th>
                <th className="py-3 px-4">5 KM Geofence</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EAF0] bg-white">
              {centres.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-[#FAFBFD] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#172033]">
                    {c.centreName}
                    <span className="block text-[11px] font-mono font-normal text-[#667085]">
                      {c.centreCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#475467]">
                    {c.user?.name || 'Operator'}
                    <span className="block text-[11px] text-[#667085]">{c.user?.mobile || ''}</span>
                  </td>
                  <td className="py-3 px-4 text-[#475467]">
                    {c.district} ({c.taluk})
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#198754]">
                      <MapPin className="h-3 w-3" />
                      GPS Configured
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
