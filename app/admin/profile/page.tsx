'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Mail,
  Phone,
  Lock,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  Edit2,
  X,
  ArrowRight,
  RotateCcw,
  Sliders,
  Server,
  Activity,
} from 'lucide-react';

export default function AdminProfilePage() {
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
      .then((data) => {
        setProfile(data);
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

  const user = profile?.user;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[#667085]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C98219]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-[#E6EAF0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#8F5A0D] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5 text-[#C98219]" />
            <span>Platform Governance &bull; Security</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033]">
            Super Administrator Profile
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            System root authority, platform administrative credentials, and verified communication channels.
          </p>
        </div>
        <span className="rounded bg-[#FEF7E6] px-3 py-1 text-xs font-bold text-[#8F5A0D] border border-[#F9DE9B] self-start sm:self-auto uppercase tracking-wider">
          Super Admin Root
        </span>
      </div>

      {/* Main Identity Banner */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B] font-extrabold text-2xl shadow-subtle">
            {user?.name ? user.name[0].toUpperCase() : 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#172033]">
                {user?.name || 'Super Admin'}
              </h2>
              <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10.5px] font-bold text-[#198754] border border-[#C3E6CB]">
                ROOT ACCESS
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Platform Creator &bull; Full Authority &bull; System ID: <span className="font-mono text-secondary-700">{user?.id?.slice(0, 8)}...</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-[11px] text-[#667085] block">Administrative Status</span>
            <span className="font-mono font-bold text-[#198754] flex items-center gap-1 justify-end">
              <span className="h-2 w-2 rounded-full bg-[#198754] animate-pulse" />
              ACTIVE &amp; ENFORCED
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Administrator Credentials & Login Email */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E6EAF0]">
            <UserCheck className="h-4 w-4 text-[#C98219]" />
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Administrator Credentials
            </h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Administrator Name:</span>
              <span className="font-bold text-[#172033]">{user?.name}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Login Email:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#172033] font-bold">{user?.email}</span>
                <button
                  type="button"
                  onClick={handleOpenEmailModal}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-[#8F5A0D] bg-[#FEF7E6] border border-[#F9DE9B] hover:bg-[#FAF3E7] transition-colors cursor-pointer"
                  title="Change Administrator Email"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Change</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Registered Mobile:</span>
              <span className="font-mono text-[#172033]">{user?.mobile}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Security Role:</span>
              <span className="font-mono font-bold text-[#8F5A0D] bg-[#FEF7E6] px-2 py-0.5 rounded border border-[#F9DE9B]">
                {user?.role || 'SUPER_ADMIN'}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-[#667085]">Root Privilege:</span>
              <span className="text-[#198754] font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#198754]" />
                Unrestricted Master Governance
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Security & Communication Policies */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E6EAF0]">
            <ShieldAlert className="h-4 w-4 text-[#C98219]" />
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Security &amp; OTP Verification
            </h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Email Verification Provider:</span>
              <span className="font-bold text-[#172033] flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#C98219]" />
                Resend REST API (Active)
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Credential Encryption:</span>
              <span className="font-mono font-semibold text-[#172033]">AES-256-GCM Master</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Session Type:</span>
              <span className="font-mono text-[#172033]">JWT Signed (7-Day TTL)</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Worker Pairing Enforcement:</span>
              <span className="font-semibold text-[#198754]">Cryptographic 6-Code Handshake</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-[#667085]">Audit Log Enforcement:</span>
              <span className="text-[#198754] font-semibold flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-[#198754]" />
                Full Audit Trail Logged
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Change Modal with Resend OTP */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EAECF0] w-full max-w-[460px] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7] bg-[#FAFBFD]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C98219]/10 text-[#C98219] border border-[#C98219]/20">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#172033]">
                    Change Super Admin Email
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

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {emailError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-[#F8C4C2] bg-[#FDECEC] p-3 text-[12px] text-[#992B26] leading-relaxed">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B] mt-0.5" />
                  <div className="flex-1 font-medium">{emailError}</div>
                </div>
              )}

              {/* STEP 1: Enter New Email */}
              {emailStep === 'INPUT' && (
                <form onSubmit={handleRequestEmailOtp} className="space-y-4">
                  <div className="text-[12.5px] text-[#475467] leading-relaxed">
                    <p className="mb-2">
                      Current Login Email: <strong className="font-mono text-[#172033]">{user?.email}</strong>
                    </p>
                    <p>
                      Enter your new administrator email address below. A 6-digit verification code will be sent to your new email via Resend to verify your address.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#344054] mb-1">
                      New Administrator Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="admin.new@ticketassist.in"
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

              {/* STEP 2: Verify OTP */}
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

              {/* STEP 3: Success Confirmation */}
              {emailStep === 'SUCCESS' && (
                <div className="text-center py-4 space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h4 className="text-[16px] font-bold text-[#172033]">
                    Administrator Email Updated!
                  </h4>
                  <p className="text-[12.5px] text-[#475467] max-w-sm mx-auto">
                    Your Super Administrator login email address has been updated to <strong className="font-mono text-[#172033]">{newEmail}</strong>. You can use this email for future administrative logins.
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
