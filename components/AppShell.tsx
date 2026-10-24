'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatINR, cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarCheck2,
  Timer,
  Wallet,
  Receipt,
  RefreshCcw,
  UserCheck,
  Bell,
  SlidersHorizontal,
  Building2,
  MonitorDot,
  ListOrdered,
  BrainCircuit,
  Search,
  LogOut,
  Menu,
  X,
  CircleHelp,
  ShieldCheck,
  CirclePlus,
  LayoutGrid,
  Bolt,
  Users,
  TrendingUp,
  BadgeDollarSign,
  UserPlus,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Check if we are on public landing, auth, partner onboarding, legal, or centre registration pages
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/c/') ||
    pathname.startsWith('/centre/') ||
    pathname.startsWith('/partner/onboard') ||
    pathname.startsWith('/service/register') ||
    pathname === '/forgot-password' ||
    pathname === '/contact' ||
    pathname === '/terms-and-conditions' ||
    pathname === '/refund-policy';

  useEffect(() => {
    const u = api.getUser();
    setUser(u);
    if (u && !isPublicRoute) {
      if (u.role === 'CENTRE') {
        api.getWallet()
          .then(setWallet)
          .catch(() => {});
      }
      // Keep user profile and registered location in sync
      api.getMe()
        .then((res) => {
          if (res?.user) setUser(res.user);
        })
        .catch(() => {});

      // Proactively capture location if supported and permitted
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const sanitizedAcc = Math.min(pos.coords.accuracy || 100, 2500);
            api.setLocationCoordinates(pos.coords.latitude, pos.coords.longitude, sanitizedAcc);
          },
          () => {
            // If GPS denied/unavailable, ensureLocationCoordinates will use registeredLocation
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
        );
      }
    }
  }, [pathname, isPublicRoute]);

  if (isPublicRoute) {
    return <div className="min-h-screen bg-[#F7F9FC]">{children}</div>;
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin;
  const isPartner = user?.role === 'PARTNER';

  // 1. Navigation for Super Admin (Platform Creator / Provider)
  const adminNavGroups = [
    {
      group: 'PLATFORM OPERATIONS',
      items: [
        { name: 'Operations Overview', href: '/admin', icon: LayoutDashboard },
        { name: 'Create Booking', href: '/dashboard/bookings/new', icon: CirclePlus, badge: 'New' },
        { name: 'Partners Network', href: '/admin/partners', icon: Users },
        { name: 'Centres Directory', href: '/admin/centres', icon: Building2 },
        { name: 'Worker PC Fleet', href: '/admin/fleet', icon: MonitorDot, badge: 'Live' },
        { name: 'Central Queue', href: '/admin/bookings', icon: ListOrdered },
      ],
    },
    {
      group: 'FINANCIAL SETTLEMENTS',
      items: [
        { name: 'Partner Payout Requests', href: '/admin/payouts', icon: BadgeDollarSign, badge: 'Payouts' },
        { name: 'Financial Split Ledger', href: '/admin/ledger', icon: Receipt },
      ],
    },
    {
      group: 'SYSTEM & DIAGNOSTICS',
      items: [
        { name: 'AI Diagnostics', href: '/admin/diagnostics', icon: BrainCircuit },
        { name: 'Platform Settings', href: '/admin/config', icon: SlidersHorizontal },
        { name: 'Admin Profile', href: '/admin/profile', icon: UserCheck },
      ],
    },
  ];

  // 2. Navigation for Regional Franchise Partners (PARTNER)
  const partnerNavGroups = [
    {
      group: 'PARTNER NETWORK',
      items: [
        { name: 'Partner Overview', href: '/partner', icon: LayoutDashboard },
        { name: 'My Network Centres', href: '/partner/centres', icon: Building2, badge: 'Centres' },
        { name: 'Onboard Centres', href: '/partner/invitations', icon: UserPlus },
      ],
    },
    {
      group: 'COMMISSIONS & REVENUE',
      items: [
        { name: 'Payout & Withdraw (UPI)', href: '/partner/payouts', icon: BadgeDollarSign, badge: 'UPI' },
        { name: 'Commission Ledger', href: '/partner/ledger', icon: Receipt },
      ],
    },
    {
      group: 'PARTNER ACCOUNT',
      items: [
        { name: 'Partner Profile', href: '/partner/profile', icon: UserCheck },
        { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      ],
    },
  ];

  // 3. Navigation for Centre Operators (End Users)
  const centreNavGroups = [
    {
      group: 'PLATFORM',
      items: [
        { name: 'Platform Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Services Directory', href: '/dashboard/services', icon: LayoutGrid },
      ],
    },
    {
      group: 'SERVICES',
      items: [
        {
          name: 'TicketAssist',
          href: '/dashboard/ticket-assist',
          icon: ShieldCheck,
          liveIndicator: true,
        },
      ],
    },
    {
      group: 'APPLICATIONS',
      items: [
        { name: 'Booking Queue & Status', href: '/dashboard/bookings', icon: Timer },
        { name: 'New Booking', href: '/dashboard/bookings/new', icon: CirclePlus },
      ],
    },
    {
      group: 'FINANCE',
      items: [
        { name: 'Wallet & Topup', href: '/dashboard/wallet', icon: Wallet },
        { name: 'Refund Requests', href: '/dashboard/refunds', icon: RefreshCcw },
      ],
    },
    {
      group: 'ACCOUNT',
      items: [
        { name: 'Centre Profile', href: '/dashboard/profile', icon: UserCheck },
        { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      ],
    },
  ];

  const currentNavGroups = isAdmin
    ? adminNavGroups
    : isPartner
    ? partnerNavGroups
    : centreNavGroups;

  const homeLink = isAdmin ? '/admin' : isPartner ? '/partner' : '/dashboard';

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#F7F9FC]">
      {/* Global Clean Top Bar */}
      <header className="h-[60px] shrink-0 bg-white border-b border-[#E6EAF0] px-4 sm:px-6 flex items-center justify-between shadow-subtle z-40">
        {/* Left: Brand / Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="md:hidden text-[#667085] hover:text-[#172033] p-1"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href={homeLink} className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="ServiceTN"
              className="h-8.5 w-auto max-h-[34px] object-contain"
            />
            {(isSuperAdmin || isPartner) && (
              <span className="rounded bg-[#FEF7E6] px-1.5 py-0.5 text-[9.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                {isSuperAdmin
                  ? 'SUPER ADMIN'
                  : 'AUTHORIZED PARTNER'}
              </span>
            )}
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Live WebSocket Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#198754] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#198754]"></span>
            </span>
            <span className="uppercase tracking-wider font-mono">LIVE SYNC</span>
          </div>

          {/* Wallet Balance Pill (Only for Centre Operators) */}
          {!isAdmin && !isPartner && (
            <Link
              href="/dashboard/wallet"
              className="hidden sm:flex items-center gap-2 rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] px-3 py-1.5 text-[13px] font-semibold text-[#172033] hover:bg-[#F0F3F8] transition-colors"
            >
              <Wallet className="h-3.5 w-3.5 text-[#C98219]" />
              <span className="tabular-nums">
                {wallet ? formatINR(wallet.availableBalance) : '₹0.00'}
              </span>
              {wallet && Number(wallet.reservedBalance) > 0 && (
                <span className="text-[11px] font-normal text-[#667085] border-l border-[#D0D5DD] pl-2 tabular-nums">
                  {formatINR(wallet.reservedBalance)} on hold
                </span>
              )}
            </Link>
          )}

          {/* User Profile Summary */}
          <div className="flex items-center gap-2.5 border-l border-[#E6EAF0] pl-3">
            <Link
              href={isSuperAdmin ? '/admin/profile' : isPartner ? '/partner/profile' : '/dashboard/profile'}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              title="View Account Profile & Settings"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDF7ED] border border-[#E8D5B7] text-[12px] font-bold text-[#7A4A12]">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-[12.5px] font-bold text-[#172033] leading-tight truncate max-w-[140px]">
                  {user?.name || (isSuperAdmin ? 'Super Admin' : isPartner ? 'Partner Manager' : 'Operator')}
                </p>
                <p className="text-[11px] text-[#667085] leading-tight">
                  {user?.role === 'CENTRE'
                    ? user?.centre?.centreName || 'Seva Centre'
                    : user?.role === 'PARTNER'
                    ? 'Franchise Partner'
                    : user?.role === 'SUPER_ADMIN'
                    ? 'Platform Creator'
                    : 'Platform User'}
                </p>
              </div>
            </Link>

            <button
              onClick={() => api.logout()}
              title="Sign Out"
              className="text-[#98A2B3] hover:text-[#C2413B] transition-colors p-1 ml-1"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* Desktop Left Sidebar */}
        <aside className="w-[240px] shrink-0 border-r border-[#E6EAF0] bg-white hidden md:block py-5 px-3 h-full overflow-y-auto">
          <div className="space-y-6">
            {currentNavGroups.map((group) => (
              <div key={group.group}>
                <p className="px-3 text-[10.5px] font-bold tracking-wider text-[#98A2B3] uppercase mb-1">
                  {group.group}
                </p>
                <nav className="space-y-0.5">
                  {group.items.map((item: any) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-[6px] text-[13px] font-medium transition-colors relative',
                          active
                            ? 'bg-[#FDF7ED] text-[#172033] font-semibold border-l-2 border-[#C98219]'
                            : 'text-[#475467] hover:bg-[#F8FAFC] hover:text-[#172033]',
                          item.highlight && !active && 'text-[#C98219]',
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              active ? 'text-[#C98219]' : item.highlight ? 'text-[#C98219]' : 'text-[#667085]',
                            )}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>

                        {item.liveIndicator && (
                          <span className="flex items-center gap-1 rounded-full bg-[#EAF7EE] px-1.5 py-0.5 text-[9px] font-bold text-[#198754] border border-[#C3E6CB] shrink-0">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#198754] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#198754]"></span>
                            </span>
                            LIVE
                          </span>
                        )}

                        {item.badge && (
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[9.5px] font-bold border',
                              item.badge === 'Live'
                                ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                                : 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]',
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-5 sm:p-7 md:p-9 pb-24 md:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-[#101828]/40 backdrop-blur-[2px]"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white p-5 shadow-elevated">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E6EAF0]">
              <span className="text-[16px] font-bold text-[#172033]">
                Seva<span className="text-[#C98219]">TN</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="text-[#98A2B3] hover:text-[#172033]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {currentNavGroups.map((group) => (
                <div key={group.group}>
                  <p className="px-2 text-[10.5px] font-bold tracking-wider text-[#98A2B3] uppercase mb-1">
                    {group.group}
                  </p>
                  <nav className="space-y-1">
                    {group.items.map((item: any) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2.5 rounded-[7px] text-[13.5px] font-medium',
                          pathname === item.href
                            ? 'bg-[#FDF7ED] text-[#172033] font-semibold border-l-2 border-[#C98219]'
                            : 'text-[#475467] hover:bg-[#F8FAFC]',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-[#C98219]" />
                          <span>{item.name}</span>
                        </div>
                        {item.liveIndicator && (
                          <span className="flex items-center gap-1 rounded-full bg-[#EAF7EE] px-1.5 py-0.5 text-[9px] font-bold text-[#198754] border border-[#C3E6CB]">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#198754] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#198754]"></span>
                            </span>
                            LIVE
                          </span>
                        )}
                        {item.badge && (
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[9.5px] font-bold border',
                              item.badge === 'Live'
                                ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                                : 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]',
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E6EAF0] px-4 py-2 flex items-center justify-around shadow-elevated">
        <Link
          href={homeLink}
          className={cn(
            'flex flex-col items-center gap-1 text-[11px] font-medium py-1',
            pathname === homeLink ? 'text-[#C98219] font-bold' : 'text-[#667085]',
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Home</span>
        </Link>
        <Link
          href={isAdmin ? '/admin/bookings' : isPartner ? '/partner/centres' : '/dashboard/bookings'}
          className={cn(
            'flex flex-col items-center gap-1 text-[11px] font-medium py-1',
            pathname.startsWith('/admin/bookings') || pathname.startsWith('/partner/centres') || pathname.startsWith('/dashboard/bookings')
              ? 'text-[#C98219] font-bold'
              : 'text-[#667085]',
          )}
        >
          <CalendarCheck2 className="h-4 w-4" />
          <span>{isAdmin ? 'Queue' : isPartner ? 'Centres' : 'Bookings'}</span>
        </Link>
        {!isAdmin && !isPartner && (
          <Link
            href="/dashboard/bookings/new"
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-white bg-[#C98219] p-2 rounded-full shadow-subtle -mt-4 hover:bg-[#B57414]"
          >
            <CirclePlus className="h-5 w-5" />
          </Link>
        )}
        <Link
          href={isAdmin ? '/admin/ledger' : isPartner ? '/partner/ledger' : '/dashboard/wallet'}
          className={cn(
            'flex flex-col items-center gap-1 text-[11px] font-medium py-1',
            pathname.startsWith('/admin/ledger') || pathname.startsWith('/partner/ledger') || pathname.startsWith('/dashboard/wallet')
              ? 'text-[#C98219] font-bold'
              : 'text-[#667085]',
          )}
        >
          <Wallet className="h-4 w-4" />
          <span>{isAdmin || isPartner ? 'Ledger' : 'Wallet'}</span>
        </Link>
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center gap-1 text-[11px] font-medium py-1 text-[#667085]"
        >
          <Menu className="h-4 w-4" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};
