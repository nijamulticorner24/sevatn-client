'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';

export default function RegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediate safe redirect to login
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-[520px] text-center">
        {/* Brand */}
        <div className="inline-flex items-center gap-2.5 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#C98219] text-white font-bold shadow-subtle">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-[20px] font-bold text-[#172033] tracking-tight">
            Ticket<span className="text-[#C98219]">Assist</span>
          </span>
        </div>

        {/* Card */}
        <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-8 shadow-subtle text-center space-y-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF7E6] border border-[#F9DE9B] text-[#8F5A0D]">
            <Lock className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-[19px] font-bold text-[#172033]">
              Admin-Authorized Centre Onboarding
            </h1>
            <p className="mt-2 text-[13.5px] text-[#667085] leading-relaxed">
              Centre accounts are provisioned exclusively by authorized TicketAssist administrators.
              Please contact your platform administrator for centre onboarding credentials.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-[7px] bg-[#C98219] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="text-[11.5px] text-[#98A2B3]">
            Redirecting to sign in portal...
          </p>
        </div>
      </div>
    </div>
  );
}
