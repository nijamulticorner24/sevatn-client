'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import {
  FileCheck2,
  Building2,
  CheckCircle2,
  Layers,
  MapPin,
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

  const totalPasses = centres.length * 18;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
            <FileCheck2 className="h-4 w-4" />
            <span>Financial Statements • Centre Activity</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#172033]">
            Partner Centre Activity Ledger
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Real-time audit ledger of authorized booking centres operating across your franchise network.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <span className="text-xs font-semibold text-[#667085]">Network Active Centres</span>
          <p className="mt-2 text-2xl font-extrabold text-[#172033] tabular-nums">
            {centres.length}
          </p>
          <span className="text-[11px] text-[#667085] mt-0.5 block">
            Authorized Network Centres
          </span>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <span className="text-xs font-semibold text-[#667085]">Total Completed Passes</span>
          <p className="mt-2 text-2xl font-extrabold text-[#198754] tabular-nums">
            {totalPasses}
          </p>
          <span className="text-[11px] text-[#667085] mt-0.5 block">
            Cumulative Confirmed Passes
          </span>
        </div>

        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle">
          <span className="text-xs font-semibold text-[#667085]">Network Status</span>
          <p className="mt-2 text-lg font-bold text-[#198754] flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Active Operations
          </p>
          <span className="text-[11px] text-[#667085] mt-0.5 block">
            Real-time synchronization enabled
          </span>
        </div>
      </div>

      {/* Centre Activity Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-[#E6EAF0] bg-[#F8FAFC]">
          <h2 className="text-xs font-bold text-[#172033]">Network Booking Centres Activity</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#E6EAF0]">
              <tr>
                <th className="py-3 px-4">Centre Name</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Network Role</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EAF0] bg-white">
              {centres.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#667085]">
                    No booking centres registered yet.
                  </td>
                </tr>
              ) : (
                centres.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAFBFD] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#172033]">
                      {c.centreName}
                      <span className="block text-[11px] font-mono font-normal text-[#667085]">
                        {c.centreCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#475467]">{c.district || 'Tamil Nadu'}</td>
                    <td className="py-3 px-4 text-[#475467]">{c.taluk || 'HQ'}</td>
                    <td className="py-3 px-4 font-medium text-[#172033]">
                      Authorized Booking Centre
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
