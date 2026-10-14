'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Search,
  RefreshCw,
  Users,
  Plus,
  KeyRound,
  ShieldCheck,
  Edit2,
  Copy,
  Check,
  Phone,
  Mail,
  X,
  Clock,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { MetricBlock } from '@/components/MetricBlock';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';

import { useLiveEvent } from '@/lib/useSocket';

const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
  'Viluppuram', 'Virudhunagar'
];

export default function PartnerCentresPage() {
  const router = useRouter();
  const [centres, setCentres] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Selected Centre Detail Modal State
  const [selectedCentre, setSelectedCentre] = useState<any | null>(null);

  const loadData = () => {
    setLoading(true);
    api.getPartnerCentres(1, filterDistrict, filterStatus, searchQuery)
      .then((cData) => {
        if (cData?.centres) setCentres(cData.centres);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useLiveEvent('partner:centre_activated', () => {
    loadData();
  });

  useLiveEvent('centre:activated', () => {
    loadData();
  });

  useEffect(() => {
    loadData();
  }, [filterDistrict, filterStatus, searchQuery]);

  const totalCentres = centres.length;
  const activeCentres = centres.filter((c) => c.status === 'ACTIVE').length;
  const pendingCentres = centres.filter((c) => c.status === 'PENDING_VERIFICATION').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" />
            <span>Partner Franchise • Centres Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            My Network Centres
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Manage, audit, and monitor all authorized eSevai centres onboarded under your partner code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="rounded-[7px] border border-[#E6EAF0] bg-white p-2.5 text-[#667085] hover:text-[#172033] hover:bg-[#F8FAFC] shadow-subtle transition-colors"
            title="Refresh Centres"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/partner/invitations"
            className="rounded-[7px] bg-[#C98219] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Onboard New Centre</span>
          </Link>
        </div>
      </div>

      {/* Metric Blocks Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricBlock
          label="Total Network Centres"
          value={totalCentres}
          icon={Building2}
          subtext="Centres in your franchise territory"
        />
        <MetricBlock
          label="Active & Validated"
          value={activeCentres}
          icon={CheckCircle2}
          variant="success"
          subtext="5 KM Geofence GPS Validated"
        />
        <MetricBlock
          label="Pending Verification"
          value={pendingCentres}
          icon={AlertTriangle}
          variant="warning"
          subtext="Awaiting initial GPS validation"
        />
      </div>

      {/* Filter and Search Bar Card */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#98A2B3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by centre name, code, operator name, or phone..."
              className="w-full rounded-[7px] border border-[#D0D5DD] bg-white pl-10 pr-3.5 py-2 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
            />
          </div>

          {/* District Selector */}
          <div className="w-full md:w-56">
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
            >
              <option value="ALL">All Tamil Nadu Districts</option>
              {TN_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs sm:text-sm text-[#172033] focus:border-[#C98219] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Centres</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Centres Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : centres.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Building2}
              title="No Network Centres Found"
              description="No centres match your current search criteria. Onboard new centres into your partner network."
              action={{
                label: 'Onboard Centre (30m Link)',
                onClick: () => router.push('/partner/invitations'),
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#E6EAF0]">
                <tr>
                  <th className="py-3 px-4">Centre Name & Code</th>
                  <th className="py-3 px-4">Operator Contact</th>
                  <th className="py-3 px-4">District / Taluk</th>
                  <th className="py-3 px-4">5 KM Geofence</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0] bg-white">
                {centres.map((c) => {
                  const isActive = c.status === 'ACTIVE';
                  return (
                    <tr key={c.id} className="hover:bg-[#FAFBFD] transition-colors">
                      {/* Centre Name & Code */}
                      <td className="py-3 px-4 font-bold text-[#172033]">
                        {c.centreName}
                        <span className="block text-[11px] font-mono font-normal text-[#8F5A0D]">
                          {c.centreCode || 'TN-CTR-001'}
                        </span>
                      </td>

                      {/* Operator Contact */}
                      <td className="py-3 px-4 text-[#475467]">
                        <span className="font-semibold text-[#172033] block">
                          {c.user?.name || 'Operator'}
                        </span>
                        <span className="text-[11px] font-mono text-[#667085] block">
                          {c.user?.mobile || '—'}
                        </span>
                        {c.user?.email && (
                          <span className="text-[10.5px] text-[#98A2B3] block truncate max-w-[140px]">
                            {c.user.email}
                          </span>
                        )}
                      </td>

                      {/* District & Taluk */}
                      <td className="py-3 px-4 text-[#475467]">
                        <span className="font-semibold text-[#172033]">{c.district}</span>
                        <span className="block text-[11px] text-[#667085]">{c.taluk}</span>
                      </td>

                      {/* 5 KM Geofence Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#198754] bg-[#EAF7EE] px-2 py-0.5 rounded border border-[#C3E6CB]">
                          <MapPin className="h-3 w-3" />
                          5 KM Active
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="py-3 px-4 text-[#667085] font-mono text-[11px]">
                        {c.user?.registrationDate ? formatDate(c.user.registrationDate) : 'Active'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                            isActive
                              ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                              : c.status === 'PENDING_VERIFICATION'
                              ? 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]'
                              : 'bg-[#FDECEC] text-[#C2413B] border-[#F5C6CB]'
                          }`}
                        >
                          {isActive
                            ? 'ACTIVE'
                            : c.status === 'PENDING_VERIFICATION'
                            ? 'PENDING GPS'
                            : 'SUSPENDED'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedCentre(c)}
                          className="font-bold text-[#C98219] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Centre Details & 5 KM Location Modal */}
      {selectedCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101828]/50 backdrop-blur-[2px]">
          <div className="relative w-full max-w-lg rounded-[12px] bg-white p-6 shadow-elevated border border-[#E6EAF0] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#C98219]" />
                <h3 className="text-base font-bold text-[#172033]">
                  {selectedCentre.centreName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCentre(null)}
                className="text-[#98A2B3] hover:text-[#172033] p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E6EAF0]">
                  <span className="text-[#667085] block">Centre Code</span>
                  <span className="font-mono font-bold text-[#172033] mt-0.5 block">
                    {selectedCentre.centreCode}
                  </span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E6EAF0]">
                  <span className="text-[#667085] block">Operator Name</span>
                  <span className="font-bold text-[#172033] mt-0.5 block">
                    {selectedCentre.user?.name || 'Operator'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E6EAF0] space-y-1">
                <span className="text-[#667085] block">Contact Details</span>
                <p className="font-semibold text-[#172033]">
                  Phone: <span className="font-mono">{selectedCentre.user?.mobile || '—'}</span>
                </p>
                {selectedCentre.user?.email && (
                  <p className="text-[#667085]">Email: {selectedCentre.user.email}</p>
                )}
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E6EAF0] space-y-1">
                <span className="text-[#667085] block">Registered Address & Jurisdiction</span>
                <p className="font-semibold text-[#172033]">{selectedCentre.address || 'Registered Centre'}</p>
                <p className="text-[#667085]">
                  {selectedCentre.district}, {selectedCentre.taluk}
                </p>
              </div>

              <div className="p-3 bg-[#FEF7E6] rounded-[8px] border border-[#F9DE9B] text-[#8F5A0D]">
                <p className="font-bold flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#C98219]" />
                  5 KM Tamper-Resistant Geofence
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  GPS coordinates validated for registered eSevai operations and authorized regional service delivery.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCentre(null)}
                className="rounded-[7px] bg-[#C98219] px-5 py-2 text-xs font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
