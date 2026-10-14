'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Compass,
  ShieldCheck,
  Zap,
  Search,
  CheckCircle2,
  ArrowRight,
  Plus,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PlatformPageHeader } from '@/components/platform/PlatformPageHeader';
import { ServiceCard } from '@/components/platform/ServiceCard';

/* ========================================================================= */
/* DEDICATED ANIMATED COMING SOON CARD FOR INSTANT SERVICE                    */
/* Removes all detailed text/lists and presents an animated preview state.   */
/* ========================================================================= */
function InstantServiceComingSoonCard() {
  return (
    <div className="group relative flex flex-col rounded-[12px] border border-[#E2E8F0] bg-white p-6 shadow-subtle hover:border-[#C98219]/40 hover:shadow-card transition-all duration-200">
      <div>
        {/* Top Header / Badges */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border shadow-2xs transition-transform group-hover:scale-105 bg-[#FEF7E6] border-[#F9DE9B]">
              <Zap className="h-6 w-6 text-[#C98219]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Citizen Services
                </span>
                <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-[10px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                  In Development
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] tracking-tight group-hover:text-[#C98219] transition-colors">
                Instant Service
              </h3>
            </div>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-bold text-[#64748B] border border-[#E2E8F0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C98219] animate-pulse" />
              Coming Soon
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3.5 text-xs sm:text-[13px] text-[#64748B] leading-relaxed">
          Automated citizen services and instant document verification workflows are currently being engineered for your centre.
        </p>

        {/* Feature Rollout Progress Bar */}
        <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[#C98219]" />
              <span>Feature Rollout</span>
            </span>
            <span className="text-[#8F5A0D] font-bold text-[10.5px]">In Progress</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#C98219] to-[#F59E0B]" />
          </div>
        </div>
      </div>

      {/* Bottom Status Action */}
      <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
        <button
          disabled
          className="w-full rounded-[7px] bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2.5 text-xs sm:text-[13px] font-bold text-[#64748B] cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Clock className="h-3.5 w-3.5 text-[#C98219]" />
          <span>Coming Soon in Upcoming Release</span>
        </button>
      </div>
    </div>
  );
}

export default function ServicesDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Built-in catalog definitions
  const catalog = [
    {
      id: 'ticket-assist',
      code: 'TICKET_ASSIST',
      title: 'TicketAssist',
      category: 'Booking Services',
      description:
        'Fast booking assistance service with no advance deduction. Wallet amount is debited only upon successful pass confirmation.',
      icon: ShieldCheck,
      iconColor: 'text-[#C98219]',
      iconBg: 'bg-[#FEF7E6] border-[#F9DE9B]',
      status: 'ACTIVE' as const,
      badge: 'Active',
      highlights: [],
      primaryAction: {
        label: 'Open TicketAssist',
        href: '/dashboard/ticket-assist',
        icon: ArrowRight,
      },
      secondaryAction: {
        label: 'New Booking',
        href: '/dashboard/bookings/new',
        icon: Plus,
      },
      isComingSoon: false,
    },
    {
      id: 'instant-service',
      code: 'INSTANT_SERVICE',
      title: 'Instant Service',
      category: 'Citizen Services',
      isComingSoon: true,
    },
  ];

  const categories = ['ALL', 'Booking Services', 'Citizen Services'];

  const filteredCatalog = catalog.filter((svc) => {
    if (selectedCategory !== 'ALL' && svc.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = svc.title.toLowerCase().includes(q);
      const matchCat = svc.category.toLowerCase().includes(q);
      if (!matchTitle && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PlatformPageHeader
        title="Services Directory"
        subtitle="Explore and launch authorized assisted-services available to your centre network."
        badge="SevaTN Platform Catalogue"
        icon={Compass}
        backHref="/dashboard"
        backLabel="Platform Home"
      >
        <Link
          href="/dashboard/ticket-assist"
          className="rounded-[7px] bg-[#C98219] px-4 py-2 text-xs sm:text-[13px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle flex items-center gap-1.5"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Launch TicketAssist</span>
        </Link>
      </PlatformPageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-[12px] border border-[#E6EAF0] shadow-subtle">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-[6px] px-3 py-1.5 font-bold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#C98219] text-white shadow-2xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#171717]'
              }`}
            >
              {cat === 'ALL' ? 'All Services (2)' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search services, departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] pl-8 pr-3 py-1.5 text-xs text-[#171717] placeholder-[#94A3B8] focus:border-[#C98219] focus:bg-white focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {filteredCatalog.map((svc) =>
          svc.isComingSoon ? (
            <InstantServiceComingSoonCard key={svc.id} />
          ) : (
            <ServiceCard
              key={svc.id}
              id={svc.id}
              title={svc.title}
              category={svc.category}
              description={svc.description!}
              icon={svc.icon!}
              iconColor={svc.iconColor}
              iconBg={svc.iconBg}
              status={svc.status!}
              badge={svc.badge}
              highlights={svc.highlights}
              primaryAction={svc.primaryAction!}
              secondaryAction={svc.secondaryAction}
            />
          ),
        )}
      </div>

      {/* Platform Service Registration Notice */}
      <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#171717]">Expanding Service Catalogue</h3>
            <p className="text-xs text-[#525252] mt-0.5 max-w-xl">
              Additional state services, citizen documents, and certificate verification bridges are automatically registered into your centre directory through the SevaTN Unified Registry.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/profile"
          className="rounded-[7px] border border-[#D0D5DD] bg-[#F8FAFC] px-3.5 py-2 text-xs font-bold text-[#171717] hover:bg-[#F1F5F9] transition-colors self-start sm:self-auto shrink-0"
        >
          <span>View Centre Permissions</span>
        </Link>
      </div>
    </div>
  );
}
