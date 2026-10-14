'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please retype carefully.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.changePassword(newPassword, currentPassword || undefined);
      api.updateCachedUser({ mustChangePassword: false });
      setSuccess(true);

      setTimeout(() => {
        const user = api.getUser();
        if (user?.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-[460px]">
        {/* Brand */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#C98219] text-white font-bold shadow-subtle">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-[20px] font-bold text-[#172033] tracking-tight">
              Ticket<span className="text-[#C98219]">Assist</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 mt-3 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-0.5 text-[11.5px] font-bold text-[#8F5A0D]">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Account Activation & Security</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-7 shadow-subtle space-y-5">
          <div>
            <h1 className="text-[20px] font-bold text-[#172033] tracking-tight">
              Set Your Permanent Password
            </h1>
            <p className="mt-1 text-[13px] text-[#667085] leading-relaxed">
              Your centre account was activated with a temporary administrator credential. Please create a permanent private password to continue.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-[7px] border border-[#F8C4C2] bg-[#FDECEC] p-3 text-[12.5px] text-[#992B26]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B]" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 rounded-[7px] border border-[#BFE4C9] bg-[#EAF7EE] p-3 text-[12.5px] text-[#198754]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Password successfully updated! Redirecting to dashboard...</span>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-semibold text-[#344054] mb-1">
                  New Permanent Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2.5 text-[13.5px]"
                  />
                  <Lock className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-[#98A2B3]" />
                </div>
                <p className="mt-1 text-[11px] text-[#667085]">
                  Must be at least 8 characters long.
                </p>
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-[#344054] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2.5 text-[13.5px]"
                  />
                  <Lock className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-[#98A2B3]" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-[7px] bg-[#C98219] py-2.5 text-[13.5px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle disabled:opacity-50"
                >
                  {loading ? 'Securing Account...' : 'Set Password & Enter Dashboard'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center mt-5">
          <p className="text-[12px] text-[#98A2B3]">
            TicketAssist Official Security • Powered by NIJA ESEVAI
          </p>
        </div>
      </div>
    </div>
  );
}
