'use client';

import React, { useState, useEffect } from 'react';
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
  Eye,
  EyeOff,
  Loader2,
  Check,
} from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const currentUser = api.getUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);

    // Fetch fresh profile from server
    api
      .getMe()
      .then((profile) => {
        if (profile) {
          setUser((prev: any) => ({ ...prev, ...profile, centre: profile.centre || prev?.centre }));
        }
      })
      .catch(() => {});
  }, [router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please retype carefully.');
      return;
    }

    setLoading(true);

    try {
      await api.changePassword(newPassword, currentPassword || undefined);
      api.updateCachedUser({ mustChangePassword: false });

      // Refresh cached user profile
      try {
        const me = await api.getMe();
        if (me) {
          api.updateCachedUser({ ...me, mustChangePassword: false });
        }
      } catch (_) {}

      setSuccess(true);

      // Redirect immediately to appropriate operational dashboard
      setTimeout(() => {
        const role = user?.role || 'CENTRE';
        if (role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else if (role === 'PARTNER') {
          router.push('/partner');
        } else if (role === 'DISTRIBUTOR') {
          router.push('/distributor');
        } else {
          router.push('/dashboard');
        }
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
      setLoading(false);
    }
  };

  const isMinLength = newPassword.length >= 8;
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-[#F7F9FC] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#C98219] text-white font-bold shadow-subtle">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-[22px] font-bold text-[#172033] tracking-tight">
              Ticket<span className="text-[#C98219]">Assist</span>
            </span>
          </Link>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-0.5 text-xs font-bold text-[#8F5A0D]">
              <KeyRound className="h-3.5 w-3.5" />
              <span>Set Permanent Password</span>
            </span>
          </div>
        </div>

        {/* Password Card */}
        <div className="rounded-[14px] border border-[#E6EAF0] bg-white shadow-modal overflow-hidden p-6 sm:p-8">
          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold text-[#C98219] uppercase tracking-wider">
                Private Credentials
              </span>
              <h1 className="text-xl font-bold text-[#172033] mt-1">
                Set Permanent Password
              </h1>
              <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                Your account was provisioned with a temporary administrator password. Please establish your private password to access your dashboard.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-[7px] border border-[#F8C4C2] bg-[#FDECEC] p-3 text-xs text-[#992B26]">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B]" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2.5 rounded-[7px] border border-[#BFE4C9] bg-[#EAF7EE] p-3.5 text-xs text-[#198754]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="font-semibold">Password successfully set! Opening dashboard...</span>
              </div>
            )}

            {!success && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    New Permanent Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2.5 pr-9 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#172033]"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2.5 pr-9 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#172033]"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-3 text-[11px] space-y-1.5">
                  <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-[#198754] font-medium' : 'text-[#667085]'}`}>
                    <Check className={`h-3.5 w-3.5 ${isMinLength ? 'text-[#198754]' : 'text-[#98A2B3]'}`} />
                    <span>At least 8 characters long</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-[#198754] font-medium' : 'text-[#667085]'}`}>
                    <Check className={`h-3.5 w-3.5 ${hasNumberOrSymbol ? 'text-[#198754]' : 'text-[#98A2B3]'}`} />
                    <span>Includes numbers or symbols</span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-[#198754] font-medium' : 'text-[#C2413B]'}`}>
                      <Check className={`h-3.5 w-3.5 ${passwordsMatch ? 'text-[#198754]' : 'text-[#C2413B]'}`} />
                      <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match yet'}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !isMinLength || !passwordsMatch}
                    className="w-full flex items-center justify-center gap-2 rounded-[7px] bg-[#C98219] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#A86B14] transition-colors disabled:opacity-50 shadow-subtle cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Set Password &amp; Continue to Dashboard</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#E6EAF0] text-center text-[11px] text-[#667085] flex items-center justify-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-[#C98219]" />
            <span>TicketAssist Security • Encrypted &amp; Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
