'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  Building2,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function PartnerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe()
      .then((res) => {
        setProfile(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const partner = profile?.partner;
  const user = profile?.user;

  if (loading) {
    return <div className="h-64 rounded-[10px] bg-white border border-[#E6EAF0] animate-pulse" />;
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
          <Users className="h-4 w-4" />
          <span>Franchise Information</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#172033]">
          Partner Profile & Jurisdiction
        </h1>
        <p className="text-xs text-[#667085] mt-1">
          Authorized distributor details and territory jurisdiction settings for SevaTN.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle space-y-6">
        <div className="flex items-center gap-4 pb-5 border-b border-[#E6EAF0]">
          <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B] font-extrabold text-xl">
            {partner?.partnerCode || 'PT'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#172033]">
                {partner?.name || 'NIJA Digital Network'}
              </h2>
              <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                VERIFIED PARTNER
              </span>
            </div>
            <p className="text-xs font-mono text-[#8F5A0D] font-bold mt-0.5">
              Code: {partner?.partnerCode || 'PT-001'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-[8px] bg-[#F8FAFC] p-4 border border-[#E6EAF0]">
            <span className="text-[#667085] font-medium">Partner Contact Email</span>
            <p className="text-sm font-bold text-[#172033] mt-1 flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#C98219]" />
              {partner?.email || user?.email || 'partner@nija.in'}
            </p>
          </div>

          <div className="rounded-[8px] bg-[#F8FAFC] p-4 border border-[#E6EAF0]">
            <span className="text-[#667085] font-medium">Partner Mobile Number</span>
            <p className="text-sm font-bold text-[#172033] mt-1 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#C98219]" />
              {partner?.mobile || user?.mobile || '9443199999'}
            </p>
          </div>

          <div className="rounded-[8px] bg-[#F8FAFC] p-4 border border-[#E6EAF0]">
            <span className="text-[#667085] font-medium">Assigned Territory District</span>
            <p className="text-sm font-bold text-[#172033] mt-1 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#198754]" />
              {partner?.district || 'Chennai'}
            </p>
          </div>

          <div className="rounded-[8px] bg-[#F8FAFC] p-4 border border-[#E6EAF0]">
            <span className="text-[#667085] font-medium">Assigned Taluk Jurisdiction</span>
            <p className="text-sm font-bold text-[#172033] mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#C98219]" />
              {partner?.taluk || 'Guindy'}
            </p>
          </div>
        </div>

        {/* Commission Terms */}
        <div className="rounded-[8px] border border-[#F9DE9B] bg-[#FEF7E6] p-4 text-xs">
          <p className="font-bold text-[#172033] flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#C98219]" />
            Official Franchise Agreement & Terms
          </p>
          <p className="text-[#8F5A0D] mt-1 leading-relaxed">
            As an Authorized Partner enrolled on the <strong>{partner?.commissionSlab || 'STANDARD'}</strong> slab, you receive a franchise commission of <strong>{partner?.commissionPercentage || 20}%</strong> (currently ₹{Number(partner?.commissionRate || 20).toFixed(2)} based on the booking service fee) for every Virtual-Q Darshan booking executed by eSevai centres in your network. Settlements are processed directly to your registered bank account.
          </p>
        </div>
      </div>
    </div>
  );
}
