'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="border-t border-[#E6EAF0] bg-white text-[#171717] mt-auto">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#C98219] text-white font-bold shadow-subtle">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <span className="text-[17px] font-extrabold text-[#171717] tracking-tight">
                Seva<span className="text-[#C98219]">TN</span>
              </span>
              <span className="rounded-full bg-[#FEF7E6] px-2.5 py-0.5 text-[10.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                Powered by NIJA
              </span>
            </div>

            <p className="text-[13.5px] text-[#525252] leading-relaxed max-w-md">
              Your Services. One Simple Platform. Convenient digital service hub providing guided booking assistance and digital service access.
            </p>
          </div>

          {/* Platform Navigation */}
          <div>
            <h3 className="text-[12px] font-bold text-[#171717] uppercase tracking-wider mb-3">
              Platform & Access
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link
                  href="/"
                  className="text-[#525252] hover:text-[#C98219] transition-colors inline-flex items-center gap-1"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/#services"
                  className="text-[#525252] hover:text-[#C98219] transition-colors inline-flex items-center gap-1"
                >
                  Our Services
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="text-[#525252] hover:text-[#C98219] transition-colors inline-flex items-center gap-1"
                >
                  Sign In
                  <ArrowUpRight className="h-3 w-3 text-[#9CA3AF]" />
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-[#525252] hover:text-[#C98219] transition-colors inline-flex items-center gap-1"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div>
            <h3 className="text-[12px] font-bold text-[#171717] uppercase tracking-wider mb-3">
              Legal & Policies
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link
                  href="/terms-and-conditions"
                  className="text-[#525252] hover:text-[#C98219] transition-colors"
                >
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-[#525252] hover:text-[#C98219] transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-[#525252] hover:text-[#C98219] transition-colors inline-flex items-center gap-1"
                >
                  Grievance Redressal
                  <ArrowUpRight className="h-3 w-3 text-[#9CA3AF]" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="mt-10 pt-6 border-t border-[#E6EAF0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#737373]">
          <p>
            © {new Date().getFullYear()} SevaTN — Powered by NIJA. All rights reserved.
          </p>
          <p className="text-[11.5px] text-[#9CA3AF]">
            Your Services. One Simple Platform.
          </p>
        </div>
      </div>
    </footer>
  );
};
