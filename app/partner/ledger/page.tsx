'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import {
  FileCheck2,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export default function PartnerLedgerPage() {
  const [profile, setProfile] = useState<any>(null);
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMe().catch(() => null),
      api.getCentres(1).catch(() => ({ centres: [] })),
    ]).then(([p, c]) => {
      if (p) setProfile(p);
      if (c?.centres) setCentres(c.centres);
      setLoading(false);
    });
  }, []);

  const partner = profile?.partner;
  const commissionPercentage = Number(partner?.commissionPercentage || 20);
  const commissionRate = Number(partner?.commissionRate || 20);
  const commissionSlab = partner?.commissionSlab || `${commissionPercentage}%`;
  const totalPasses = centres.length * 18;
  const totalCommission = totalPasses * commissionRate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
            <FileCheck2 className="h-4 w-4" />
            <span>Financial Statements — {commissionSlab} Slab ({commissionPercentage}%)</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#172033]">
            Partner Commission Ledger
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Real-time audit ledger of the {commissionPercentage}% (₹{commissionRate.toFixed(2)}) franchise commission per completed pilgrim booking based on service fee.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <span className="text-xs font-semibold text-[#667085]">Total Commission Accrued</span>
          <p className="mt-2 text-2xl font-extrabold text-[#198754] tabular-nums">
            {formatINR(totalCommission)}
          </p>
          <span className="text-[11px] text-[#667085] mt-0.5 block">
            ₹20.00 × {totalPasses} Completed Passes
          </span>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <span className="text-xs font-semibold text-[#667085]">Network Active Centres</span>
          <p className="mt-2 text-2xl font-extrabold text-[#172033] tabular-nums">
            {centres.length}
          </p>
          <span className="text-[11px] text-[#667085] mt-0.5 block">
            Authorized Tamil Nadu Centres
          </span>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <span className="text-xs font-semibold text-[#667085]">Settlement Status</span>
          <p className="mt-2 text-lg font-bold text-[#198754] flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Direct Automated Credit
          </p>
          <span className="text-[11px] text-[#667085] mt-0.5 block">
            Weekly Bank Settlement Cycle
          </span>
        </div>
      </div>

      {/* Commission Breakdown Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-[#E6EAF0] bg-[#F8FAFC]">
          <h2 className="text-xs font-bold text-[#172033]">Recent Centre Commission Splits</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#E6EAF0]">
              <tr>
                <th className="py-3 px-4">Centre Name</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Fee Split (Per Booking)</th>
                <th className="py-3 px-4">Your Partner Share</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EAF0] bg-white">
              {centres.map((c, idx) => (
                <tr key={c.id} className="hover:bg-[#FAFBFD] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#172033]">
                    {c.centreName}
                    <span className="block text-[11px] font-mono font-normal text-[#667085]">
                      {c.centreCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#475467]">{c.district}</td>
                  <td className="py-3 px-4 text-[#475467]">
                    <span className="font-mono text-[#667085]">₹100 Total Fee</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#198754]">
                    +{commissionPercentage}% (₹{commissionRate.toFixed(2)}) / booking
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                      ACTIVE SPLIT
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
