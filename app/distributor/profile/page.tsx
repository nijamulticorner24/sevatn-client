'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import {
  UserCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Percent,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export default function DistributorProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDistributorProfile()
      .then((res) => {
        setProfile(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-xs text-[#8F5A0D] font-bold mb-3">
          <UserCheck className="h-3.5 w-3.5 text-[#C98219]" />
          <span>Distributor Profile &amp; Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
          Account &amp; Commission Configuration
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-1">
          Review your registered business details, parent Partner franchise, and assigned commission slab.
        </p>
      </div>

      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-6">
        <div>
          <h2 className="text-sm font-bold text-[#172033] mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#C98219]" />
            <span>Business Information</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0]">
              <span className="text-[#667085] text-[11px]">Distributor Code</span>
              <p className="font-mono font-bold text-[#172033] mt-0.5">{profile?.distributorCode}</p>
            </div>
            <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0]">
              <span className="text-[#667085] text-[11px]">Primary Contact</span>
              <p className="font-bold text-[#172033] mt-0.5">{profile?.name}</p>
            </div>
            <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0]">
              <span className="text-[#667085] text-[11px]">Mobile Number</span>
              <p className="font-bold text-[#172033] mt-0.5">{profile?.mobile}</p>
            </div>
            <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0]">
              <span className="text-[#667085] text-[11px]">Email Address</span>
              <p className="font-bold text-[#172033] mt-0.5">{profile?.email || 'N/A'}</p>
            </div>
            <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0]">
              <span className="text-[#667085] text-[11px]">Jurisdiction</span>
              <p className="font-bold text-[#172033] mt-0.5">
                {profile?.district || 'Tamil Nadu'} {profile?.taluk ? `(${profile.taluk})` : ''}
              </p>
            </div>
            <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0]">
              <span className="text-[#667085] text-[11px]">Account Status</span>
              <p className="font-bold text-[#198754] mt-0.5">{profile?.status}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#E6EAF0] pt-6">
          <h2 className="text-sm font-bold text-[#172033] mb-4 flex items-center gap-2">
            <Percent className="h-4 w-4 text-[#175CD3]" />
            <span>Assigned Partner &amp; Commission Slab</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-[8px] bg-[#EFF8FF] border border-[#B2DDFF]">
              <span className="text-[#175CD3] text-[11px] font-semibold">Parent Partner Franchise</span>
              <p className="font-bold text-[#172033] mt-0.5">
                {profile?.partner?.name} ({profile?.partner?.partnerCode})
              </p>
              <p className="text-[10.5px] text-[#667085] mt-1">
                Your account was created and is governed by this regional Partner.
              </p>
            </div>

            <div className="p-3 rounded-[8px] bg-[#FEF7E6] border border-[#F9DE9B]">
              <span className="text-[#8F5A0D] text-[11px] font-semibold">Assigned Commission Slab</span>
              <p className="font-bold text-[#172033] mt-0.5">
                {profile?.commissionSlab || 'STANDARD'} ({profile?.commissionPercentage}%)
              </p>
              <p className="text-[10.5px] text-[#667085] mt-1">
                Commission configuration is assigned directly by your Partner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

