'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  CreditCard,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  QrCode,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  X,
  Eye,
} from 'lucide-react';

export default function PartnerOnboardPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Form & Payment State
  const [selectedMethod, setSelectedMethod] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [paymentReference, setPaymentReference] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [onlineProcessing, setOnlineProcessing] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) {
      setTokenError('Onboarding token missing from URL');
      setLoading(false);
      return;
    }

    loadOnboardInfo();
  }, [token]);

  const loadOnboardInfo = () => {
    Promise.all([
      api.getPartnerOnboardInfo(token),
      api.getPublicPaymentConfig().catch(() => null),
    ])
      .then(([res, pCfg]) => {
        setPartnerInfo(res.partner);
        if (pCfg) setPaymentConfig(pCfg);
        if (res.partner?.paymentReference) {
          setPaymentReference(res.partner.paymentReference);
        }
        if (res.partner?.paymentProofUrl) {
          setScreenshotUrl(res.partner.paymentProofUrl);
          setProofPreview(res.partner.paymentProofUrl);
        }
        if (res.partner?.status === 'PENDING_APPROVAL') {
          setSubmitSuccess(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        setTokenError(err.message || 'Invalid or expired partner onboarding link');
        setLoading(false);
      });
  };

  const getUpiId = () => {
    return paymentConfig?.offlineUpiId || 'pay.ticketassist@okaxis';
  };

  const getFranchiseFee = () => {
    return Number(partnerInfo?.franchiseFee || paymentConfig?.franchiseFee || 599);
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(getUpiId());
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Handle File Upload for Payment Proof with auto-compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Proof file must be smaller than 15MB');
      return;
    }

    setProofFileName(file.name);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setScreenshotUrl(compressed);
            setProofPreview(compressed);
          } else {
            const raw = event.target?.result as string;
            setScreenshotUrl(raw);
            setProofPreview(raw);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setScreenshotUrl(base64);
        setProofPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProofFile = () => {
    setScreenshotUrl('');
    setProofPreview(null);
    setProofFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOnlinePayment = async () => {
    setErrorMsg(null);
    if (!password || password.trim().length < 6) {
      setErrorMsg('Please create a secure password (minimum 6 characters) for your Partner Dashboard.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your confirm password.');
      return;
    }

    setOnlineProcessing(true);
    try {
      const mockGatewayId = `pay_razor_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const res = await api.submitPartnerPayment(token, {
        paymentMethod: 'ONLINE',
        gatewayPaymentId: mockGatewayId,
        password: password.trim(),
      });

      if (res.isAutoActivated) {
        setSubmitSuccess(true);
        loadOnboardInfo();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Online payment failed');
    } finally {
      setOnlineProcessing(false);
    }
  };

  const handleOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password || password.trim().length < 6) {
      setErrorMsg('Please create a secure password (minimum 6 characters) for your Partner Dashboard.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your confirm password.');
      return;
    }

    if (!paymentReference.trim() && !screenshotUrl) {
      setErrorMsg('Please provide either the UPI UTR reference number or upload your payment receipt screenshot.');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitPartnerPayment(token, {
        paymentMethod: 'OFFLINE',
        paymentReference: paymentReference.trim() || undefined,
        screenshotUrl: screenshotUrl || undefined,
        password: password.trim(),
      });

      setSubmitSuccess(true);
      loadOnboardInfo();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit offline payment reference');
    } finally {
      setSubmitting(false);
    }
  };

  // QR Code Image source helper
  const getQrCodeSrc = () => {
    if (paymentConfig?.offlineQrImageUrl && paymentConfig.offlineQrImageUrl.trim().length > 10) {
      return paymentConfig.offlineQrImageUrl;
    }
    const upiUri = `upi://pay?pa=${encodeURIComponent(getUpiId())}&pn=${encodeURIComponent(paymentConfig?.offlineAccountName || 'SevaTN Franchise')}&am=${getFranchiseFee().toFixed(2)}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#C98219]" />
          <p className="text-sm font-semibold text-[#667085]">Validating partner franchise link...</p>
        </div>
      </div>
    );
  }

  if (tokenError || !partnerInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
        <div className="w-full max-w-md rounded-[12px] border border-[#F5C6CB] bg-white p-8 text-center shadow-subtle">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FDECEC] text-[#C2413B] mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-[#172033]">Invalid Partner Link</h2>
          <p className="mt-2 text-xs text-[#667085] leading-relaxed">
            {tokenError || 'This partner onboarding link is invalid or has expired.'}
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="mt-6 inline-flex items-center gap-2 rounded-[7px] bg-[#172033] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#222E46]"
          >
            Go to Portal Login
          </button>
        </div>
      </div>
    );
  }

  const isAlreadyActive = partnerInfo.status === 'ACTIVE' && partnerInfo.feePaid;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3.5 py-1 text-xs font-bold text-[#8F5A0D]">
            <Sparkles className="h-3.5 w-3.5 text-[#C98219]" />
            <span>SevaTN Authorized Partner Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            Partner Franchise Onboarding & Activation
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] max-w-lg mx-auto">
            Complete your franchise fee payment to activate your authorized regional partner node on SevaTN.
          </p>
        </div>

        {/* Partner Info Summary Card */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 sm:p-6 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E6EAF0] pb-4">
            <div>
              <span className="rounded bg-[#FEF7E6] px-2.5 py-0.5 text-xs font-mono font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                {partnerInfo.partnerCode}
              </span>
              <h2 className="text-lg font-bold text-[#172033] mt-1.5">{partnerInfo.name}</h2>
            </div>
            <div>
              {isAlreadyActive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D1FADF] px-3 py-1 text-xs font-bold text-[#027A48]">
                  <span className="h-2 w-2 rounded-full bg-[#12B76A]" />
                  Active & Verified
                </span>
              ) : partnerInfo.status === 'PENDING_APPROVAL' || submitSuccess ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF8FF] px-3 py-1 text-xs font-bold text-[#175CD3] border border-[#B2DDFF]">
                  <span className="h-2 w-2 rounded-full bg-[#2E90FA] animate-ping" />
                  Awaiting Admin Approval
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF7E6] px-3 py-1 text-xs font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                  <span className="h-2 w-2 rounded-full bg-[#C98219]" />
                  Pending Franchise Payment
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-xs">
            <div>
              <span className="text-[#667085] block font-medium">Official Email</span>
              <span className="text-[#172033] font-semibold">{partnerInfo.email}</span>
            </div>
            <div>
              <span className="text-[#667085] block font-medium">Mobile Number</span>
              <span className="text-[#172033] font-semibold">{partnerInfo.mobile}</span>
            </div>
            <div>
              <span className="text-[#667085] block font-medium">Regional Jurisdiction</span>
              <span className="text-[#172033] font-semibold">
                {partnerInfo.district || 'Tamil Nadu'} / {partnerInfo.taluk || 'HQ'}
              </span>
            </div>
          </div>
        </div>

        {/* State 1: Already Active */}
        {isAlreadyActive && (
          <div className="rounded-[10px] border border-[#A6F4C5] bg-[#ECFDF3] p-6 text-center shadow-subtle space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D1FADF] text-[#027A48]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[#027A48]">Your Partner Franchise is Active!</h3>
            <p className="text-xs text-[#027A48] max-w-md mx-auto">
              Your partner account is fully verified and authorized. You can now log into your Partner Portal, manage centres, and request payouts.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="inline-flex items-center gap-2 rounded-[7px] bg-[#027A48] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#05603A] shadow-subtle"
            >
              <span>Login to Partner Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* State 2: Payment Submitted, Waiting for Admin Approval */}
        {!isAlreadyActive && (partnerInfo.status === 'PENDING_APPROVAL' || submitSuccess) && (
          <div className="rounded-[10px] border border-[#B2DDFF] bg-[#EFF8FF] p-6 text-center shadow-subtle space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D1E9FF] text-[#175CD3]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[#175CD3]">Offline Payment Submitted for Admin Verification</h3>
            <p className="text-xs text-[#1E40AF] max-w-md mx-auto leading-relaxed">
              We received your offline transaction reference <strong className="font-mono">{partnerInfo.paymentReference || paymentReference}</strong>.
              TicketAssist administrators are reviewing your submission. Your partner account will become <strong>ACTIVE</strong> immediately upon approval.
            </p>

            <div className="rounded-[7px] border border-[#B2DDFF] bg-white p-4 max-w-sm mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#667085]">Franchise Fee:</span>
                <span className="font-bold text-[#172033]">₹{getFranchiseFee().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Transaction Ref (UTR):</span>
                <span className="font-mono font-bold text-[#172033]">{partnerInfo.paymentReference || paymentReference}</span>
              </div>
              {proofPreview && (
                <div className="pt-2 border-t border-[#E6EAF0]">
                  <span className="text-[#667085] block mb-1">Uploaded Receipt Proof:</span>
                  <img
                    src={proofPreview}
                    alt="Payment Proof"
                    className="h-28 w-full object-contain rounded-[6px] border border-[#D0D5DD] bg-[#F8FAFC]"
                  />
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-[#667085]">Approval Status:</span>
                <span className="font-bold text-[#175CD3]">Under Review by Admin</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => loadOnboardInfo()}
                className="inline-flex items-center gap-2 rounded-[7px] bg-[#175CD3] px-4 py-2 text-xs font-bold text-white hover:bg-[#154EBA]"
              >
                Refresh Approval Status
              </button>
            </div>
          </div>
        )}

        {/* State 3: Dual Payment Options (Online Auto-Verify & Offline Admin Review) */}
        {!isAlreadyActive && partnerInfo.status !== 'PENDING_APPROVAL' && !submitSuccess && (
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#C98219]" />
                Select Payment Method — Franchise Fee ₹{getFranchiseFee().toFixed(2)}
              </h3>
              <p className="text-xs text-[#667085] mt-1">
                Choose <strong>Online Payment</strong> for instant auto-activation, or <strong>Offline UPI QR</strong> to submit UTR & screenshot proof for admin verification.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="rounded-[7px] border border-[#F5C6CB] bg-[#FDECEC] p-3 text-xs text-[#C2413B] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#C2413B]" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMethod('ONLINE')}
                className={`p-3.5 rounded-[8px] border text-left transition-all ${
                  selectedMethod === 'ONLINE'
                    ? 'border-[#027A48] bg-[#ECFDF3] shadow-xs ring-2 ring-[#027A48]/20'
                    : 'border-[#E6EAF0] bg-[#F8FAFC] hover:border-[#D0D5DD]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172033]">Online Gateway</span>
                  <span className="text-[10px] font-extrabold bg-[#027A48] text-white px-2 py-0.5 rounded">
                    Instant Auto-Active
                  </span>
                </div>
                <p className="text-[11px] text-[#027A48] mt-1 font-medium">
                  UPI, Cards, NetBanking. Verified automatically without waiting.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('OFFLINE')}
                className={`p-3.5 rounded-[8px] border text-left transition-all ${
                  selectedMethod === 'OFFLINE'
                    ? 'border-[#C98219] bg-[#FEF7E6] shadow-xs ring-2 ring-[#C98219]/20'
                    : 'border-[#E6EAF0] bg-[#F8FAFC] hover:border-[#D0D5DD]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172033]">Offline UPI QR</span>
                  <span className="text-[10px] font-extrabold bg-[#C98219] text-white px-2 py-0.5 rounded">
                    Admin Approval
                  </span>
                </div>
                <p className="text-[11px] text-[#8F5A0D] mt-1 font-medium">
                  Scan Admin QR code, pay via UPI app & upload proof.
                </p>
              </button>
            </div>

            {/* Set Password Field (Mandatory) */}
            <div className="rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-[#C98219]" />
                  Create Partner Dashboard Login Password *
                </h4>
                <span className="text-[10px] bg-[#FEF7E6] text-[#8F5A0D] border border-[#F9DE9B] px-2 py-0.5 rounded font-extrabold">
                  Required
                </span>
              </div>
              <p className="text-[11px] text-[#667085]">
                You will use your official email (<strong className="text-[#172033]">{partnerInfo.email}</strong>) and this password to log into your Partner Portal once activated.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#344054] mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-[6px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#344054] mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-[6px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Method A: Online Payment */}
            {selectedMethod === 'ONLINE' && (
              <div className="space-y-4 pt-1 animate-in fade-in">
                <div className="rounded-[8px] border border-[#A6F4C5] bg-[#ECFDF3] p-4 text-xs space-y-2 text-[#027A48]">
                  <div className="flex justify-between font-bold text-sm">
                    <span>Franchise Fee Amount:</span>
                    <span>₹{getFranchiseFee().toFixed(2)}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed">
                    ✨ <strong>Instant Activation:</strong> Once your online transaction succeeds, your partner node will be instantly activated and verified without waiting for administrator approval.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={onlineProcessing}
                  onClick={handleOnlinePayment}
                  className="w-full rounded-[7px] bg-[#027A48] py-3 text-sm font-bold text-white hover:bg-[#05603A] shadow-subtle flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {onlineProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Online Payment...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Pay ₹{getFranchiseFee().toFixed(2)} Online (Instant Auto-Activation)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Method B: Offline Payment (Admin Updated QR & Proof Upload) */}
            {selectedMethod === 'OFFLINE' && (
              <div className="space-y-5 pt-1 animate-in fade-in">
                {/* Admin Uploaded QR Code Box */}
                <div className="rounded-[9px] border border-[#F9DE9B] bg-[#FEF7E6] p-5 flex flex-col sm:flex-row items-center gap-6">
                  <div className="text-center shrink-0">
                    <div className="p-2 bg-white rounded-[10px] border border-[#E6EAF0] shadow-xs inline-block">
                      <img
                        src={getQrCodeSrc()}
                        alt="Admin Official Payment QR Code"
                        className="h-40 w-40 object-contain rounded-[6px]"
                      />
                    </div>
                    <span className="block text-[10.5px] text-[#8F5A0D] font-bold mt-1.5">
                      {paymentConfig?.offlineQrImageUrl ? 'Official Admin QR Code' : 'Scan to Pay ₹599.00'}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs text-[#8F5A0D] font-bold">One-Time Franchise Fee:</span>
                      <span className="text-lg font-extrabold text-[#172033]">₹{getFranchiseFee().toFixed(2)}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-[#8F5A0D] block font-medium">Official Payment UPI ID:</span>
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-[7px] border border-[#F9DE9B]">
                        <span className="text-xs font-mono font-bold text-[#172033] flex-1 truncate">{getUpiId()}</span>
                        <button
                          type="button"
                          onClick={copyUpiId}
                          className="text-xs font-bold text-[#8F5A0D] hover:text-[#C98219] flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedUpi ? <Check className="h-3.5 w-3.5 text-[#198754]" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                        </button>
                      </div>
                    </div>

                    {paymentConfig?.offlineAccountName && (
                      <p className="text-[11px] text-[#667085]">
                        Beneficiary: <strong className="text-[#172033]">{paymentConfig.offlineAccountName}</strong>
                      </p>
                    )}

                    <p className="text-[11px] text-[#8F5A0D] leading-relaxed">
                      {paymentConfig?.offlinePaymentInstructions || 'Open any UPI App (GPay, PhonePe, Paytm, BHIM, Cred), scan the QR code above or pay to UPI ID, and upload payment receipt below.'}
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleOfflinePayment} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#172033]">
                        UPI / Bank UTR Reference Number
                      </label>
                      <span className="text-[10.5px] text-[#667085] font-medium">
                        (Optional if receipt proof uploaded)
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 429381048291 or UPI-4029194 (Optional if proof attached)"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-mono text-[#172033] focus:border-[#C98219] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#667085] mt-1 block">
                      Find the 12-digit UPI Reference ID or UTR in your payment app receipt.
                    </span>
                  </div>

                  {/* Payment Screenshot / Proof File Upload */}
                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1.5">
                      Upload Payment Proof / Screenshot (Receipt)
                    </label>

                    {proofPreview ? (
                      <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-3 flex items-center gap-3">
                        <img
                          src={proofPreview}
                          alt="Uploaded Receipt Preview"
                          className="h-16 w-16 object-cover rounded-[6px] border border-[#D0D5DD] bg-white"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-bold text-[#172033] truncate">
                            {proofFileName || 'payment_proof_receipt.png'}
                          </p>
                          <p className="text-[11px] text-[#027A48] flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="h-3 w-3" />
                            Screenshot Attached & Ready
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={removeProofFile}
                          className="rounded-[6px] bg-[#FDECEC] p-2 text-[#C2413B] hover:bg-[#FCD8D8] transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-[8px] border-2 border-dashed border-[#D0D5DD] hover:border-[#C98219] bg-[#F8FAFC] hover:bg-[#FEF7E6]/40 p-5 text-center transition-all cursor-pointer space-y-1.5"
                      >
                        <UploadCloud className="h-8 w-8 text-[#C98219] mx-auto" />
                        <p className="text-xs font-bold text-[#172033]">
                          Click to upload payment screenshot or receipt
                        </p>
                        <p className="text-[11px] text-[#667085]">
                          PNG, JPG, JPEG, WebP or PDF (Max 10MB)
                        </p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-[7px] bg-[#C98219] py-3 text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting Offline Reference & Proof...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Submit UTR Reference & Proof for Admin Approval</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
