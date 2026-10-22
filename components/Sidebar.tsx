'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import {
  LayoutDashboard,
  Wallet,
  CirclePlus,
  Timer,
  RefreshCcw,
  MonitorDot,
  ListOrdered,
  Building2,
  Receipt,
  BrainCircuit,
  SlidersHorizontal,
  Bolt,
  Users,
  MapPin,
  LayoutGrid,
  ChevronLeft,
  ShieldCheck,
  DollarSign,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole = 'CENTRE' }) => {
  const pathname = usePathname();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const isTicketAssistContext =
    pathname?.startsWith('/dashboard/ticket-assist') ||
    pathname?.startsWith('/dashboard/bookings') ||
    pathname?.startsWith('/dashboard/wallet') ||
    pathname?.startsWith('/dashboard/refunds');

  const isInstantServiceContext = pathname?.startsWith('/dashboard/instant-service');

  // Platform Navigation Links
  const platformLinks = [
    { name: 'Platform Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Services Directory', href: '/dashboard/services', icon: LayoutGrid },
  ];

  const platformDirectServices = [
    {
      name: 'TicketAssist',
      href: '/dashboard/bookings/new',
      icon: ShieldCheck,
      badge: 'Live',
      liveIndicator: true,
    },
  ];

  const platformAccountLinks = [
    { name: 'Service Location & Profile', href: '/dashboard/profile', icon: MapPin },
    ...(!isSuperAdmin ? [{ name: 'Wallet & Ledger', href: '/dashboard/wallet', icon: Wallet }] : []),
  ];

  // TicketAssist Service Operations Links
  const ticketAssistOperations = [
    { name: 'TicketAssist Overview', href: '/dashboard/ticket-assist', icon: LayoutDashboard },
    { name: 'New Booking', href: '/dashboard/bookings/new', icon: CirclePlus, highlight: true },
    { name: 'Booking Status', href: '/dashboard/bookings', icon: Timer },
  ];

  const ticketAssistFinance = [
    { name: 'Wallet & Ledger', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Refund Requests', href: '/dashboard/refunds', icon: RefreshCcw },
  ];

  // Admin Links
  const adminLinks = [
    { name: 'Admin Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Partners', href: '/admin/partners', icon: Users },
    { name: 'Partner Payouts', href: '/admin/payouts', icon: DollarSign },
    { name: 'Worker PC Fleet', href: '/admin/fleet', icon: MonitorDot, badge: 'Live' },
    { name: 'Central Queue', href: '/admin/bookings', icon: ListOrdered },
    { name: 'Centres Directory', href: '/admin/centres', icon: Building2 },
    { name: 'Financial Ledger & Collections', href: '/admin/ledger', icon: Receipt },
    { name: 'AI Diagnostics', href: '/admin/diagnostics', icon: BrainCircuit },
    { name: 'System Config', href: '/admin/config', icon: SlidersHorizontal },
    { name: 'Admin Profile', href: '/admin/profile', icon: UserCheck },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="sticky top-20 flex flex-col gap-6 rounded-[10px] bg-white p-4 border border-[#E6EAF0] shadow-subtle">
        {/* CONTEXT 1: TICKETASSIST SERVICE NAVIGATION */}
        {isTicketAssistContext ? (
          <>
            {/* Back to Platform Link */}
            <div className="border-b border-[#E6EAF0] pb-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-[7px] border border-[#E6EAF0] bg-[#F7F9FC] px-3 py-2 text-xs font-semibold text-[#475467] hover:text-[#172033] hover:bg-[#F0F3F8] transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-[#C98219]" />
                <span>Back to SevaTN</span>
              </Link>
            </div>

            {/* TicketAssist Operations */}
            <div>
              <p className="px-3 text-[10.5px] font-bold tracking-wider text-[#C98219] uppercase flex items-center justify-between mb-1">
                <span>TicketAssist Operations</span>
                <span className="rounded bg-[#FEF7E6] px-1.5 py-0.5 text-[9px] text-[#8F5A0D] font-bold border border-[#F9DE9B]">
                  ACTIVE
                </span>
              </p>
              <nav className="space-y-0.5">
                {ticketAssistOperations.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-[#FDF7ED] text-[#172033] font-semibold border-l-2 border-[#C98219]'
                          : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#172033]',
                        item.highlight && !active && 'text-[#C98219]',
                      )}
                    >
                      <Icon className={cn('h-4 w-4', active ? 'text-[#C98219]' : 'text-[#667085]')} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* TicketAssist Finance */}
            <div>
              <p className="px-3 text-[10.5px] font-bold tracking-wider text-[#98A2B3] uppercase mb-1">
                Finance & Ledger
              </p>
              <nav className="space-y-0.5">
                {ticketAssistFinance.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-[#FDF7ED] text-[#172033] font-semibold border-l-2 border-[#C98219]'
                          : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#172033]',
                      )}
                    >
                      <Icon className={cn('h-4 w-4', active ? 'text-[#C98219]' : 'text-[#667085]')} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        ) : isInstantServiceContext ? (
          /* CONTEXT 2: INSTANT SERVICE NAVIGATION */
          <>
            <div className="border-b border-[#E6EAF0] pb-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-[7px] border border-[#E6EAF0] bg-[#F7F9FC] px-3 py-2 text-xs font-semibold text-[#475467] hover:text-[#172033] hover:bg-[#F0F3F8] transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-[#C98219]" />
                <span>Back to SevaTN</span>
              </Link>
            </div>

            <div>
              <p className="px-3 text-[10.5px] font-bold tracking-wider text-[#C98219] uppercase mb-1">
                Instant Service
              </p>
              <nav className="space-y-0.5">
                <Link
                  href="/dashboard/instant-service"
                  className="flex items-center gap-2.5 rounded-[6px] bg-[#FDF7ED] text-[#172033] font-semibold border-l-2 border-[#C98219] px-3 py-2 text-[13px]"
                >
                  <Bolt className="h-4 w-4 text-[#C98219]" />
                  <span>Instant Service Portal</span>
                </Link>
                <Link
                  href="/dashboard/services"
                  className="flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#475467] hover:bg-[#F8FAFC] hover:text-[#172033]"
                >
                  <LayoutGrid className="h-4 w-4 text-[#667085]" />
                  <span>All Platform Services</span>
                </Link>
              </nav>
            </div>
          </>
        ) : (
          /* CONTEXT 3: SEVA TN PLATFORM HOME NAVIGATION */
          <>
            <div>
              <p className="px-3 text-[10.5px] font-bold tracking-wider text-[#C98219] uppercase flex items-center justify-between mb-1">
                <span>SevaTN Platform</span>
                <span className="rounded bg-[#FEF7E6] px-1.5 py-0.5 text-[9px] text-[#8F5A0D] font-bold border border-[#F9DE9B]">
                  NIJA
                </span>
              </p>
              <nav className="space-y-0.5">
                {platformLinks.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-[#FDF7ED] text-[#172033] font-semibold border-l-2 border-[#C98219]'
                          : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#172033]',
                      )}
                    >
                      <Icon className={cn('h-4 w-4', active ? 'text-[#C98219]' : 'text-[#667085]')} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Direct Services */}
            <div>
              <p className="px-3 text-[10.5px] font-bold tracking-wider text-[#98A2B3] uppercase mb-1">
                Active Services
              </p>
              <nav className="space-y-0.5">
                {platformDirectServices.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-[#FDF7ED] text-[#172033] font-semibold border-l-2 border-[#C98219]'
                          : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#172033]',
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn('h-4 w-4', active ? 'text-[#C98219]' : 'text-[#667085]')} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.liveIndicator ? (
                        <span className="flex items-center gap-1 rounded-full bg-[#EAF7EE] px-1.5 py-0.5 text-[9px] font-bold text-[#198754] border border-[#C3E6CB]">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#198754] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#198754]"></span>
                          </span>
                          LIVE
                        </span>
                      ) : (
                        <span className="rounded bg-[#F8FAFC] px-1.5 py-0.5 text-[9.5px] font-bold text-[#667085] border border-[#E6EAF0]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Account & Location */}
            <div>
              <p className="px-3 text-[10.5px] font-bold tracking-wider text-[#98A2B3] uppercase mb-1">
                Account & Security
              </p>
              <nav className="space-y-0.5">
                {platformAccountLinks.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-[#FDF7ED] text-[#172033] font-semibold border-l-2 border-[#C98219]'
                          : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#172033]',
                      )}
                    >
                      <Icon className={cn('h-4 w-4', active ? 'text-[#C98219]' : 'text-[#667085]')} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        )}

        {/* Admin Management Section (If Super Admin) */}
        {isSuperAdmin && (
          <div>
            <div className="border-t border-[#F0F3F7] pt-4">
              <p className="px-3 text-[10.5px] font-bold tracking-wider text-[#C98219] uppercase flex items-center justify-between mb-1">
                <span>Management Hub</span>
                <span className="rounded bg-[#FEF7E6] px-1.5 py-0.5 text-[9px] text-[#8F5A0D] font-bold border border-[#F9DE9B]">
                  SUPER ADMIN
                </span>
              </p>
              <nav className="space-y-0.5">
                {adminLinks.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-[#FDF7ED] text-[#172033] font-semibold border-l-2 border-[#C98219]'
                          : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#172033]',
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn('h-4 w-4', active ? 'text-[#C98219]' : 'text-[#667085]')} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded bg-[#EAF7EE] px-1.5 py-0.5 text-[9.5px] font-bold text-[#198754] border border-[#C3E6CB]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* 5 KM Access & Compliance Banner */}
        <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F7F9FC] p-3 text-[11.5px] text-[#667085] space-y-1">
          <p className="font-bold text-[#172033] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#198754] inline-block" />
            5 KM Geofence Guard
          </p>
          <p className="leading-relaxed">
            GPS validated for registered eSevai centre operations.
          </p>
        </div>
      </div>
    </aside>
  );
};
