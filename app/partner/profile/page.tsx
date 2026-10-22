'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  Building2,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Edit2,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export default function PartnerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Email Change State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<'INPUT' | 'OTP' | 'SUCCESS'>('INPUT');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const loadProfile = () => {
    api.getMe()
      .then((res) => {
        setProfile(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const interval = setInterval(() => {
      setEmailCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [emailCooldown]);

  const handleOpenEmailModal = () => {
    setNewEmail('');
    setEmailOtp('');
    setEmailError(null);
    setEmailSuccessMsg(null);
    setEmailStep('INPUT');
    setEmailModalOpen(true);
  };

  const handleRequestEmailOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailLoading(true);
    setEmailError(null);
    try {
      const res = await api.requestEmailChange(newEmail.trim());
      setEmailSuccessMsg(res.message || `Verification code sent to ${newEmail}`);
      setEmailStep('OTP');
      setEmailCooldown(60);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send OTP to new email address.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtp.trim() || emailOtp.trim().length < 6) {
      setEmailError('Please enter the 6-digit verification code.');
      return;
    }
    setEmailLoading(true);
    setEmailError(null);
    try {
      const res = await api.verifyEmailChange(newEmail.trim(), emailOtp.trim());
      setEmailSuccessMsg(res.message || 'Email updated successfully!');
      setEmailStep('SUCCESS');
      loadProfile();
      const current = api.getUser();
      if (current) {
        api.updateCachedUser({ email: newEmail.trim() });
      }
    } catch (err: any) {
      setEmailError(err.message || 'Invalid or expired OTP.');
    } finally {
      setEmailLoading(false);
    }
  };

  const partner = profile?.partner;
  const user = profile?.user;

  if (loading) {
    return <div className="h-64 rounded-[10px] bg-white border border-[#E6EAF0] animate-pulse" />;
  }

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
          <Users className="h-4 w-4" />
          <span>Franchise Information</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#172033]">
          Partner Profile &amp; Jurisdiction
        </h1>
        <p className="text-xs text-[#667085] mt-1">
          Authorized distributor details and territory jurisdiction settings for SevaTN.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle space-y-6">
        <div className="flex items-center gap-4 pb-5 border-b border-[#E6EAF0]">
          <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B] font-extrabold text-xl">
            {partner?.partnerCode || 'PT'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#172033]">
                {partner?.name || 'NIJA Digital Network'}
              </h2>
              <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                VERIFIED PARTNER
              </span>
            </div>
            <p className="text-xs font-mono text-[#8F5A0D] font-bold mt-0.5">
              Code: {partner?.partnerCode || 'PT-001'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-[8px] bg-[#F8FAFC] p-4 border border-[#E6EAF0] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[#667085] font-medium">Partner Contact Email</span>
              <button
                type="button"
                onClick={handleOpenEmailModal}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C98219] hover:underline"
              >
                <Edit2 className="h-3 w-3" />
                <span>Change</span>
              </button>
            </div>
            <p className="text-sm font-bold text-[#172033] mt-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#C98219] shrink-0" />
              <span className="truncate">{user?.email || partner?.email || 'partner@nija.in'}</span>
            </p>
          </div>

          <div className="rounded-[8px] bg-[#F8FAFC] p-4 border border-[#E6EAF0]">
            <span className="text-[#667085] font-medium">Partner Mobile Number</span>
            <p className="text-sm font-bold text-[#172033] mt-2 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#C98219] shrink-0" />
              <span>{user?.mobile || partner?.mobile || '9443199999'}</span>
            </p>
          </div>

          <div className="rounded-[8px] bg-[#F8FAFC] p-4 border border-[#E6EAF0]">
            <span className="text-[#667085] font-medium">Assigned Territory District</span>
            <p className="text-sm font-bold text-[#172033] mt-1 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#198754]" />
              {partner?.district || 'Chennai'}
            </p>
          </div>

          <div className="rounded-[8px] bg-[#F8FAFC] p-4 border border-[#E6EAF0]">
            <span className="text-[#667085] font-medium">Assigned Taluk Jurisdiction</span>
            <p className="text-sm font-bold text-[#172033] mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#C98219]" />
              {partner?.taluk || 'Guindy'}
            </p>
          </div>
        </div>

        {/* Commission Terms */}
        <div className="rounded-[8px] border border-[#F9DE9B] bg-[#FEF7E6] p-4 text-xs">
          <p className="font-bold text-[#172033] flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#C98219]" />
            Official Franchise Agreement &amp; Terms
          </p>
          <p className="text-[#8F5A0D] mt-1 leading-relaxed">
            As an Authorized Partner enrolled on the <strong>{partner?.commissionSlab || 'STANDARD'}</strong> slab, you receive a franchise commission of <strong>{partner?.commissionPercentage || 20}%</strong> (currently ₹{Number(partner?.commissionRate || 20).toFixed(2)} based on the booking service fee) for every Virtual-Q Darshan booking executed by eSevai centres in your network. Settlements are processed directly to your registered bank account.
          </p>
        </div>
      </div>

      {/* Email Change Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EAECF0] w-full max-w-[460px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7] bg-[#FAFBFD]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C98219]/10 text-[#C98219] border border-[#C98219]/20">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#172033]">
                    Change Email Address
                  </h3>
                  <p className="text-[11.5px] text-[#667085]">
                    OTP verification via Resend API
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="text-[#98A2B3] hover:text-[#344054] p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {emailError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-[#F8C4C2] bg-[#FDECEC] p-3 text-[12px] text-[#992B26] leading-relaxed">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B] mt-0.5" />
                  <div className="flex-1 font-medium">{emailError}</div>
                </div>
              )}

              {emailStep === 'INPUT' && (
                <form onSubmit={handleRequestEmailOtp} className="space-y-4">
                  <div className="text-[12.5px] text-[#475467] leading-relaxed">
                    <p className="mb-2">
                      Current Login Email: <strong className="font-mono text-[#172033]">{user?.email || partner?.email}</strong>
                    </p>
                    <p>
                      Enter your new email address below. A 6-digit verification code will be sent to your new email via Resend to verify your address.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#344054] mb-1">
                      New Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="newpartner@gmail.com"
                        className="w-full px-3.5 py-2.5 text-[13px] rounded-lg border border-[#D0D5DD] bg-white focus:outline-none focus:border-[#C98219] focus:ring-1 focus:ring-[#C98219]"
                      />
                      <Mail className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-[#98A2B3]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setEmailModalOpen(false)}
                      className="px-4 py-2 text-[12.5px] font-semibold text-[#475467] hover:bg-[#F2F4F7] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={emailLoading}
                      className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-bold text-white bg-[#C98219] hover:bg-[#B57414] rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {emailLoading ? (
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

              {emailStep === 'OTP' && (
                <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                  <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-[12px] text-[#166534] flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A] mt-0.5" />
                    <div>
                      A 6-digit OTP has been sent to <strong>{newEmail}</strong>. Please check your inbox and enter the code below.
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
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[10px] text-xl font-bold py-2.5 rounded-lg border border-[#D0D5DD] bg-white font-mono focus:outline-none focus:border-[#C98219] focus:ring-1 focus:ring-[#C98219]"
                    />
                    <div className="flex items-center justify-between text-[11px] text-[#667085] mt-1.5">
                      <span>Code expires in 10 minutes</span>
                      {emailCooldown > 0 ? (
                        <span className="text-[#98A2B3]">Resend in {emailCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequestEmailOtp()}
                          disabled={emailLoading}
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
                      onClick={() => setEmailStep('INPUT')}
                      className="text-[12px] text-[#667085] hover:text-[#172033] font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" /> Change new email
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEmailModalOpen(false)}
                        className="px-3.5 py-2 text-[12.5px] font-semibold text-[#475467] hover:bg-[#F2F4F7] rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={emailLoading || emailOtp.trim().length !== 6}
                        className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-bold text-white bg-[#198754] hover:bg-[#157347] rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {emailLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Verify &amp; Update Email</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {emailStep === 'SUCCESS' && (
                <div className="text-center py-4 space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h4 className="text-[16px] font-bold text-[#172033]">
                    Email Address Updated!
                  </h4>
                  <p className="text-[12.5px] text-[#475467] max-w-sm mx-auto">
                    Your login email address has been successfully updated to <strong className="font-mono text-[#172033]">{newEmail}</strong>. You can use this email for future sign-ins.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setEmailModalOpen(false)}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#C98219] hover:bg-[#B57414] text-white font-bold text-[13px] shadow-sm transition-colors cursor-pointer"
                    >
                      Done
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
