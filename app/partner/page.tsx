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
  Plus,
  CheckCircle2,
  AlertCircle,
  Ticket,
  Percent,
  Layers,
  Activity,
  UserCheck,
  Wallet,
} from 'lucide-react';

export default function PartnerOverviewPage() {
  const [profile, setProfile] = useState<any>(null);
  const [centres, setCentres] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [markupData, setMarkupData] = useState<any>(null);
  const [payoutsData, setPayoutsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMe().catch(() => null),
      api.getPartnerCentres(1).catch(() => ({ centres: [] })),
      api.getPartnerDistributors().catch(() => []),
      api.getPartnerInvitations().catch(() => ({ invitations: [] })),
      api.getPartnerMarkup().catch(() => null),
      api.getPartnerPayouts().catch(() => null),
    ]).then(([profileData, centresData, distData, invData, markupRes, payoutRes]) => {
      if (profileData) setProfile(profileData);
      if (centresData?.centres) setCentres(centresData.centres);
      if (Array.isArray(distData)) setDistributors(distData);
      if (invData?.invitations) setInvitations(invData.invitations);
      if (markupRes) setMarkupData(markupRes);
      if (payoutRes) setPayoutsData(payoutRes);
      setLoading(false);
    });
  }, []);

  const partner = profile?.partner;

  const totalDistributors = distributors.length;
  const activeDistributors = distributors.filter((d) => d.status === 'ACTIVE').length;
  const totalCentresCount = centres.length;
  const activeCentresCount = centres.filter((c) => c.status === 'ACTIVE').length;
  const pendingInvitations = invitations.filter((i) => i.status === 'ACTIVE' && (!i.expiresAt || new Date(i.expiresAt) > new Date())).length;

  const actualBalance = Number(payoutsData?.availableBalance ?? 0);
  const actualTotalEarned = Number(payoutsData?.totalEarned ?? actualBalance);

  // Group centres by distributor
  const distributorGroups: { [key: string]: { name: string; code: string; count: number; active: number } } = {};
  let directCentresCount = 0;

  centres.forEach((c) => {
    if (c.distributor) {
      const key = c.distributor.id;
      if (!distributorGroups[key]) {
        distributorGroups[key] = {
          name: c.distributor.name,
          code: c.distributor.distributorCode,
          count: 0,
          active: 0,
        };
      }
      distributorGroups[key].count++;
      if (c.status === 'ACTIVE') distributorGroups[key].active++;
    } else {
      directCentresCount++;
    }
  });

  // Recent activity aggregated from distributors, centres and invitations
  const activityList = [
    ...distributors.map((d) => ({
      type: 'DISTRIBUTOR',
      title: `Distributor Created: ${d.name} (${d.distributorCode})`,
      subtitle: `Distributor Markup +🪙 ${d.markup || 0} / booking`,
      date: d.createdAt,
      status: d.status,
    })),
    ...centres.map((c) => ({
      type: 'CENTRE',
      title: `Centre Onboarded: ${c.centreName} (${c.centreCode})`,
      subtitle: `${c.district} • ${c.distributor ? `Managed by ${c.distributor.name}` : 'Direct Partner'}`,
      date: c.createdAt,
      status: c.status,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-[10px] border border-[#E6EAF0] bg-white animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-[10px] border border-[#E6EAF0] bg-white animate-pulse" />
          ))}
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
              {partner?.name || 'Regional Franchise Partner'}
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1 max-w-xl">
              Partner Code: <span className="font-mono font-bold text-[#172033]">{partner?.partnerCode || 'PT-001'}</span> • Regional Jurisdiction: <span className="font-semibold text-[#172033]">{partner?.district || 'Tamil Nadu'} {partner?.taluk ? `(${partner.taluk})` : ''}</span>
            </p>
          </div>

          <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-4 shrink-0 space-y-2 min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#667085]">Partner Status</span>
              <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                {partner?.status || 'ACTIVE'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-[#E6EAF0] pt-2">
              <span className="text-[#667085]">Base Ticket Price</span>
              <span className="font-bold text-[#175CD3]">
                {formatINR(markupData?.baseTicketPrice || 10)}
                {markupData?.isCustomRate && <span className="text-[10px] ml-1 text-[#175CD3] font-normal">(Custom)</span>}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-[#E6EAF0] pt-2">
              <span className="text-[#667085]">Configured Ticket Markup</span>
              <span className="font-bold text-[#C98219]">+{formatINR(markupData?.currentMarkup || 0)} / pass</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-[#E6EAF0] pt-2">
              <span className="text-[#667085]">Total Markup Earned</span>
              <span className="font-bold text-[#198754]">{formatINR(actualTotalEarned)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Markup Financial Earnings & Pricing Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-[10px] border border-[#198754]/30 bg-[#EAF7EE]/60 p-4 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#198754] uppercase tracking-wider">Total Markup Earned</span>
            <DollarSign className="h-4 w-4 text-[#198754]" />
          </div>
          <p className="text-2xl font-black text-[#198754] mt-1">{formatINR(actualTotalEarned)}</p>
          <span className="text-[11px] text-[#198754] mt-1">From network ticket markups</span>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Available Balance</span>
            <TrendingUp className="h-4 w-4 text-[#175CD3]" />
          </div>
          <p className="text-2xl font-black text-[#172033] mt-1">{formatINR(actualBalance)}</p>
          <Link href="/partner/payouts" className="text-[11px] text-[#175CD3] font-bold hover:underline mt-1 flex items-center gap-1">
            <span>Withdraw Earnings</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6]/70 p-4 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8F5A0D] uppercase tracking-wider">Your Ticket Markup</span>
            <Ticket className="h-4 w-4 text-[#C98219]" />
          </div>
          <p className="text-2xl font-black text-[#C98219] mt-1">+{formatINR(markupData?.currentMarkup || 0)}</p>
          <Link href="/partner/markup" className="text-[11px] text-[#C98219] font-bold hover:underline mt-1 flex items-center gap-1">
            <span>Per booking pass • Adjust</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-[10px] border border-[#B2DDFF] bg-[#EFF8FF]/70 p-4 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#175CD3] uppercase tracking-wider">Base Ticket Price</span>
            <ShieldCheck className="h-4 w-4 text-[#175CD3]" />
          </div>
          <p className="text-2xl font-black text-[#175CD3] mt-1">{formatINR(markupData?.baseTicketPrice || 10)}</p>
          <span className="text-[11px] text-[#175CD3] mt-1 font-medium">
            {markupData?.isCustomRate ? 'Custom Partner Rate (Admin)' : 'System Default Rate'}
          </span>
        </div>
      </div>

      {/* 5 Hierarchy Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Total Distributors</span>
          <p className="text-2xl font-black text-[#172033] mt-1">{totalDistributors}</p>
          <span className="text-[11px] text-[#667085] mt-1">{activeDistributors} active</span>
        </div>

        <div className="rounded-[10px] border border-[#C3E6CB] bg-[#EAF7EE]/50 p-4 shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#198754] uppercase tracking-wider">Active Distributors</span>
          <p className="text-2xl font-black text-[#198754] mt-1">{activeDistributors}</p>
          <span className="text-[11px] text-[#198754] mt-1">Operational</span>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Total Centres</span>
          <p className="text-2xl font-black text-[#172033] mt-1">{totalCentresCount}</p>
          <span className="text-[11px] text-[#667085] mt-1">{activeCentresCount} active</span>
        </div>

        <div className="rounded-[10px] border border-[#C3E6CB] bg-[#EAF7EE]/50 p-4 shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#198754] uppercase tracking-wider">Active Centres</span>
          <p className="text-2xl font-black text-[#198754] mt-1">{activeCentresCount}</p>
          <span className="text-[11px] text-[#198754] mt-1">Geofence Validated</span>
        </div>

        <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6]/60 p-4 shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#8F5A0D] uppercase tracking-wider">Pending Invites</span>
          <p className="text-2xl font-black text-[#C98219] mt-1">{pendingInvitations}</p>
          <span className="text-[11px] text-[#8F5A0D] mt-1">Awaiting registration</span>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/partner/wallet"
          className="flex items-center gap-2.5 rounded-[8px] border border-[#B2DDFF] bg-[#EFF8FF] p-3.5 text-xs font-bold text-[#175CD3] hover:border-[#175CD3] hover:bg-[#E0F2FE] transition-all shadow-subtle"
        >
          <Wallet className="h-4 w-4 text-[#175CD3]" />
          <span>Wallet &amp; Share Funds</span>
        </Link>
        <Link
          href="/partner/distributors"
          className="flex items-center gap-2.5 rounded-[8px] border border-[#E6EAF0] bg-white p-3.5 text-xs font-bold text-[#172033] hover:border-[#C98219] hover:bg-[#FDF7ED] transition-all shadow-subtle"
        >
          <Plus className="h-4 w-4 text-[#C98219]" />
          <span>Create Distributor</span>
        </Link>
        <Link
          href="/partner/markup"
          className="flex items-center gap-2.5 rounded-[8px] border border-[#E6EAF0] bg-white p-3.5 text-xs font-bold text-[#172033] hover:border-[#C98219] hover:bg-[#FDF7ED] transition-all shadow-subtle"
        >
          <DollarSign className="h-4 w-4 text-[#C98219]" />
          <span>Manage Ticket Markup</span>
        </Link>
        <Link
          href="/partner/centres"
          className="flex items-center gap-2.5 rounded-[8px] border border-[#E6EAF0] bg-white p-3.5 text-xs font-bold text-[#172033] hover:border-[#C98219] hover:bg-[#FDF7ED] transition-all shadow-subtle"
        >
          <Building2 className="h-4 w-4 text-[#C98219]" />
          <span>View Centres</span>
        </Link>
      </div>

      {/* Distributor Overview & Centre Network Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distributor Overview */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Users className="h-4 w-4 text-[#C98219]" />
              <span>Distributor Network ({distributors.length})</span>
            </h3>
            <Link
              href="/partner/distributors"
              className="text-xs font-bold text-[#C98219] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {distributors.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#667085]">
              <Building2 className="h-8 w-8 text-[#CBD5E1] mx-auto mb-2" />
              <p className="font-semibold text-[#172033]">No Distributors Onboarded</p>
              <p className="mt-1">Add your first regional Distributor to begin expanding your network.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {distributors.slice(0, 4).map((d) => (
                <div
                  key={d.id}
                  className="rounded-[8px] border border-[#E6EAF0] p-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#C98219] bg-[#FEF7E6] px-1.5 py-0.5 rounded border border-[#F9DE9B]">
                        {d.distributorCode}
                      </span>
                      <p className="text-xs font-bold text-[#172033] truncate">{d.name}</p>
                    </div>
                    <p className="text-[11px] text-[#667085] mt-0.5">
                      {d.centresCount || 0} Centres • Distributor Markup +🪙 {d.markup || 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold border ${
                        d.status === 'ACTIVE'
                          ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                          : 'bg-[#FDECEC] text-[#C2413B] border-[#F5C6CB]'
                      }`}
                    >
                      {d.status}
                    </span>
                    <Link
                      href={`/partner/distributors/${d.id}`}
                      className="text-xs font-bold text-[#175CD3] hover:underline"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Centre Network Distribution Grouped by Distributor */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#C98219]" />
              <span>Centres Network Distribution</span>
            </h3>
            <Link
              href="/partner/centres"
              className="text-xs font-bold text-[#C98219] hover:underline flex items-center gap-1"
            >
              <span>View All ({centres.length})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {/* Direct / Legacy Centres */}
            <div className="rounded-[8px] border border-[#E6EAF0] p-3 flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <p className="text-xs font-bold text-[#172033]">Direct Franchise Centres (Legacy)</p>
                <p className="text-[11px] text-[#667085]">Directly assigned without distributor</p>
              </div>
              <span className="font-mono font-bold text-sm text-[#172033]">
                {directCentresCount} centres
              </span>
            </div>

            {/* Subordinate Distributors Grouping */}
            {Object.keys(distributorGroups).length === 0 && directCentresCount === 0 ? (
              <div className="p-6 text-center text-xs text-[#667085]">
                <p className="font-semibold text-[#172033]">No Network Centres Found</p>
                <p className="mt-1">Onboard centres via direct invitation or your distributors.</p>
              </div>
            ) : (
              Object.entries(distributorGroups).slice(0, 4).map(([distId, group]) => (
                <div
                  key={distId}
                  className="rounded-[8px] border border-[#E6EAF0] p-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#172033] truncate">
                      {group.name} ({group.code})
                    </p>
                    <p className="text-[11px] text-[#198754]">
                      {group.active} active centres
                    </p>
                  </div>
                  <Link
                    href={`/partner/centres?distributorId=${distId}`}
                    className="font-mono font-bold text-xs text-[#175CD3] hover:underline"
                  >
                    {group.count} centres →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#C98219]" />
            <span>Recent Network Activity</span>
          </h3>
          <span className="text-xs text-[#667085]">Auto-refreshed with real system timestamps</span>
        </div>

        {activityList.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">
            <Clock className="h-8 w-8 text-[#CBD5E1] mx-auto mb-2" />
            <p className="font-semibold text-[#172033]">No Activity Recorded Yet</p>
            <p className="mt-1">Onboard distributors or centres to see activity updates here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F3F7]">
            {activityList.map((item, index) => (
              <div key={index} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      item.type === 'DISTRIBUTOR'
                        ? 'bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]'
                        : 'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]'
                    }`}
                  >
                    {item.type === 'DISTRIBUTOR' ? <Users className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#172033] truncate">{item.title}</p>
                    <p className="text-[11px] text-[#667085] truncate">{item.subtitle}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold border ${
                      item.status === 'ACTIVE'
                        ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                        : 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="block text-[10.5px] text-[#667085] mt-0.5">
                    {formatDate(item.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
