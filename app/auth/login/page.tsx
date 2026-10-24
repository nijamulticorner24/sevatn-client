'use client';

import React, { useState, useEffect } from 'react';
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
  Eye,
  EyeOff,
  KeyRound,
  X,
  Loader2,
  RotateCcw,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'OTP' | 'RESET' | 'SUCCESS'>('REQUEST');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login(identifier, password);
      const userToStore = {
        ...res.user,
        registeredLocation: res.registeredLocation || res.user?.registeredLocation,
        centre: res.centre || res.user?.centre,
      };
      api.setAuth(res.token, userToStore);

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

  const handleOpenForgotModal = () => {
    setForgotIdentifier(identifier || '');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError(null);
    setForgotSuccessMsg(null);
    setForgotStep('REQUEST');
    setForgotModalOpen(true);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your email address or mobile number.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await api.forgotPassword(forgotIdentifier.trim());
      setMaskedEmail(res.emailMasked || forgotIdentifier);
      setForgotSuccessMsg(res.message || 'Verification OTP sent successfully.');
      setForgotStep('OTP');
      setResendCooldown(60);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send OTP code. Please check your credentials.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim() || forgotOtp.trim().length < 6) {
      setForgotError('Please enter the complete 6-digit verification code.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      await api.verifyOtp(forgotIdentifier.trim(), forgotOtp.trim());
      setForgotSuccessMsg('Code verified successfully. Set your new password.');
      setForgotStep('RESET');
    } catch (err: any) {
      setForgotError(err.message || 'Invalid or expired verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please recheck.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await api.resetPassword(
        forgotIdentifier.trim(),
        forgotOtp.trim(),
        forgotNewPassword,
      );
      setForgotSuccessMsg(res.message || 'Password reset successfully!');
      setForgotStep('SUCCESS');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col md:flex-row">
      {/* Left Brand Panel (Desktop) */}
      <div className="md:w-[48%] lg:w-[46%] bg-[#172033] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-r border-[#263550] relative">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2.5 bg-white/95 px-3 py-1.5 rounded-[9px] shadow-sm hover:bg-white transition-colors">
              <img
                src="/logo.png"
                alt="ServiceTN — Powered by NIJA"
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="mt-10">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-[#2B3B59] bg-[#1E2B45] px-3 py-1 text-[11.5px] font-medium text-[#D0D5DD] mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-[#C98219]" />
              <span>Assisted Services Platform</span>
            </div>

            <h2 className="text-[24px] sm:text-[28px] font-bold text-white tracking-tight leading-snug">
              eSevai &amp; Assisted <span className="text-[#C98219]">Services Hub</span>
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
                      <h3 className="text-[13px] font-semibold text-white">Fast Slot &amp; Pass Processing</h3>
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
                      <h3 className="text-[13px] font-semibold text-white">100% Wallet Refund Guarantee</h3>
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
                  className="w-full px-3.5 py-2.5 pr-10 text-[13.5px] rounded-[7px] border border-[#D0D5DD] bg-white focus:outline-none focus:border-[#C98219] focus:ring-1 focus:ring-[#C98219] transition-all"
                />
                <Mail className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-[#98A2B3]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[12.5px] font-semibold text-[#344054]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-[12px] font-semibold text-[#C98219] hover:text-[#B57414] hover:underline transition-colors focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-[13.5px] rounded-[7px] border border-[#D0D5DD] bg-white focus:outline-none focus:border-[#C98219] focus:ring-1 focus:ring-[#C98219] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#98A2B3] hover:text-[#344054] transition-colors focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-[7px] bg-[#C98219] py-2.5 text-[13.5px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal with Resend OTP Flow */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EAECF0] w-full max-w-[460px] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7] bg-[#FAFBFD]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C98219]/10 text-[#C98219] border border-[#C98219]/20">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#172033]">
                    Reset Your Password
                  </h3>
                  <p className="text-[11.5px] text-[#667085]">
                    OTP-based email verification via Resend
                  </p>
                </div>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="text-[#98A2B3] hover:text-[#344054] p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {forgotError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-[#F8C4C2] bg-[#FDECEC] p-3 text-[12px] text-[#992B26] leading-relaxed">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B] mt-0.5" />
                  <div className="flex-1 font-medium">{forgotError}</div>
                </div>
              )}

              {/* STEP 1: Enter Email / Mobile to Request OTP */}
              {forgotStep === 'REQUEST' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-[12.5px] text-[#475467] leading-relaxed">
                    Enter the email address or mobile number linked to your centre or admin account. We will send a 6-digit one-time password (OTP) to your registered email via Resend.
                  </p>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#344054] mb-1">
                      Email Address or Mobile Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="e.g. operator@gmail.com or 9443100001"
                        className="w-full px-3.5 py-2.5 text-[13px] rounded-lg border border-[#D0D5DD] bg-white focus:outline-none focus:border-[#C98219] focus:ring-1 focus:ring-[#C98219]"
                      />
                      <Mail className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-[#98A2B3]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      className="px-4 py-2 text-[12.5px] font-semibold text-[#475467] hover:bg-[#F2F4F7] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-bold text-white bg-[#C98219] hover:bg-[#B57414] rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification OTP</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Enter 6-digit OTP */}
              {forgotStep === 'OTP' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-[12px] text-[#166534] flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A] mt-0.5" />
                    <div>
                      A 6-digit OTP has been dispatched to <strong>{maskedEmail}</strong>. Please check your inbox and spam folder.
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#344054] mb-1">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[10px] text-xl font-bold py-2.5 rounded-lg border border-[#D0D5DD] bg-white font-mono focus:outline-none focus:border-[#C98219] focus:ring-1 focus:ring-[#C98219]"
                    />
                    <div className="flex items-center justify-between text-[11px] text-[#667085] mt-1.5">
                      <span>Code expires in 10 minutes</span>
                      {resendCooldown > 0 ? (
                        <span className="text-[#98A2B3]">Resend in {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={forgotLoading}
                          className="font-semibold text-[#C98219] hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('REQUEST')}
                      className="text-[12px] text-[#667085] hover:text-[#172033] font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" /> Change details
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(false)}
                        className="px-3.5 py-2 text-[12.5px] font-semibold text-[#475467] hover:bg-[#F2F4F7] rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading || forgotOtp.trim().length !== 6}
                        className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-bold text-white bg-[#C98219] hover:bg-[#B57414] rounded-lg shadow-sm transition-colors disabled:opacity-50"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify Code</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* STEP 3: Set New Password */}
              {forgotStep === 'RESET' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-[12px] text-[#475467]">
                    Create a strong, permanent private password with a minimum of 8 characters.
                  </p>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#344054] mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full px-3.5 py-2.5 pr-10 text-[13px] rounded-lg border border-[#D0D5DD] bg-white focus:outline-none focus:border-[#C98219] focus:ring-1 focus:ring-[#C98219]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-3.5 top-3 text-[#98A2B3] hover:text-[#344054]"
                      >
                        {showForgotNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#344054] mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2.5 pr-10 text-[13px] rounded-lg border border-[#D0D5DD] bg-white focus:outline-none focus:border-[#C98219] focus:ring-1 focus:ring-[#C98219]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        className="absolute right-3.5 top-3 text-[#98A2B3] hover:text-[#344054]"
                      >
                        {showForgotConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      className="px-4 py-2 text-[12.5px] font-semibold text-[#475467] hover:bg-[#F2F4F7] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-bold text-white bg-[#198754] hover:bg-[#157347] rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Resetting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 4: Success Message */}
              {forgotStep === 'SUCCESS' && (
                <div className="text-center py-4 space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h4 className="text-[16px] font-bold text-[#172033]">
                    Password Reset Successfully!
                  </h4>
                  <p className="text-[12.5px] text-[#475467] max-w-sm mx-auto">
                    Your password has been securely updated. You can now log into your TicketAssist account using your new credentials.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setForgotModalOpen(false);
                        setIdentifier(forgotIdentifier);
                        setPassword('');
                      }}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#C98219] hover:bg-[#B57414] text-white font-bold text-[13px] shadow-sm transition-colors"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
