'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Building2,
  Users,
  Briefcase,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  Loader2,
  QrCode,
  Copy,
  UploadCloud,
  FileText,
  CreditCard,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<'PASSWORD' | 'PAYMENT' | 'PENDING_APPROVAL'>('PASSWORD');
  const [feeConfig, setFeeConfig] = useState<any>({
    serviceFee: 100,
    registrationFee: 249,
    distributorFee: 399,
    franchiseFee: 599,
    partnerMinWithdrawal: 100,
    onlinePaymentEnabled: true,
    offlinePaymentEnabled: true,
    offlineUpiId: 'pay.ticketassist@okaxis',
    offlineAccountName: 'TicketAssist Services & Network',
    offlineBankName: 'HDFC Bank',
    offlineAccountNumber: '50200012345678',
    offlineIfscCode: 'HDFC0001234',
    offlinePaymentInstructions: 'Scan the official QR code or pay via UPI. Enter your 12-digit UTR/Reference ID for instant validation.',
  });
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Payment State
  const [selectedMethod, setSelectedMethod] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [paymentReference, setPaymentReference] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentUser = api.getUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);

    // Fetch live Platform Financial Fee & Payment Config
    api
      .getPublicPaymentConfig()
      .then((cfg) => {
        if (cfg) {
          setFeeConfig({
            serviceFee: Number(cfg.serviceFee || 100),
            registrationFee: Number(cfg.registrationFee || 249),
            distributorFee: Number(cfg.distributorFee || 399),
            franchiseFee: Number(cfg.franchiseFee || 599),
            partnerMinWithdrawal: Number(cfg.partnerMinWithdrawal || 100),
            onlinePaymentEnabled: cfg.onlinePaymentEnabled !== false,
            offlinePaymentEnabled: cfg.offlinePaymentEnabled !== false,
            offlineUpiId: cfg.offlineUpiId || 'pay.ticketassist@okaxis',
            offlineAccountName: cfg.offlineAccountName || 'TicketAssist Services & Network',
            offlineQrImageUrl: cfg.offlineQrImageUrl || null,
            offlineBankName: cfg.offlineBankName || 'HDFC Bank',
            offlineAccountNumber: cfg.offlineAccountNumber || '50200012345678',
            offlineIfscCode: cfg.offlineIfscCode || 'HDFC0001234',
            offlinePaymentInstructions: cfg.offlinePaymentInstructions || 'Scan the official QR code or pay via UPI. Enter your 12-digit UTR/Reference ID for instant validation.',
          });

          if (!cfg.offlinePaymentEnabled && cfg.onlinePaymentEnabled) {
            setSelectedMethod('ONLINE');
          }
        }
      })
      .catch((err) => console.error('Failed to load fee configuration:', err))
      .finally(() => setLoadingConfig(false));

    // Fetch fresh profile from server to ensure accurate feePaid and centre data
    api
      .getMe()
      .then((profile) => {
        if (profile) {
          setUser((prev: any) => ({ ...prev, ...profile, centre: profile.centre || prev?.centre }));
        }
      })
      .catch(() => {});
  }, [router]);

  const role = user?.role || 'CENTRE';

  const payableAmount =
    role === 'DISTRIBUTOR'
      ? Number(user?.distributorProfile?.distributorFee || feeConfig?.distributorFee || 399)
      : role === 'PARTNER'
      ? Number(user?.partnerProfile?.franchiseFee || feeConfig?.franchiseFee || 599)
      : Number(user?.centre?.registrationFee || feeConfig?.registrationFee || 249);

  const upiId = feeConfig?.offlineUpiId || 'pay.ticketassist@okaxis';
  const accountName = feeConfig?.offlineAccountName || 'TicketAssist Services & Network';
  const qrCodeUrl =
    feeConfig?.offlineQrImageUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
      `upi://pay?pa=${upiId}&pn=${encodeURIComponent(accountName)}&am=${payableAmount}&cu=INR`,
    )}`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setProofFileName(file.name);

    // Fast client-side image compression using canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setScreenshotUrl(compressed);
        } else {
          setScreenshotUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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

      // If Super Admin, bypass payment directly
      if (user?.role === 'SUPER_ADMIN') {
        setSuccess(true);
        setTimeout(() => router.push('/admin'), 1200);
        return;
      }

      // Strictly verify fresh feePaid status from the server
      let freshUser = user;
      try {
        const me = await api.getMe();
        if (me) {
          freshUser = { ...user, ...me, centre: me.centre || user?.centre };
          api.updateCachedUser(freshUser);
        }
      } catch (_) {}

      // Check if account already has verified feePaid
      const isAlreadyPaid = Boolean(
        freshUser?.feePaid ||
        freshUser?.centre?.feePaid ||
        freshUser?.distributorProfile?.feePaid ||
        freshUser?.partnerProfile?.feePaid
      );

      if (isAlreadyPaid) {
        setSuccess(true);
        setTimeout(() => {
          if (user?.role === 'PARTNER') router.push('/partner');
          else if (user?.role === 'DISTRIBUTOR') router.push('/distributor');
          else router.push('/dashboard');
        }, 1200);
      } else {
        // Move to mandatory Payment Step
        setStep('PAYMENT');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedMethod === 'OFFLINE' && !screenshotUrl) {
      setError('Please upload your Payment Screenshot / Transfer Receipt.');
      return;
    }

    setSubmittingPayment(true);

    try {
      await api.verifyRegistrationPayment({
        userId: user.id,
        paymentReference: paymentReference.trim() || undefined,
        paymentMethod: selectedMethod,
        screenshotUrl: screenshotUrl || undefined,
        amount: payableAmount,
      });

      setStep('PENDING_APPROVAL');
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment. Please verify and try again.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-4xl">
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
              <span>
                {step === 'PASSWORD' && 'Step 1 • Set Permanent Password'}
                {step === 'PAYMENT' && 'Step 2 • Account Activation Payment'}
                {step === 'PENDING_APPROVAL' && 'Activation In Progress • Pending Approval'}
              </span>
            </span>
          </div>
        </div>

        {/* STEP 1: PASSWORD SETUP */}
        {step === 'PASSWORD' && (
          <div className="rounded-[14px] border border-[#E6EAF0] bg-white shadow-modal overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Role Details */}
            <div className="lg:col-span-7 bg-[#FAFCFF] border-b lg:border-b-0 lg:border-r border-[#E6EAF0] p-6 sm:p-8 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                        Platform Architecture
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#198754] bg-[#EAF7EE] px-2 py-0.5 rounded-full border border-[#C3E6CB]">
                        Verified Rate
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#172033] mt-1">
                      Financial Fee &amp; License Structure
                    </h2>
                  </div>

                  {role === 'PARTNER' && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#FEF7E6] border border-[#F9DE9B] text-[#C98219]">
                      <Users className="h-5 w-5" />
                    </div>
                  )}
                  {role === 'DISTRIBUTOR' && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#F9F5FF] border border-[#E9D7FE] text-[#7F56D9]">
                      <Briefcase className="h-5 w-5" />
                    </div>
                  )}
                  {role === 'CENTRE' && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#EFF8FF] border border-[#B2DDFF] text-[#175CD3]">
                      <Building2 className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {role === 'PARTNER' && (
                  <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FFFDF5] p-5 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#8F5A0D]">Franchise License Fee</span>
                        <div className="text-3xl font-black text-[#172033] mt-0.5">
                          {formatINR(feeConfig.franchiseFee || 599)}
                        </div>
                      </div>
                      <span className="rounded bg-[#FEF7E6] px-2.5 py-1 text-xs font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                        Authorized Partner
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] leading-relaxed">
                      One-time authorized regional franchise onboarding license. Entitles your agency to regional territory governance, distributor delegation, and booking commissions.
                    </p>
                    <div className="pt-2 border-t border-[#F9DE9B]/50 text-xs">
                      <div className="rounded-[6px] bg-white border border-[#E6EAF0] p-2.5">
                        <span className="text-[10.5px] text-[#667085]">Min Payout Limit</span>
                        <p className="font-bold text-[#172033] mt-0.5">{formatINR(feeConfig.partnerMinWithdrawal || 100)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {role === 'DISTRIBUTOR' && (
                  <div className="rounded-[10px] border border-[#E9D7FE] bg-[#FCFAFF] p-5 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#7F56D9]">Distributor License Fee</span>
                        <div className="text-3xl font-black text-[#172033] mt-0.5">
                          {formatINR(feeConfig.distributorFee || 399)}
                        </div>
                      </div>
                      <span className="rounded bg-[#F9F5FF] px-2.5 py-1 text-xs font-bold text-[#7F56D9] border border-[#E9D7FE]">
                        Authorized Distributor
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] leading-relaxed">
                      One-time authorized district distribution license. Empowers you to onboard and manage CSC/e-Sevai centres, earn ticket markups, and withdraw earnings.
                    </p>
                    <div className="pt-2 border-t border-[#E9D7FE]/60 text-xs">
                      <div className="rounded-[6px] bg-white border border-[#E6EAF0] p-2.5">
                        <span className="text-[10.5px] text-[#667085]">Ticket Markup Rights</span>
                        <p className="font-bold text-[#7F56D9] mt-0.5">Up to ₹2.00 / Pass</p>
                      </div>
                    </div>
                  </div>
                )}

                {role === 'CENTRE' && (
                  <div className="rounded-[10px] border border-[#B2DDFF] bg-[#F8FBFF] p-5 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#175CD3]">Centre Onboarding Fee</span>
                        <div className="text-3xl font-black text-[#172033] mt-0.5">
                          {formatINR(feeConfig.registrationFee || 249)}
                        </div>
                      </div>
                      <span className="rounded bg-[#EFF8FF] px-2.5 py-1 text-xs font-bold text-[#175CD3] border border-[#B2DDFF]">
                        Authorized Booking Centre
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] leading-relaxed">
                      One-time centre registration and activation license. Provides direct access to high-speed TicketAssist automation, queue reservations, and instant token generation.
                    </p>
                    <div className="pt-2 border-t border-[#B2DDFF]/60 text-xs">
                      <div className="rounded-[6px] bg-white border border-[#E6EAF0] p-2.5">
                        <span className="text-[10.5px] text-[#667085]">Booking Service Fee</span>
                        <p className="font-bold text-[#172033] mt-0.5">{formatINR(feeConfig.serviceFee || 100)} / booking</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[#E6EAF0] text-[11px] text-[#667085] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#198754] shrink-0" />
                <span>Certified under SevaTN / TicketAssist Financial Architecture Governance.</span>
              </div>
            </div>

            {/* Right Column: Set Permanent Credentials */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-[#C98219] uppercase tracking-wider">
                    Step 1 • Private Credentials
                  </span>
                  <h1 className="text-xl font-bold text-[#172033] mt-1">
                    Set Permanent Password
                  </h1>
                  <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                    Your account was provisioned with a temporary administrator password. Please establish your private password to proceed to activation.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-[7px] border border-[#F8C4C2] bg-[#FDECEC] p-3 text-xs text-[#992B26]">
                    <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B]" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2.5 rounded-[7px] border border-[#BFE4C9] bg-[#EAF7EE] p-3 text-xs text-[#198754]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Password successfully updated! Redirecting...</span>
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
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 pr-9 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#172033]"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-[#667085]">
                        Use a combination of letters, numbers &amp; symbols.
                      </p>
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
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 pr-9 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#172033]"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 rounded-[7px] bg-[#C98219] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#A86B14] transition-colors disabled:opacity-50 shadow-subtle cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Updating Password...</span>
                          </>
                        ) : (
                          <>
                            <span>
                              {user?.role === 'SUPER_ADMIN' || Boolean(user?.feePaid || user?.centre?.feePaid || user?.distributorProfile?.feePaid || user?.partnerProfile?.feePaid)
                                ? 'Activate Account & Enter'
                                : 'Set Password & Proceed to Activation Payment'}
                            </span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[#E6EAF0] text-center text-[11px] text-[#667085]">
                TicketAssist Security • Powered by TicketAssist Platform
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT METHOD & UTR PROOF SUBMISSION */}
        {step === 'PAYMENT' && (
          <div className="rounded-[14px] border border-[#E6EAF0] bg-white shadow-modal overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left: Payment Method & QR Code Display */}
            <div className="lg:col-span-6 bg-[#FAFCFF] border-b lg:border-b-0 lg:border-r border-[#E6EAF0] p-6 sm:p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-2.5 py-0.5 text-[11px] font-bold text-[#8F5A0D]">
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Official Payment Gateway &amp; QR</span>
                  </div>
                  <span className="text-xs font-bold text-[#198754] bg-[#EAF7EE] border border-[#C3E6CB] px-2.5 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-[#172033]">
                    Pay Activation &amp; License Fee
                  </h2>
                  <p className="text-xs text-[#667085] mt-1">
                    Based on <code className="font-mono text-[#C98219]">/admin/config</code> standard rates. Complete payment to activate your ID.
                  </p>
                </div>

                {/* Amount Box */}
                <div className="rounded-[10px] border border-[#C98219]/30 bg-[#FEF7E6] p-4 text-center">
                  <span className="text-[11px] font-bold text-[#8F5A0D] uppercase tracking-wider">
                    Total Payable Amount
                  </span>
                  <div className="text-3xl font-black text-[#172033] mt-1 font-mono">
                    {formatINR(payableAmount)}
                  </div>
                  <span className="text-[11px] text-[#8F5A0D] font-medium">
                    {role === 'DISTRIBUTOR' && 'Distributor Territorial License Fee'}
                    {role === 'PARTNER' && 'Partner Regional Franchise Fee'}
                    {role === 'CENTRE' && 'Centre Onboarding & Activation Fee'}
                  </span>
                </div>

                {/* QR Code & UPI ID Card */}
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 text-center space-y-3 shadow-2xs">
                  <div className="mx-auto w-48 h-48 bg-white border border-[#E6EAF0] p-2 rounded-[8px] flex items-center justify-center shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCodeUrl}
                      alt="Official Payment QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-[#667085] font-semibold">Official UPI ID:</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono font-bold text-xs sm:text-sm text-[#172033] select-all bg-[#F8FAFC] px-2 py-1 rounded border border-[#E6EAF0]">
                        {upiId}
                      </span>
                      <button
                        type="button"
                        onClick={copyUpiId}
                        className="p-1 rounded text-[#C98219] hover:bg-[#FEF7E6] transition-colors"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="h-4 w-4 text-[#198754]" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#667085]">
                      Payee: <strong className="text-[#172033]">{accountName}</strong>
                    </p>
                  </div>

                  {/* Bank Details Strip */}
                  <div className="pt-2 border-t border-[#F2F4F7] text-[11px] text-[#667085] text-left grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-[#98A2B3]">Bank Name:</span>
                      <strong className="text-[#172033]">{feeConfig.offlineBankName || 'HDFC Bank'}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#98A2B3]">IFSC Code:</span>
                      <strong className="text-[#172033] font-mono">{feeConfig.offlineIfscCode || 'HDFC0001234'}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] text-[#98A2B3]">Account Number:</span>
                      <strong className="text-[#172033] font-mono">{feeConfig.offlineAccountNumber || '50200012345678'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-[11px] text-[#667085] leading-relaxed">
                💡 {feeConfig.offlinePaymentInstructions}
              </div>
            </div>

            {/* Right: Payment Reference & Receipt Submission */}
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-[#C98219] uppercase tracking-wider">
                    Step 2 • Verification Proof
                  </span>
                  <h1 className="text-xl font-bold text-[#172033] mt-1">
                    Submit Payment Details
                  </h1>
                  <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                    After completing payment via your UPI app (GPay, PhonePe, Paytm, BHIM) or Net Banking, enter your reference number below.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-[7px] border border-[#F8C4C2] bg-[#FDECEC] p-3 text-xs text-[#992B26]">
                    <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B]" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      12-Digit UTR / Transaction Reference ID <span className="text-[#667085] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. 432109876543 (optional)"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-[#667085]">
                      Optional: Enter the 12-digit UTR or UPI Transaction Reference ID if available.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1">
                      Payment Screenshot / Transfer Receipt <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full flex items-center justify-center gap-2 rounded-[7px] border-2 border-dashed p-3.5 text-xs transition-colors ${
                        screenshotUrl
                          ? 'border-[#198754] bg-[#EAF7EE]/50 text-[#198754]'
                          : 'border-[#D0D5DD] bg-[#F8FAFC] text-[#475467] hover:border-[#C98219] hover:bg-[#FEF7E6]/30'
                      }`}
                    >
                      <UploadCloud className="h-4 w-4 text-[#C98219]" />
                      <span className="font-semibold">{proofFileName ? proofFileName : 'Upload Payment Screenshot / Transfer Receipt * (PNG, JPG)'}</span>
                    </button>
                    {screenshotUrl ? (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-[#198754] font-medium">
                        <Check className="h-3.5 w-3.5" />
                        <span>Receipt screenshot attached for admin verification</span>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-amber-800 font-medium">
                        * Required: Please attach the transaction confirmation screenshot or receipt from your UPI / banking app.
                      </p>
                    )}
                  </div>

                  <div className="rounded-[8px] bg-[#EAF7EE] border border-[#BFE4C9] p-3 text-[11px] text-[#198754] flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#198754] shrink-0 mt-0.5" />
                    <span>
                      <strong>Admin Verification:</strong> Once submitted, the platform administrator will verify this payment in the admin portal and activate your ID.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submittingPayment}
                      className="w-full flex items-center justify-center gap-2 rounded-[7px] bg-[#C98219] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#A86B14] transition-colors disabled:opacity-50 shadow-subtle cursor-pointer"
                    >
                      {submittingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Submitting Payment Proof...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Payment Proof &amp; Request Activation</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E6EAF0] text-center text-[11px] text-[#667085]">
                TicketAssist Financial Verification Protocol • Compliant Double-Entry Ledger
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PENDING ADMIN APPROVAL CONFIRMATION */}
        {step === 'PENDING_APPROVAL' && (
          <div className="rounded-[14px] border border-[#E6EAF0] bg-white shadow-modal p-8 sm:p-10 text-center max-w-xl mx-auto space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF7E6] border-2 border-[#F9DE9B] text-[#C98219]">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-xs font-bold text-[#8F5A0D]">
                Payment Submitted • Pending Admin Approval
              </span>
              <h1 className="text-2xl font-extrabold text-[#172033]">
                Account Awaiting Activation
              </h1>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                Your payment reference has been recorded successfully. The platform administrator will verify the payment and approve your account ID.
              </p>
            </div>

            {/* Submission Summary Card */}
            <div className="rounded-[10px] border border-[#E6EAF0] bg-[#F8FAFC] p-4 text-left text-xs space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#667085] font-sans">Payment Amount:</span>
                <span className="font-bold text-[#172033]">{formatINR(payableAmount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E6EAF0] pt-2">
                <span className="text-[#667085] font-sans">Reference / UTR:</span>
                <span className="font-bold text-[#C98219] select-all">{paymentReference.trim() || 'RECEIPT_PROOF_ATTACHED'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E6EAF0] pt-2">
                <span className="text-[#667085] font-sans">Transfer Receipt:</span>
                <span className="font-bold text-[#198754]">ATTACHED</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E6EAF0] pt-2">
                <span className="text-[#667085] font-sans">Account ID Status:</span>
                <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-[10px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                  PENDING_VERIFICATION
                </span>
              </div>
            </div>

            <div className="rounded-[8px] bg-[#EFF8FF] border border-[#B2DDFF] p-3 text-xs text-[#175CD3] text-left leading-relaxed">
              ℹ️ <strong>What happens next?</strong> As soon as the platform administrator approves your payment in the admin portal, your ID will be permanently activated. You can then sign in directly with your new permanent password.
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  api.clearAuth();
                  router.push('/auth/login');
                }}
                className="w-full rounded-[8px] bg-[#172033] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2A374F] transition-colors shadow-subtle cursor-pointer"
              >
                Return to Login Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
