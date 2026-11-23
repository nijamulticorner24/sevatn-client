'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatINR, cn } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import { HeaderMarqueeBar } from '@/components/HeaderMarqueeBar';
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
  History,
  DollarSign,
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
  const [marquee, setMarquee] = useState<{
    enabled: boolean;
    text: string;
    bgColor: string;
    speed: number;
  } | null>(null);

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
    // Fetch public announcement marquee settings
    api.getPublicConfig()
      .then((cfg: any) => {
        if (cfg && cfg.headerMarqueeEnabled && cfg.headerMarqueeText?.trim()) {
          setMarquee({
            enabled: true,
            text: cfg.headerMarqueeText.trim(),
            bgColor: cfg.headerMarqueeBgColor || 'DEFAULT',
            speed: Number(cfg.headerMarqueeSpeed || 30),
          });
        } else {
          setMarquee(null);
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const u = api.getUser();
    setUser(u);
    if (u && !isPublicRoute) {
      if (u.role === 'CENTRE' || u.role === 'DISTRIBUTOR' || u.role === 'PARTNER') {
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

  useEffect(() => {
    const handleWalletRefresh = () => {
      const u = api.getUser();
      if (u && (u.role === 'CENTRE' || u.role === 'DISTRIBUTOR' || u.role === 'PARTNER')) {
        api.getWallet()
          .then(setWallet)
          .catch(() => {});
      }
    };

    window.addEventListener('wallet-refresh', handleWalletRefresh);

    let socket: any = null;
    try {
      socket = getSocket();
      if (socket) {
        socket.on('wallet:updated', (payload: any) => {
          setWallet((prev: any) => ({
            ...prev,
            availableBalance: payload.availableBalance !== undefined ? payload.availableBalance : prev?.availableBalance,
            reservedBalance: payload.reservedBalance !== undefined ? payload.reservedBalance : prev?.reservedBalance,
          }));
        });
      }
    } catch {
      // socket init fallback
    }

    return () => {
      window.removeEventListener('wallet-refresh', handleWalletRefresh);
      if (socket) {
        socket.off('wallet:updated');
      }
    };
  }, []);

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-[#F7F9FC]">
        {marquee && marquee.enabled && (
          <HeaderMarqueeBar
            text={marquee.text}
            bgColor={marquee.bgColor}
            speed={marquee.speed}
          />
        )}
        {children}
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin;
  const isPartner = user?.role === 'PARTNER';
  const isDistributor = user?.role === 'DISTRIBUTOR';

  // 1. Navigation for Super Admin (Platform Creator / Provider)
  const adminNavGroups = [
    {
      group: 'PLATFORM',
      items: [
        { name: 'Operations Overview', href: '/admin', icon: LayoutDashboard },
        { name: 'Platform Settings', href: '/admin/config', icon: SlidersHorizontal },
        { name: 'AI Diagnostics', href: '/admin/diagnostics', icon: BrainCircuit },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Central Queue', href: '/admin/bookings', icon: ListOrdered },
        { name: 'Worker PC Fleet', href: '/admin/fleet', icon: MonitorDot, badge: 'Live' },
      ],
    },
    {
      group: 'NETWORK',
      items: [
        { name: 'Partners Network', href: '/admin/partners', icon: Users },
        { name: 'Distributors Directory', href: '/admin/distributors', icon: Building2 },
        { name: 'Centres Directory', href: '/admin/centres', icon: Building2 },
      ],
    },
    {
      group: 'FINANCE',
      items: [
        { name: 'Pricing & Markups', href: '/admin/pricing', icon: DollarSign },
        { name: 'Partner Payouts', href: '/admin/payouts', icon: BadgeDollarSign },
        { name: 'Financial Split Ledger', href: '/admin/ledger', icon: Receipt },
      ],
    },
    {
      group: 'ACCOUNT',
      items: [
        { name: 'Admin Profile', href: '/admin/profile', icon: UserCheck },
      ],
    },
  ];

  // 2. Navigation for Regional Franchise Partners (PARTNER)
  const partnerNavGroups = [
    {
      group: 'PLATFORM',
      items: [
        { name: 'Dashboard', href: '/partner', icon: LayoutDashboard },
      ],
    },
    {
      group: 'NETWORK',
      items: [
        { name: 'Distributors', href: '/partner/distributors', icon: Users },
        { name: 'Centres', href: '/partner/centres', icon: Building2 },
        { name: 'Invitations', href: '/partner/invitations', icon: UserPlus },
      ],
    },
    {
      group: 'FINANCE',
      items: [
        { name: 'Wallet & Topup', href: '/partner/wallet', icon: Wallet },
        { name: 'Ticket Markup', href: '/partner/markup', icon: DollarSign },
        { name: 'Payouts', href: '/partner/payouts', icon: BadgeDollarSign },
        { name: 'Ledger', href: '/partner/ledger', icon: Receipt },
      ],
    },
    {
      group: 'ACCOUNT',
      items: [
        { name: 'Partner Profile', href: '/partner/profile', icon: UserCheck },
      ],
    },
  ];

  // 2b. Navigation for Subordinate Distributors (DISTRIBUTOR)
  const distributorNavGroups = [
    {
      group: 'PLATFORM',
      items: [
        { name: 'Dashboard', href: '/distributor', icon: LayoutDashboard },
      ],
    },
    {
      group: 'SERVICES & BOOKINGS',
      items: [
        { name: 'New Ticket Booking', href: '/distributor/bookings/new', icon: CirclePlus, highlight: true },
        { name: 'Booking Queue', href: '/distributor/bookings', icon: Timer },
      ],
    },
    {
      group: 'NETWORK',
      items: [
        { name: 'Centres', href: '/distributor/centres', icon: Building2 },
      ],
    },
    {
      group: 'FINANCE',
      items: [
        { name: 'Wallet & Topup', href: '/distributor/wallet', icon: Wallet },
        { name: 'Wallet History', href: '/distributor/wallet/history', icon: History },
        { name: 'Ticket Markup', href: '/distributor/markup', icon: DollarSign },
        { name: 'Earnings & Payouts', href: '/distributor/payouts', icon: BadgeDollarSign },
      ],
    },
    {
      group: 'ACCOUNT',
      items: [
        { name: 'Distributor Profile', href: '/distributor/profile', icon: UserCheck },
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
      group: 'OPERATIONS',
      items: [
        {
          name: 'TicketAssist',
          href: '/dashboard/ticket-assist',
          icon: ShieldCheck,
          liveIndicator: true,
        },
        { name: 'Booking Queue', href: '/dashboard/bookings', icon: Timer },
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
    : isDistributor
    ? distributorNavGroups
    : centreNavGroups;

  const homeLink = isAdmin ? '/admin' : isPartner ? '/partner' : isDistributor ? '/distributor' : '/dashboard';

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#F7F9FC]">
      {/* Site Header Top Marquee Announcement Bar */}
      {marquee && marquee.enabled && (
        <HeaderMarqueeBar
          text={marquee.text}
          bgColor={marquee.bgColor}
          speed={marquee.speed}
        />
      )}

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
            {(isSuperAdmin || isPartner || isDistributor) && (
              <span className="rounded bg-[#FEF7E6] px-1.5 py-0.5 text-[9.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                {isSuperAdmin
                  ? 'SUPER ADMIN'
                  : isPartner
                  ? 'PARTNER PORTAL'
                  : 'DISTRIBUTOR'}
              </span>
            )}
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live WebSocket Status Pill */}
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors bg-[#EAF7EE] text-[#198754] border-[#C3E6CB] shrink-0 whitespace-nowrap"
            title="Real-Time Network Sync Connected"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#198754] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#198754]"></span>
            </span>
            <span className="uppercase tracking-wider font-mono">LIVE SYNC</span>
          </div>

          {/* GPS Verification Badge for Centre Operators */}
          {!isAdmin && !isPartner && !isDistributor && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold border bg-[#EAF7EE] text-[#155724] border-[#C3E6CB]"
              title="GPS Geofencing Guard Active: Booking operations verified within 5 KM registered radius"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#198754] animate-pulse" />
              <span>GEOFENCE LOCKED</span>
            </div>
          )}

          {/* Wallet Balance Pill with Direct Quick Recharge (+) for Centre Operators, Distributors & Partners */}
          {(user?.role === 'CENTRE' || user?.role === 'DISTRIBUTOR' || user?.role === 'PARTNER') && (
            <div className="flex items-center rounded-[7px] border border-[#E4E7EC] bg-[#F8FAFC] pl-3 pr-1 py-1 text-[13px] font-semibold text-[#172033] shadow-xs hover:border-[#C98219]/40 transition-colors">
              <Link
                href={isPartner ? '/partner/wallet' : isDistributor ? '/distributor/wallet' : '/dashboard/wallet'}
                className="flex items-center gap-2 mr-2 hover:text-[#C98219] transition-colors"
                title="View Wallet Ledger & History"
              >
                <Wallet className="h-3.5 w-3.5 text-[#C98219] shrink-0" />
                <span className="tabular-nums font-bold">
                  {wallet ? formatINR(wallet.availableBalance) : '🪙 0.00'}
                </span>
                {wallet && Number(wallet.reservedBalance) > 0 && (
                  <span className="hidden sm:inline-block text-[11px] font-normal text-[#667085] border-l border-[#D0D5DD] pl-2 tabular-nums">
                    {formatINR(wallet.reservedBalance)} hold
                  </span>
                )}
              </Link>
              <Link
                href={isPartner ? '/partner/wallet' : isDistributor ? '/distributor/wallet' : '/dashboard/wallet'}
                className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#C98219] hover:bg-[#B57414] text-white transition-colors shadow-2xs"
                title="Add Funds / Top-Up Wallet"
              >
                <CirclePlus className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Notifications Shortcut for Centre Operators */}
          {!isAdmin && !isPartner && !isDistributor && (
            <Link
              href="/dashboard/notifications"
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#E4E7EC] bg-white text-[#475467] hover:text-[#172033] hover:bg-[#F8FAFC] transition-colors relative"
              title="View Centre Notifications"
            >
              <Bell className="h-4 w-4" />
            </Link>
          )}

          {/* User Profile Summary */}
          <div className="flex items-center gap-2 border-l border-[#E4E7EC] pl-2.5 sm:pl-3">
            <Link
              href={
                isSuperAdmin
                  ? '/admin/profile'
                  : isPartner
                  ? '/partner/profile'
                  : isDistributor
                  ? '/distributor/profile'
                  : '/dashboard/profile'
              }
              className="flex items-center gap-2 hover:opacity-85 transition-opacity"
              title="View Account Profile & Settings"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDF7ED] border border-[#E8D5B7] text-[12px] font-bold text-[#7A4A12] shrink-0 shadow-2xs">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-[12.5px] font-bold text-[#172033] leading-tight truncate max-w-[130px]">
                  {user?.name || (isSuperAdmin ? 'Super Admin' : isPartner ? 'Partner Manager' : isDistributor ? 'Distributor' : 'Operator')}
                </p>
                <p className="text-[10.5px] text-[#667085] leading-tight truncate max-w-[130px]">
                  {user?.role === 'CENTRE'
                    ? user?.centre?.centreName || 'Seva Centre'
                    : user?.role === 'PARTNER'
                    ? 'Franchise Partner'
                    : user?.role === 'DISTRIBUTOR'
                    ? 'Regional Distributor'
                    : user?.role === 'SUPER_ADMIN'
                    ? 'Platform Creator'
                    : 'Platform User'}
                </p>
              </div>
            </Link>

            <button
              onClick={() => api.logout()}
              title="Sign Out"
              className="text-[#98A2B3] hover:text-[#C2413B] transition-colors p-1.5 rounded hover:bg-[#FDECEC]/50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* Desktop Left Sidebar */}
        <aside className="w-[260px] shrink-0 border-r border-[#E6EAF0] bg-white hidden md:block py-5 px-3.5 h-full overflow-y-auto">
          <div className="space-y-6">
            {isPartner && (
              <div className="px-3 pb-3 border-b border-[#E6EAF0]">
                <p className="text-[10px] font-extrabold tracking-wider text-[#C98219] uppercase">
                  PARTNER PORTAL
                </p>
                <p className="text-[12px] font-bold text-[#172033] truncate mt-0.5">
                  {user?.partner?.name || user?.name || 'Regional Franchise'}
                </p>
                {user?.partner?.partnerCode && (
                  <span className="inline-block mt-1 font-mono text-[9.5px] font-bold text-[#8F5A0D] bg-[#FEF7E6] px-1.5 py-0.5 rounded border border-[#F9DE9B]">
                    {user?.partner?.partnerCode}
                  </span>
                )}
              </div>
            )}
            {isDistributor && (
              <div className="px-3 pb-3 border-b border-[#E6EAF0]">
                <p className="text-[10px] font-extrabold tracking-wider text-[#175CD3] uppercase">
                  DISTRIBUTOR PORTAL
                </p>
                <p className="text-[12px] font-bold text-[#172033] truncate mt-0.5">
                  {user?.distributor?.businessName || user?.distributor?.name || user?.name || 'Regional Distributor'}
                </p>
                {user?.distributor?.distributorCode && (
                  <span className="inline-block mt-1 font-mono text-[9.5px] font-bold text-[#175CD3] bg-[#EFF8FF] px-1.5 py-0.5 rounded border border-[#B2DDFF]">
                    {user?.distributor?.distributorCode}
                  </span>
                )}
              </div>
            )}
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

            {/* Logout button in sidebar */}
            <div className="pt-3 border-t border-[#F0F3F7]">
              <button
                type="button"
                onClick={() => api.logout()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium text-[#C2413B] hover:bg-[#FDECEC] transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0 text-[#C2413B]" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-7 pb-20">
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
              <div>
                <span className="text-[16px] font-bold text-[#172033]">
                  Seva<span className="text-[#C98219]">TN</span>
                </span>
                {isPartner && (
                  <p className="text-[10px] font-bold text-[#C98219] uppercase tracking-wider">
                    PARTNER PORTAL
                  </p>
                )}
                {isDistributor && (
                  <p className="text-[10px] font-bold text-[#175CD3] uppercase tracking-wider">
                    DISTRIBUTOR PORTAL
                  </p>
                )}
              </div>
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

              <div className="pt-3 border-t border-[#F0F3F7]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    api.logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-[13.5px] font-medium text-[#C2413B] hover:bg-[#FDECEC]"
                >
                  <LogOut className="h-4 w-4 text-[#C2413B]" />
                  <span>Logout</span>
                </button>
              </div>
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
          href={
            isAdmin
              ? '/admin/bookings'
              : isPartner
              ? '/partner/centres'
              : isDistributor
              ? '/distributor/bookings'
              : '/dashboard/bookings'
          }
          className={cn(
            'flex flex-col items-center gap-1 text-[11px] font-medium py-1',
            pathname.startsWith('/admin/bookings') ||
              pathname.startsWith('/partner/centres') ||
              pathname.startsWith('/distributor/bookings') ||
              pathname.startsWith('/dashboard/bookings')
              ? 'text-[#C98219] font-bold'
              : 'text-[#667085]',
          )}
        >
          <CalendarCheck2 className="h-4 w-4" />
          <span>{isAdmin ? 'Queue' : isPartner ? 'Centres' : 'Bookings'}</span>
        </Link>
        {(user?.role === 'CENTRE' || user?.role === 'DISTRIBUTOR') && (
          <Link
            href={isDistributor ? '/distributor/bookings/new' : '/dashboard/bookings/new'}
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-white bg-[#C98219] p-2 rounded-full shadow-subtle -mt-4 hover:bg-[#B57414]"
            title="Create New Booking"
          >
            <CirclePlus className="h-5 w-5" />
          </Link>
        )}
        <Link
          href={
            isAdmin
              ? '/admin/ledger'
              : isPartner
              ? '/partner/wallet'
              : isDistributor
              ? '/distributor/wallet'
              : '/dashboard/wallet'
          }
          className={cn(
            'flex flex-col items-center gap-1 text-[11px] font-medium py-1',
            pathname.startsWith('/admin/ledger') ||
              pathname.startsWith('/partner/wallet') ||
              pathname.startsWith('/partner/payouts') ||
              pathname.startsWith('/partner/ledger') ||
              pathname.startsWith('/distributor/wallet') ||
              pathname.startsWith('/distributor/payouts') ||
              pathname.startsWith('/distributor/markup') ||
              pathname.startsWith('/dashboard/wallet')
              ? 'text-[#C98219] font-bold'
              : 'text-[#667085]',
          )}
        >
          <Wallet className="h-4 w-4" />
          <span>{isAdmin ? 'Ledger' : 'Wallet'}</span>
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
