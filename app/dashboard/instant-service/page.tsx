'use client';

import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Clock,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { PlatformPageHeader } from '@/components/platform/PlatformPageHeader';

export default function InstantServicePage() {
  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <PlatformPageHeader
        title={<span className="text-[#C98219]">Instant Service</span>}
        subtitle="Automated document verification and digital citizen services for authorized centres."
        badge="Citizen Services"
        icon={Zap}
        iconColor="text-[#C98219]"
        backHref="/dashboard/services"
        backLabel="Services Directory"
      >
        <Link
          href="/dashboard/services"
          className="rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs font-semibold text-[#171717] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Directory</span>
        </Link>
      </PlatformPageHeader>

      {/* Main Animated Coming Soon Showcase */}
      <div className="relative overflow-hidden rounded-[16px] border border-[#E6EAF0] bg-gradient-to-b from-white via-[#FCFDFE] to-[#F8FAFC] p-8 sm:p-14 shadow-subtle text-center flex flex-col items-center justify-center">
        {/* Decorative Ambient Radial Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 sm:h-96 sm:w-96 rounded-full bg-gradient-to-tr from-[#FEF7E6] via-[#FAF3E7] to-transparent blur-3xl opacity-80 pointer-events-none" />

        {/* Top Floating Eyebrow Badge */}
        <div className="relative mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FEF7E6] px-4 py-1.5 text-xs font-extrabold text-[#8F5A0D] border border-[#F9DE9B] shadow-2xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C98219] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C98219]" />
            </span>
            <span>FEATURE IN ACTIVE DEVELOPMENT</span>
          </span>
        </div>

        {/* Central Orbital Radar Animation */}
        <div className="relative flex items-center justify-center my-6">
          {/* Outer Dashed Orbit */}
          <div className="h-44 w-44 sm:h-52 sm:w-52 rounded-full border border-dashed border-[#F9DE9B] animate-[spin_16s_linear_infinite]" />

          {/* Middle Orbit with Orbiting Satellites */}
          <div className="absolute h-32 w-32 sm:h-38 sm:w-38 rounded-full border border-[#E8D5B7]/70 animate-[spin_10s_linear_infinite_reverse]">
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-[#C98219] shadow-sm animate-pulse" />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[#D99B26]" />
          </div>

          {/* Pulsing Aura */}
          <div className="absolute h-24 w-24 rounded-full bg-[#FEF7E6] animate-ping opacity-40 [animation-duration:3s]" />

          {/* Core Orb with Zap Icon */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#C98219] via-[#D99B26] to-[#B57414] text-white shadow-elevated">
            <Zap className="h-10 w-10 text-white drop-shadow-md animate-pulse" />
          </div>
        </div>

        {/* Headline & Description */}
        <div className="relative max-w-md space-y-3 mt-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            <span className="text-[#C98219]">Instant Service</span> is Coming Soon
          </h2>
          <p className="text-sm text-[#525252] leading-relaxed">
            We are engineering integrated citizen service workflows, revenue record verifications, and instant document query bridges directly into your centre console.
          </p>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="relative mt-8 w-full max-w-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-[#737373] mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#C98219] animate-spin [animation-duration:8s]" />
              <span>Integration Status</span>
            </span>
            <span className="text-[#8F5A0D] font-bold">In Progress</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#E6EAF0] overflow-hidden p-0.5 border border-[#E6EAF0]">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#C98219] via-[#F59E0B] to-[#C98219] bg-[length:200%_100%] animate-[shimmer_2s_infinite] shadow-2xs" />
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard/services"
            className="inline-flex items-center gap-2 rounded-[7px] bg-[#C98219] px-5 py-2.5 text-xs sm:text-[13px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle"
          >
            <Compass className="h-4 w-4" />
            <span>Explore Other Services</span>
          </Link>
          <Link
            href="/dashboard/ticket-assist"
            className="inline-flex items-center gap-2 rounded-[7px] border border-[#D0D5DD] bg-white px-5 py-2.5 text-xs sm:text-[13px] font-semibold text-[#171717] hover:bg-[#F8FAFC] transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-[#C98219]" />
            <span>Launch TicketAssist</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
