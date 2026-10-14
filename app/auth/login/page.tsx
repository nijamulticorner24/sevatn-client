'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building2,
  CheckCircle2,
  Wallet,
  BadgePercent,
  RotateCcw,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login(identifier, password);
      api.setAuth(res.token, res.user);

      if (res.mustChangePassword || res.user?.mustChangePassword) {
        router.push('/auth/change-password');
        return;
      }

      if (res.user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (res.user.role === 'PARTNER') {
        router.push('/partner');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col md:flex-row">
      {/* Left Brand Panel (Desktop) */}
      <div className="md:w-[48%] lg:w-[46%] bg-[#172033] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-r border-[#263550] relative">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#C98219] text-white font-bold shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-[19px] font-bold text-white tracking-tight">
                Seva<span className="text-[#C98219]">TN</span>
              </span>
            </Link>
            <span className="rounded-md border border-[#C98219]/40 bg-[#C98219]/15 px-2.5 py-1 text-[11px] font-bold text-[#E5A93C] tracking-wide">
              Powered by NIJA
            </span>
          </div>

          <div className="mt-10">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-[#2B3B59] bg-[#1E2B45] px-3 py-1 text-[11.5px] font-medium text-[#D0D5DD] mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-[#C98219]" />
              <span>Assisted Services Platform</span>
            </div>

            <h2 className="text-[24px] sm:text-[28px] font-bold text-white tracking-tight leading-snug">
              eSevai & Assisted <span className="text-[#C98219]">Services Hub</span>
            </h2>
            <p className="mt-2 text-[13.5px] text-[#98A2B3] leading-relaxed">
              Unified platform for Tamil Nadu eSevai and computer centres providing TicketAssist booking and Instant Service certificate verification.
            </p>

            {/* Core Features */}
            <div className="mt-7 space-y-3">
              {/* Feature 1: Fast Pass Processing */}
              <div className="rounded-[8px] border border-[#263550] bg-[#1C273C] p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#C98219]/20 border border-[#C98219]/40 text-[#FDB022] shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-semibold text-white">Fast Slot & Pass Processing</h3>
                    </div>
                    <p className="mt-1 text-[11.5px] text-[#98A2B3] leading-relaxed">
                      Submit applicant details easily, coordinate slot availability, and download official confirmed booking passes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2: Centre Wallet Management */}
              <div className="rounded-[8px] border border-[#263550] bg-[#1C273C] p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#198754]/20 border border-[#198754]/40 text-[#6CE9A6] shrink-0 mt-0.5">
                    <Wallet className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-semibold text-white">Direct Centre Wallet Management</h3>
                    </div>
                    <p className="mt-1 text-[11.5px] text-[#98A2B3] leading-relaxed">
                      Transparent fee deduction per booked ticket with instant wallet balance tracking and real-time transaction ledger.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3: 100% Wallet Refund Guarantee */}
              <div className="rounded-[8px] border border-[#C98219]/35 bg-gradient-to-r from-[#1C273C] via-[#20293d] to-[#251e15] p-3.5 relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#C98219]/25 border border-[#C98219]/50 text-[#FDB022] shrink-0 mt-0.5 shadow-2xs">
                    <BadgePercent className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[13px] font-semibold text-white">100
                        % Wallet Refund Guarantee</h3>
                      <span className="rounded-full bg-[#C98219]/20 border border-[#C98219]/50 px-2 py-0.5 text-[9.5px] font-extrabold text-[#FDB022] uppercase tracking-wider">
                        100% Refund
                      </span>
                    </div>
                    <p className="mt-1 text-[11.5px] text-[#98A2B3] leading-relaxed">
                      Guaranteed 100% wallet refund on eligible unfulfilled slot holds with zero advance risk and instant automated balance return.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Operational Badges */}
        <div className="mt-8 pt-4 border-t border-[#263550] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#98A2B3] relative z-10">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-[#C98219]" />
            <span>350+ Registered Centres</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#198754]" />
            <span>Verified Pass Assistance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BadgePercent className="h-3.5 w-3.5 text-[#FDB022]" />
            <span>100% Wallet Refund</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#F7F9FC]">
        <div className="w-full max-w-[420px] space-y-6">
          <div>
            <h2 className="text-[24px] font-bold text-[#172033] tracking-tight">
              Sign In to TicketAssist
            </h2>
            <p className="mt-1 text-[13px] text-[#667085]">
              Authorized portal for registered Tamil Nadu centre operators and administrators.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-[8px] border border-[#F8C4C2] bg-[#FDECEC] p-3.5 text-[12.5px] text-[#992B26] leading-relaxed shadow-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B] mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-[#344054] mb-1">
                Email Address or Mobile Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="centre@gmail.com / 9443100001"
                  className="w-full px-3.5 py-2.5 text-[13.5px]"
                />
                <Mail className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-[#98A2B3]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[12.5px] font-semibold text-[#344054]">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-[13.5px]"
                />
                <Lock className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-[#98A2B3]" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-[7px] bg-[#C98219] py-2.5 text-[13.5px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
