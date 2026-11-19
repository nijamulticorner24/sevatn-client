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
} from 'lucide-react';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';

export default function AdminDistributorsPage() {
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
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
        /* TABLE VIEW WITH CONTACT DETAILS */
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] uppercase tracking-wider font-semibold border-b border-[#E6EAF0]">
                <tr>
                  <th className="py-3 px-4">Distributor</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Partner Franchise</th>
                  <th className="py-3 px-4">Jurisdiction</th>
                  <th className="py-3 px-4">Commission Slab</th>
                  <th className="py-3 px-4">Current Markup</th>
                  <th className="py-3 px-4">Centres</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0]">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Distributor Name & Code */}
                    <td className="py-3.5 px-4 font-semibold text-[#172033]">
                      <div>{d.name}</div>
                      {d.businessName && (
                        <div className="text-[11px] font-normal text-[#667085]">{d.businessName}</div>
                      )}
                      <div className="text-[10.5px] font-mono text-[#C98219] font-bold">{d.distributorCode}</div>
                    </td>

                    {/* Contact Details (Phone & Email) */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {d.mobile && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-[#175CD3] shrink-0" />
                            <a
                              href={`tel:${d.mobile}`}
                              className="font-mono text-xs font-semibold text-[#172033] hover:text-[#175CD3] hover:underline"
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
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-[#C98219] shrink-0" />
                            <a
                              href={`mailto:${d.email}`}
                              className="font-mono text-[11px] text-[#667085] hover:text-[#C98219] hover:underline truncate max-w-[190px]"
                              title={d.email}
                            >
                              {d.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(d.email, `mail-${d.id}`)}
                              className="text-[#98A2B3] hover:text-[#172033] p-0.5"
                              title="Copy Email"
                            >
                              {copiedId === `mail-${d.id}` ? (
                                <Check className="h-2.5 w-2.5 text-[#198754]" />
                              ) : (
                                <Copy className="h-2.5 w-2.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10.5px] text-[#98A2B3] italic">No email registered</div>
                        )}
                      </div>
                    </td>

                    {/* Partner Franchise */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#172033]">{d.partner?.name || 'N/A'}</div>
                      <div className="text-[10px] font-mono text-[#175CD3]">{d.partner?.partnerCode}</div>
                    </td>

                    {/* Jurisdiction */}
                    <td className="py-3.5 px-4 text-[#667085]">
                      {d.district || 'All TN'} {d.taluk ? `(${d.taluk})` : ''}
                    </td>

                    {/* Commission Slab */}
                    <td className="py-3.5 px-4">
                      <span className="rounded bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-semibold text-[#475467] border border-[#E6EAF0]">
                        {d.commissionSlab || 'STANDARD'} ({d.commissionPercentage}%)
                      </span>
                    </td>

                    {/* Current Markup */}
                    <td className="py-3.5 px-4 font-bold text-[#172033]">
                      +{formatINR(d.markup || 0)}
                    </td>

                    {/* Centres Count */}
                    <td className="py-3.5 px-4 font-semibold text-[#172033]">
                      {d.centresCount || 0}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {!d.feePaid && d.paymentReference ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-[10px] font-bold text-[#8F5A0D] border border-[#F9DE9B] flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-[#C98219]" />
                            FEE PENDING APPROVAL
                          </span>
                          <a
                            href="/admin/ledger?tab=REGISTRATIONS"
                            className="text-[10px] text-[#175CD3] hover:underline font-semibold"
                          >
                            Verify in Ledger →
                          </a>
                        </div>
                      ) : d.status === 'ACTIVE' ? (
                        <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="rounded bg-[#FDECEC] px-2 py-0.5 text-[10px] font-bold text-[#C2413B] border border-[#F5C6CB]">
                          {d.status}
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-[#667085] whitespace-nowrap">
                      {formatDate(d.createdAt)}
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
    </div>
  );
}
