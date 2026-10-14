'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '../lib/api';
import { formatINR } from '../lib/utils';
import {
  Wallet,
  ShieldCheck,
  LogOut,
  LocateFixed,
  Bolt,
  ChevronLeft,
} from 'lucide-react';


export const Navbar = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [locationActive, setLocationActive] = useState(false);

  useEffect(() => {
    const u = api.getUser();
    setUser(u);
    if (u) {
      api.getWallet()
        .then(setWallet)
        .catch(() => {});

      // Attempt to capture browser geolocation for 5 KM access control
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            api.setLocationCoordinates(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.accuracy,
            );
            setLocationActive(true);
          },
          (err) => {
            console.info('Browser geolocation note:', err.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
      }
    }
  }, []);

  // Context-aware brand detection
  const isTicketAssistContext =
    pathname?.startsWith('/dashboard/ticket-assist') ||
    pathname?.startsWith('/dashboard/bookings') ||
    pathname?.startsWith('/dashboard/wallet') ||
    pathname?.startsWith('/dashboard/refunds');

  const isInstantServiceContext = pathname?.startsWith('/dashboard/instant-service');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E6EAF0] bg-white/95 backdrop-blur-md shadow-subtle">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Context-Aware Brand Logo */}
        <div className="flex items-center gap-3">
          {isTicketAssistContext ? (
            <Link href="/dashboard/bookings/new" className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="ServiceTN"
                className="h-9 w-auto max-h-[36px] object-contain"
              />
              <span className="rounded bg-[#FEF7E6] px-1.5 py-0.5 text-[10px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                TicketAssist
              </span>
            </Link>
          ) : isInstantServiceContext ? (
            <Link href="/dashboard/instant-service" className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="ServiceTN"
                className="h-9 w-auto max-h-[36px] object-contain"
              />
              <span className="rounded bg-[#FEF7E6] px-1.5 py-0.5 text-[10px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                Instant Verification
              </span>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="ServiceTN — Powered by NIJA"
                className="h-9 w-auto max-h-[38px] object-contain"
              />
            </Link>
          )}
        </div>

        {/* Right Section / User & Wallet Info */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <>
              {/* Back to Platform Home Link if inside a specific service */}
              {(isTicketAssistContext || isInstantServiceContext) && (
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-1 rounded-[7px] border border-[#E6EAF0] bg-[#F7F9FC] px-2.5 py-1.5 text-xs text-[#475467] hover:text-[#172033] hover:bg-[#F0F3F8] transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Platform Home</span>
                </Link>
              )}

              {/* Geofence Status Pill */}
              <div
                title={locationActive ? 'Location context active (5 KM geofence validated)' : 'Location pending GPS capture'}
                className="hidden md:flex items-center gap-1.5 rounded-[7px] border border-[#E6EAF0] bg-[#F8FAFC] px-2.5 py-1 text-xs text-[#475467]"
              >
                <LocateFixed className={`h-3.5 w-3.5 ${locationActive ? 'text-[#198754]' : 'text-[#C98219]'}`} />

                <span className="text-[11px] font-medium">{locationActive ? '5 KM Validated' : 'GPS Ready'}</span>
              </div>

              {/* Wallet Pill */}
              <Link
                href="/dashboard/wallet"
                className="flex items-center gap-2 rounded-[7px] border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1.5 text-sm font-semibold text-[#8F5A0D] transition-all hover:bg-[#FAF3E7]"
              >
                <Wallet className="h-4 w-4 text-[#C98219]" />
                <span className="tabular-nums">{wallet ? formatINR(wallet.availableBalance) : '₹---'}</span>
                {wallet && Number(wallet.reservedBalance) > 0 && (
                  <span className="text-xs text-[#8F5A0D]/80 border-l border-[#F9DE9B] pl-1.5 tabular-nums">
                    ({formatINR(wallet.reservedBalance)} res)
                  </span>
                )}
              </Link>

              {/* User Dropdown / Badge */}
              <div className="flex items-center gap-2.5 rounded-[7px] border border-[#E6EAF0] bg-white px-3 py-1.5 shadow-subtle">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FEF7E6] text-xs font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#172033] truncate max-w-[120px]">{user.name}</p>
                  <p className="text-[10px] text-[#667085] uppercase tracking-wider">{user.role}</p>
                </div>
                <button
                  onClick={() => api.logout()}
                  title="Logout"
                  className="text-[#98A2B3] hover:text-[#C2413B] transition-colors p-1"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="rounded-[7px] bg-[#C98219] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#B57414] transition-colors shadow-subtle"
              >
                Sign In
              </Link>
              <span className="text-xs text-[#667085] border border-[#E6EAF0] rounded-[7px] px-2.5 py-1.5 bg-[#F8FAFC]">
                Partner Invitation Only
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
