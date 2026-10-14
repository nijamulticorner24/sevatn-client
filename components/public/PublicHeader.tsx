'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Menu,
  X,
  ArrowRight,
  Headphones,
  FileText,
  RotateCcw,
  Home,
} from 'lucide-react';

export const PublicHeader: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Our Services', href: '/#services', icon: ShieldCheck },
    { name: 'Contact Us', href: '/contact', icon: Headphones },
    { name: 'Terms & Conditions', href: '/terms-and-conditions', icon: FileText },
    { name: 'Refund Policy', href: '/refund-policy', icon: RotateCcw },
  ];

  return (
    <header className="sticky top-0 z-40 h-[64px] bg-white/95 backdrop-blur-md border-b border-[#E6EAF0] transition-colors">
      <div className="mx-auto max-w-[1280px] h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-[#C98219] rounded-[8px] p-1">
          <img
            src="/logo.png"
            alt="ServiceTN — Powered by NIJA"
            className="h-10 w-auto max-h-[40px] object-contain transition-transform group-hover:scale-[1.02]"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Public Navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-[6px] text-[13px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#C98219] ${
                  isActive
                    ? 'bg-[#FEF7E6] text-[#C98219]'
                    : 'text-[#525252] hover:text-[#171717] hover:bg-[#F8FAFC]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Button & Mobile Toggle */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/auth/login"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-[7px] bg-[#C98219] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#B57414] transition-colors shadow-subtle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C98219]"
          >
            <span>Sign In</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-[6px] text-[#525252] hover:text-[#171717] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#C98219]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E6EAF0] bg-white px-4 pt-3 pb-5 shadow-elevated">
          <nav className="space-y-1" aria-label="Mobile Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[7px] text-[14px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#FEF7E6] text-[#C98219]'
                      : 'text-[#525252] hover:text-[#171717] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Icon className="h-4 w-4 text-[#737373]" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 pt-3 border-t border-[#E6EAF0]">
            <Link
              href="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-[7px] bg-[#C98219] py-2.5 text-[13px] font-bold text-white hover:bg-[#B57414]"
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
