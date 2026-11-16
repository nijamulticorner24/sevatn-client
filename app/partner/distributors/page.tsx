'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import {
  Building2,
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
  Phone,
  Mail,
  MapPin,
  SlidersHorizontal,
  X,
  Save,
  Check,
  ShieldCheck,
  Percent,
  Power,
  ChevronRight,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function PartnerDistributorsPage() {
  const toast = useToast();
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmStatusData, setConfirmStatusData] = useState<{
    isOpen: boolean;
    distributor: any;
    newStatus: string;
  }>({
    isOpen: false,
    distributor: null,
    newStatus: 'ACTIVE',
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<any | null>(null);

  // Form State for Create
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    mobile: '',
    email: '',
    district: '',
    taluk: '',
    address: '',
    commissionSlab: 'STANDARD',
    commissionPercentage: 10,
    markup: 1,
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    loadDistributors();
  }, []);

  const loadDistributors = async () => {
    try {
      const data = await api.getPartnerDistributors();
      setDistributors(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load distributors:', err);
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.createPartnerDistributor({
        ...formData,
        commissionPercentage: Number(formData.commissionPercentage),
        markup: Number(formData.markup),
      });

      setSuccessMsg('Distributor successfully created and onboarded!');
      setIsCreateOpen(false);
      setFormData({
        name: '',
        businessName: '',
        mobile: '',
        email: '',
        district: '',
        taluk: '',
        address: '',
        commissionSlab: 'STANDARD',
        commissionPercentage: 10,
        markup: 1,
        password: '',
      });
      loadDistributors();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create distributor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDistributor) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.updatePartnerDistributor(editingDistributor.id, {
        name: editingDistributor.name,
        businessName: editingDistributor.businessName,
        district: editingDistributor.district,
        taluk: editingDistributor.taluk,
        commissionSlab: editingDistributor.commissionSlab,
        commissionPercentage: Number(editingDistributor.commissionPercentage),
        markup: Number(editingDistributor.markup),
      });

      setSuccessMsg('Distributor details updated successfully!');
      setEditingDistributor(null);
      loadDistributors();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update distributor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = (distributor: any) => {
    const newStatus = distributor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setConfirmStatusData({
      isOpen: true,
      distributor,
      newStatus,
    });
  };

  const confirmToggleStatus = async () => {
    if (!confirmStatusData.distributor) return;
    setStatusLoading(true);
    try {
      await api.updatePartnerDistributorStatus(
        confirmStatusData.distributor.id,
        confirmStatusData.newStatus
      );
      toast.success(
        `Distributor ${confirmStatusData.distributor.name} ${
          confirmStatusData.newStatus === 'ACTIVE' ? 'activated' : 'deactivated'
        }.`
      );
      setConfirmStatusData({ isOpen: false, distributor: null, newStatus: 'ACTIVE' });
      loadDistributors();
    } catch (err: any) {
      toast.error(err.message || 'Error toggling status');
    } finally {
      setStatusLoading(false);
    }
  };

  const filtered = distributors.filter((d) => {
    if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.businessName?.toLowerCase().includes(q) ||
      d.distributorCode?.toLowerCase().includes(q) ||
      d.mobile?.includes(q) ||
      d.district?.toLowerCase().includes(q) ||
      d.taluk?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedDistributors = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  if (loading) {
    return <LoadingSkeleton rows={3} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-xs text-[#8F5A0D] font-bold mb-3">
            <Building2 className="h-3.5 w-3.5 text-[#C98219]" />
            <span>Regional Franchise • Distributor Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            My Distributors ({distributors.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Create, assign commission slabs, and manage subordinate Distributors managing your regional Centres.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-[8px] bg-[#C98219] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#A86B14] transition-all shadow-subtle shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Distributor</span>
        </button>
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

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#667085]" />
          <input
            type="text"
            placeholder="Search by distributor name, code (DT-001), mobile or district..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-[8px] border border-[#E6EAF0] bg-white pl-9 pr-3 py-2 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-48 shrink-0">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-[8px] border border-[#E6EAF0] bg-white px-3 py-2 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive / Suspended</option>
          </select>
        </div>
      </div>

      {/* Distributors Grid */}
      {paginatedDistributors.length === 0 ? (
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-12 text-center text-xs text-[#667085]">
          <Building2 className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
          <p className="font-semibold text-[#172033]">No Distributors Found</p>
          <p className="mt-1">Add your first regional Distributor or adjust your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedDistributors.map((d) => (
            <div
              key={d.id}
              className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono text-[10.5px] font-bold text-[#C98219] bg-[#FEF7E6] px-2 py-0.5 rounded border border-[#F9DE9B]">
                      {d.distributorCode}
                    </span>
                    <h3 className="text-base font-extrabold text-[#172033] mt-1.5">{d.name}</h3>
                    {d.businessName && <p className="text-xs text-[#667085]">{d.businessName}</p>}
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                      d.status === 'ACTIVE'
                        ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                        : 'bg-[#FDECEC] text-[#C2413B] border-[#F5C6CB]'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#475467] border-t border-[#F0F3F7] pt-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-[#667085]" />
                    <span>{d.mobile}</span>
                  </div>
                  {d.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-[#667085]" />
                      <span className="truncate">{d.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#667085]" />
                    <span>{d.district || 'All Districts'} {d.taluk ? `(${d.taluk})` : ''}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8FAFC] p-3 rounded-[8px] border border-[#E6EAF0] mb-4">
                  <div>
                    <span className="text-[#667085] text-[10.5px]">Commission Slab</span>
                    <p className="font-bold text-[#172033]">
                      {d.commissionSlab || 'STANDARD'} ({d.commissionPercentage}%)
                    </p>
                  </div>
                  <div>
                    <span className="text-[#667085] text-[10.5px]">Assigned Markup</span>
                    <p className="font-bold text-[#C98219]">+{formatINR(d.markup || 0)}</p>
                  </div>
                  <div>
                    <span className="text-[#667085] text-[10.5px]">Centres Managed</span>
                    <p className="font-bold text-[#172033]">{d.centresCount || 0}</p>
                  </div>
                  <div>
                    <span className="text-[#667085] text-[10.5px]">Created Date</span>
                    <p className="font-medium text-[#667085] text-[11px]">{formatDate(d.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-[#F0F3F7] pt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/partner/distributors/${d.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#175CD3] hover:underline"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>

                  <Link
                    href={`/partner/centres?distributorId=${d.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#667085] hover:text-[#172033]"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>View Centres</span>
                  </Link>
                </div>

                <div className="flex items-center justify-between border-t border-[#F8FAFC] pt-2 gap-2">
                  <button
                    onClick={() => setEditingDistributor(d)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#475467] hover:text-[#172033]"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit Slab</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(d)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                      d.status === 'ACTIVE'
                        ? 'text-[#C2413B] hover:bg-[#FDECEC]'
                        : 'text-[#198754] hover:bg-[#EAF7EE]'
                    }`}
                  >
                    <Power className="h-3 w-3" />
                    <span>{d.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#E6EAF0] pt-4 text-xs text-[#667085]">
          <span>
            Showing page {currentPage} of {totalPages} ({filtered.length} total distributors)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-[6px] border border-[#E6EAF0] px-3 py-1 font-semibold disabled:opacity-40 hover:bg-[#F8FAFC]"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-[6px] border border-[#E6EAF0] px-3 py-1 font-semibold disabled:opacity-40 hover:bg-[#F8FAFC]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* CREATE DISTRIBUTOR MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-[12px] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3 mb-4">
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#C98219]" />
                <span>Create New Distributor</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-[#667085] hover:text-[#172033]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#172033] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. K. Murugan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">Business / Agency Name</label>
                <input
                  type="text"
                  placeholder="e.g. Murugan e-Sevai Distributor Hub"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit Indian Mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="distributor@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Madurai"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Taluk</label>
                  <input
                    type="text"
                    placeholder="e.g. Melur"
                    value={formData.taluk}
                    onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                    className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-[#F0F3F7] pt-3">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Commission Slab</label>
                  <select
                    value={formData.commissionSlab}
                    onChange={(e) => setFormData({ ...formData, commissionSlab: e.target.value })}
                    className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                  >
                    <option value="STANDARD">STANDARD (10%)</option>
                    <option value="SILVER">SILVER (12%)</option>
                    <option value="GOLD">GOLD (15%)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Distributor Markup (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="2"
                    value={formData.markup}
                    onChange={(e) => setFormData({ ...formData, markup: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs font-bold text-[#C98219] focus:border-[#C98219] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">Initial Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave empty to auto-generate"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E6EAF0] pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#667085] hover:text-[#172033]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-[8px] bg-[#C98219] px-4 py-2 text-xs font-bold text-white hover:bg-[#A86B14] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Confirm & Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingDistributor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[12px] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3 mb-4">
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-[#C98219]" />
                <span>Edit Distributor: {editingDistributor.distributorCode}</span>
              </h3>
              <button
                onClick={() => setEditingDistributor(null)}
                className="text-[#667085] hover:text-[#172033]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#172033] mb-1">Distributor Name</label>
                <input
                  type="text"
                  required
                  value={editingDistributor.name}
                  onChange={(e) =>
                    setEditingDistributor({ ...editingDistributor, name: e.target.value })
                  }
                  className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">Commission Slab</label>
                <select
                  value={editingDistributor.commissionSlab || 'STANDARD'}
                  onChange={(e) =>
                    setEditingDistributor({ ...editingDistributor, commissionSlab: e.target.value })
                  }
                  className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs focus:border-[#C98219] focus:outline-none"
                >
                  <option value="STANDARD">STANDARD (10%)</option>
                  <option value="SILVER">SILVER (12%)</option>
                  <option value="GOLD">GOLD (15%)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">
                  Distributor Markup (₹) [Max: ₹{editingDistributor.maxAllowedMarkup || 2}]
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={editingDistributor.maxAllowedMarkup || 2}
                  value={editingDistributor.markup}
                  onChange={(e) =>
                    setEditingDistributor({ ...editingDistributor, markup: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-[8px] border border-[#E6EAF0] px-3 py-2 text-xs font-bold text-[#C98219] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E6EAF0] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingDistributor(null)}
                  className="px-4 py-2 text-xs font-bold text-[#667085] hover:text-[#172033]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-[8px] bg-[#C98219] px-4 py-2 text-xs font-bold text-white hover:bg-[#A86B14] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmStatusData.isOpen}
        title={
          confirmStatusData.newStatus === 'ACTIVE'
            ? 'Activate Distributor'
            : 'Deactivate Distributor'
        }
        description={
          confirmStatusData.distributor
            ? confirmStatusData.newStatus === 'ACTIVE'
              ? `Are you sure you want to activate distributor '${confirmStatusData.distributor.name}' (${confirmStatusData.distributor.distributorCode})?`
              : `Are you sure you want to deactivate distributor '${confirmStatusData.distributor.name}' (${confirmStatusData.distributor.distributorCode})? Associated centres will be unable to access distributor benefits.`
            : ''
        }
        confirmLabel={
          confirmStatusData.newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'
        }
        cancelLabel="Cancel"
        isDestructive={confirmStatusData.newStatus === 'INACTIVE'}
        loading={statusLoading}
        onConfirm={confirmToggleStatus}
        onCancel={() =>
          setConfirmStatusData({ isOpen: false, distributor: null, newStatus: 'ACTIVE' })
        }
      />
    </div>
  );
}

