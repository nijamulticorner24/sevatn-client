'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import {
  ShieldCheck,
  CheckCircle2,
  MapPin,
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
  UploadCloud,
  Image as ImageIcon,
  FileText,
  X,
  Eye,
  ExternalLink,
  Clock,
} from 'lucide-react';

export default function PartnerInvitationRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Registration Form State
  const [step, setStep] = useState<'REGISTER' | 'PAYMENT' | 'SUCCESS'>('REGISTER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [centreName, setCentreName] = useState('');
  const [district, setDistrict] = useState('Chennai');
  const [taluk, setTaluk] = useState('Guindy');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');

  // Location State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Payment State (Matching Partner Onboarding Model)
  const [selectedMethod, setSelectedMethod] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [submitting, setSubmitting] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [onlineProcessing, setOnlineProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [activatedCentre, setActivatedCentre] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) {
      setTokenError('Invitation token missing from URL');
      setLoading(false);
      return;
    }

    Promise.all([
      api.validateInvitation(token),
      api.getPublicPaymentConfig().catch(() => null),
    ])
      .then(([res, pCfg]) => {
        setInvitation(res);
        if (pCfg) {
          setPaymentConfig(pCfg);
          const onlineOn = pCfg.onlinePaymentEnabled !== false;
          const offlineOn = pCfg.offlinePaymentEnabled !== false;
          if (!onlineOn && offlineOn) {
            setSelectedMethod('OFFLINE');
          } else if (onlineOn) {
            setSelectedMethod('ONLINE');
          }
        }
        const meta = res.metadata || {};
        if (meta.shopName) setCentreName(meta.shopName);
        if (meta.mobile) setMobile(meta.mobile);
        if (meta.email) setEmail(meta.email);
        if (meta.district) {
          setDistrict(meta.district);
        } else if (res.partner?.district) {
          setDistrict(res.partner.district);
        }
        if (meta.taluk) {
          setTaluk(meta.taluk);
        } else if (res.partner?.taluk) {
          setTaluk(res.partner.taluk);
        }
        setLoading(false);
      })
      .catch((err) => {
        setTokenError(err.message || 'Invalid or expired invitation token');
        setLoading(false);
      });

    // Auto-request location
    captureLocation();
  }, [token]);

  const captureLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setLocating(true);
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setAccuracy(pos.coords.accuracy || 10);
          setLocationError(null);
          setLocating(false);
        },
        (err) => {
          let msg = `GPS Location Error: ${err.message}. Please allow location access in your browser.`;
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission denied. Please allow location access in your browser to complete registration.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'Location unavailable. Please ensure your device has location/GPS enabled or connect to Wi-Fi.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'Location request timed out. Please try again.';
          }
          setLocationError(msg);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  };

  const getUpiId = () => {
    return paymentConfig?.offlineUpiId || 'pay.ticketassist@okaxis';
  };

  const getRegistrationFee = () => {
    return Number(paymentConfig?.registrationFee || 249);
  };

  const onlineEnabled = paymentConfig ? paymentConfig.onlinePaymentEnabled !== false : true;
  const offlineEnabled = paymentConfig ? paymentConfig.offlinePaymentEnabled !== false : true;
  const anyPaymentEnabled = onlineEnabled || offlineEnabled;

  const copyUpiId = () => {
    navigator.clipboard.writeText(getUpiId());
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const getQrCodeSrc = () => {
    if (paymentConfig?.offlineQrImageUrl && paymentConfig.offlineQrImageUrl.trim().length > 10) {
      return paymentConfig.offlineQrImageUrl;
    }
    const upiUri = `upi://pay?pa=${encodeURIComponent(getUpiId())}&pn=${encodeURIComponent(paymentConfig?.offlineAccountName || 'SevaTN Centre')}&am=${getRegistrationFee().toFixed(2)}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
  };

  // Handle File Upload for Payment Proof with Canvas Auto-Compression
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!latitude || !longitude) {
      setErrorMsg('Service location coordinates are required for 5 KM access control. Please enable GPS.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.registerByInvitation({
        invitationToken: token,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        password,
        centreName: centreName.trim(),
        district: district.trim(),
        taluk: taluk.trim(),
        address: address.trim() || undefined,
        pincode: pincode.trim() || undefined,
        latitude,
        longitude,
        accuracy: accuracy ? Math.min(accuracy, 2500) : 1000,
      });

      setRegisteredUserId(res.userId);
      setStep('PAYMENT');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  // State for activation outcome
  const [isAutoActivated, setIsAutoActivated] = useState(true);

  // Online Gateway Instant Auto-Activation
  const handleOnlinePayment = async () => {
    if (!registeredUserId) return;
    setErrorMsg(null);

    if (!onlineEnabled) {
      setErrorMsg('Online payment gateway is currently disabled by administrator.');
      return;
    }

    setOnlineProcessing(true);

    try {
      const mockGatewayId = `pay_razor_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const res = await api.verifyRegistrationPayment({
        userId: registeredUserId,
        paymentReference: mockGatewayId,
        paymentMethod: 'ONLINE',
      });

      if (res.token && res.user) {
        api.setAuth(res.token, res.user);
      }
      api.setLocationCoordinates(latitude!, longitude!, accuracy || undefined);
      setActivatedCentre(res.centre);
      setIsAutoActivated(true);
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err.message || 'Online payment verification failed');
    } finally {
      setOnlineProcessing(false);
    }
  };

  // Offline QR & Receipt Proof Submission (Requires Admin Verification)
  const handleOfflinePaymentSubmit = async () => {
    if (!registeredUserId) return;
    setErrorMsg(null);

    if (!offlineEnabled) {
      setErrorMsg('Offline UPI QR payment is currently disabled by administrator.');
      return;
    }

    if (!screenshotUrl && !paymentReference.trim()) {
      setErrorMsg('Please upload the payment receipt screenshot or enter the 12-digit UPI UTR reference number.');
      return;
    }

    setVerifyingPayment(true);
    try {
      const offlineRef = paymentReference.trim() || (screenshotUrl ? 'RECEIPT_PROOF_ATTACHED' : `OFFLINE-${Date.now()}`);

      const res = await api.verifyRegistrationPayment({
        userId: registeredUserId,
        paymentReference: offlineRef,
        paymentMethod: 'OFFLINE',
        screenshotUrl: screenshotUrl || undefined,
      });

      api.setLocationCoordinates(latitude!, longitude!, accuracy || undefined);
      setActivatedCentre(res.centre);
      setIsAutoActivated(false);
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment submission failed');
    } finally {
      setVerifyingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#C98219]" />
          <p className="text-sm text-[#667085]">Verifying Partner Invitation Token...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
        <div className="w-full max-w-md rounded-[10px] border border-[#F5C6CB] bg-[#FDECEC] p-6 text-center shadow-subtle">
          <AlertCircle className="mx-auto h-12 w-12 text-[#C2413B] mb-3" />
          <h2 className="text-xl font-bold text-[#C2413B]">Invalid Partner Invitation</h2>
          <p className="mt-2 text-sm text-[#172033]">{tokenError}</p>
          <p className="mt-4 text-xs text-[#667085]">
            SevaTN registration requires a valid invitation link from an authorized partner. Please contact your regional partner.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="mt-6 w-full rounded-[7px] bg-[#C98219] py-2.5 text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172033] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-[8px] bg-[#C98219] text-white shadow-subtle mb-3">
            <ShieldCheck className="h-7 w-7 font-bold" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            Seva — Centre Onboarding
          </h1>
          <p className="text-xs text-[#667085] mt-1">Powered by NIJA Assisted Services Platform</p>

          {/* Partner Attribution Badge */}
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-4 py-1.5 text-xs text-[#8F5A0D] font-bold shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#C98219]" />
            <span>
              Authorized Partner: <strong>{invitation?.partner?.name}</strong> ({invitation?.partner?.partnerCode})
            </span>
          </div>

          {/* Step Indicator */}
          {step !== 'SUCCESS' && (
            <div className="mt-5 flex items-center justify-center gap-3 text-xs font-bold">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
                  step === 'REGISTER'
                    ? 'bg-[#C98219] text-white'
                    : 'bg-[#EAF7EE] text-[#198754] border border-[#C3E6CB]'
                }`}
              >
                <span>1. Centre Details</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[#98A2B3]" />
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
                  step === 'PAYMENT'
                    ? 'bg-[#C98219] text-white'
                    : 'bg-[#F2F4F7] text-[#667085]'
                }`}
              >
                <span>2. Activation & Payment</span>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-[8px] border border-[#F8C4C2] bg-[#FDECEC] p-4 text-xs sm:text-sm text-[#992B26] flex items-start gap-3 shadow-xs">
            <AlertCircle className="h-5 w-5 shrink-0 text-[#C2413B] mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* STEP 1: Registration Form */}
        {step === 'REGISTER' && (
          <form
            onSubmit={handleRegisterSubmit}
            className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 sm:p-8 shadow-subtle space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-[#172033] flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#C98219]" />
                Centre & Operator Details
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Register your Tamil Nadu eSevai / CSC centre under this authorized partner.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Operator Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muthukumar S"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Centre / Shop Name *</label>
                <input
                  type="text"
                  required
                  value={centreName}
                  onChange={(e) => setCentreName(e.target.value)}
                  placeholder="e.g. Sri Murugan eSevai Kendra"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="9443100001"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@gmail.com"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Account Password (Min 6 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Madurai"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Taluk *</label>
                <input
                  type="text"
                  required
                  value={taluk}
                  onChange={(e) => setTaluk(e.target.value)}
                  placeholder="e.g. Madurai North"
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#172033] mb-1">Street Address & Pincode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="12, West Masi Street"
                    className="sm:col-span-2 w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Pincode (e.g. 625001)"
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Service Location / 5 KM Geofence Registration */}
            <div className="rounded-[8px] border border-[#F9DE9B] bg-[#FEF7E6] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#C98219]" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#172033]">Registered Service Location</h3>
                    <p className="text-[11px] text-[#667085]">
                      Required for 5 KM radius access enforcement.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={captureLocation}
                  disabled={locating}
                  className="rounded-[6px] bg-white border border-[#F9DE9B] px-3 py-1.5 text-xs font-bold text-[#8F5A0D] hover:bg-[#FAF3E7] transition-colors"
                >
                  {locating ? 'Acquiring GPS...' : 'Refresh GPS'}
                </button>
              </div>

              {latitude && longitude ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-[#198754] bg-[#EAF7EE] border border-[#C3E6CB] rounded-[6px] p-2.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#198754]" />
                  <span>
                    Coordinates captured: Lat {latitude.toFixed(4)}, Lon {longitude.toFixed(4)}
                    {accuracy && accuracy > 2500 ? ' (Desktop / Network Geolocation Verified)' : ` (Accuracy: ${Math.round(accuracy || 10)}m)`}
                  </span>
                </div>
              ) : (
                <div className="mt-3 text-xs text-[#8F5A0D] font-medium">
                  {locationError || 'Please allow browser location permission to lock your centre service location.'}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !latitude || !longitude}
              className="w-full rounded-[7px] bg-[#C98219] py-3 text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Registration...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Centre Activation & Payment (₹{getRegistrationFee()})</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Dual Payment Model (Matching Partner Onboarding) */}
        {step === 'PAYMENT' && (
          <div className="space-y-6">
            {/* Fee Breakdown & Order Summary */}
            <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E6EAF0] gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#172033] flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#C98219]" />
                    {centreName || 'eSevai Centre'}
                  </h2>
                  <p className="text-xs text-[#667085]">
                    Operator: <strong>{name}</strong> • {mobile} • {district}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs text-[#667085] block">Onboarding Registration Fee</span>
                  <span className="text-2xl font-black text-[#C98219]">₹{getRegistrationFee().toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs text-[#667085]">
                <div className="rounded-[6px] bg-[#F8FAFC] border border-[#E6EAF0] p-2.5">
                  <span className="block font-bold text-[#172033]">Platform License</span>
                  <span className="text-[#198754] font-medium">1-Year Operational Validity</span>
                </div>
                <div className="rounded-[6px] bg-[#F8FAFC] border border-[#E6EAF0] p-2.5">
                  <span className="block font-bold text-[#172033]">Service Access</span>
                  <span className="text-[#172033]">TicketAssist & Instant Services</span>
                </div>
                <div className="rounded-[6px] bg-[#F8FAFC] border border-[#E6EAF0] p-2.5">
                  <span className="block font-bold text-[#172033]">Authorized Partner</span>
                  <span className="text-[#8F5A0D] font-bold">{invitation?.partner?.name}</span>
                </div>
              </div>
            </div>

            {/* Notice when all payment methods are disabled by Admin */}
            {!anyPaymentEnabled ? (
              <div className="rounded-[10px] border border-[#FDA29B] bg-[#FEF3F2] p-8 shadow-subtle text-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE4E2] text-[#D92D20] mx-auto border border-[#FDA29B]">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#172033]">
                    Registration Payment Disabled by Administrator
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B42318] max-w-md mx-auto mt-1 leading-relaxed">
                    All payment methods (Online Gateway & Offline UPI QR Code) are currently turned off in platform configuration. Centre registration fee payment is fully disabled until an administrator enables a payment method in Platform Settings.
                  </p>
                </div>
                <div className="pt-2 text-xs text-[#667085]">
                  Please contact platform support or your authorized partner.
                </div>
              </div>
            ) : (
              /* Payment Method Container */
              <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
                {/* Method Tabs (Only shown if BOTH are enabled) */}
                {onlineEnabled && offlineEnabled ? (
                  <div className="flex border-b border-[#E6EAF0] bg-[#F8FAFC]">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('ONLINE')}
                      className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                        selectedMethod === 'ONLINE'
                          ? 'border-[#C98219] text-[#C98219] bg-white'
                          : 'border-transparent text-[#667085] hover:text-[#172033]'
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Online Gateway (Instant)</span>
                      <span className="ml-1 rounded bg-[#EAF7EE] px-1.5 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                        Auto-Verified
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('OFFLINE')}
                      className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                        selectedMethod === 'OFFLINE'
                          ? 'border-[#C98219] text-[#C98219] bg-white'
                          : 'border-transparent text-[#667085] hover:text-[#172033]'
                      }`}
                    >
                      <QrCode className="h-4 w-4" />
                      <span>Scan QR & UPI Transfer</span>
                      <span className="ml-1 rounded bg-[#FEF7E6] px-1.5 py-0.5 text-[10px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                        UPI / QR
                      </span>
                    </button>
                  </div>
                ) : (
                  /* Single enabled method header */
                  <div className="border-b border-[#E6EAF0] bg-[#F8FAFC] px-6 py-3.5 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-[#172033] flex items-center gap-2">
                      {onlineEnabled ? (
                        <>
                          <CreditCard className="h-4 w-4 text-[#198754]" />
                          <span>Online Payment Gateway (Active)</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 text-[#C98219]" />
                          <span>Scan QR & UPI Transfer (Active)</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10.5px] font-bold text-[#667085] bg-white border border-[#E6EAF0] px-2.5 py-0.5 rounded">
                      Official Payment Channel
                    </span>
                  </div>
                )}

                {/* METHOD 1: ONLINE PAYMENT (Rendered ONLY if online is enabled) */}
                {onlineEnabled && selectedMethod === 'ONLINE' && (
                  <div className="p-6 sm:p-8 space-y-6">
                  <div className="rounded-[8px] border border-[#C3E6CB] bg-[#EAF7EE] p-4 text-xs text-[#106A3B] flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#198754] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#198754]">Instant Server Auto-Activation</p>
                      <p className="mt-0.5">
                        Pay securely using UPI, Credit/Debit Card, or Net Banking. Your centre account is activated automatically upon payment completion.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Payment Gateway</span>
                      <span className="font-bold text-[#172033]">
                        {paymentConfig?.onlineGatewayProvider || 'Razorpay / Cashfree Secure'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Registration Fee</span>
                      <span className="font-bold text-[#172033]">₹{getRegistrationFee().toFixed(2)}</span>
                    </div>
                    <div className="border-t border-[#E6EAF0] pt-2 flex justify-between font-bold text-sm">
                      <span className="text-[#172033]">Payable Amount</span>
                      <span className="text-[#C98219]">₹{getRegistrationFee().toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOnlinePayment}
                    disabled={onlineProcessing}
                    className="w-full rounded-[7px] bg-[#198754] py-3.5 text-sm font-bold text-white hover:bg-[#157347] transition-colors shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {onlineProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing Instant Verification...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Proceed to Pay ₹{getRegistrationFee().toFixed(2)} & Activate Instantly</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* METHOD 2: OFFLINE QR / UPI PAYMENT (Rendered ONLY if offline is enabled) */}
              {offlineEnabled && selectedMethod === 'OFFLINE' && (
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Official Admin QR Code & Beneficiary Details */}
                  <div className="rounded-[9px] border border-[#F9DE9B] bg-[#FEF7E6] p-5">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* Official QR Code */}
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="rounded-[8px] bg-white p-2 border border-[#E6EAF0] shadow-sm">
                          <img
                            src={getQrCodeSrc()}
                            alt="Official SevaTN Payment QR"
                            className="h-36 w-36 object-contain rounded"
                          />
                        </div>
                        <span className="text-[10px] text-[#8F5A0D] mt-1.5 font-bold">
                          {paymentConfig?.offlineQrImageUrl ? 'Official Admin QR Code' : `Scan to Pay ₹${getRegistrationFee()}`}
                        </span>
                      </div>

                      {/* Beneficiary Info */}
                      <div className="flex-1 min-w-0 space-y-2.5 text-xs text-center sm:text-left">
                        <div>
                          <span className="text-[11px] text-[#8F5A0D] font-bold block uppercase tracking-wider">
                            Beneficiary / Account Name
                          </span>
                          <span className="font-bold text-[#172033] text-sm">
                            {paymentConfig?.offlineAccountName || 'TicketAssist Services & Network'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] text-[#8F5A0D] font-bold block uppercase tracking-wider">
                            Official UPI ID
                          </span>
                          <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-[6px] border border-[#F9DE9B] shadow-2xs font-mono font-bold text-xs text-[#172033] mt-0.5">
                            <span>{getUpiId()}</span>
                            <button
                              type="button"
                              onClick={copyUpiId}
                              className="text-[#C98219] hover:text-[#8F5A0D] transition-colors p-0.5"
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? <Check className="h-3.5 w-3.5 text-[#198754]" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          {copiedUpi && (
                            <span className="text-[10px] text-[#198754] font-bold ml-2">Copied!</span>
                          )}
                        </div>

                        {paymentConfig?.offlineBankName && (
                          <div className="pt-1 text-[11px] text-[#475467] border-t border-[#F9DE9B]/60 grid grid-cols-2 gap-2 text-left">
                            <div>
                              <span className="text-[#8F5A0D] font-medium block">Bank:</span>
                              <span className="font-semibold text-[#172033]">{paymentConfig.offlineBankName}</span>
                            </div>
                            {paymentConfig.offlineAccountNumber && (
                              <div>
                                <span className="text-[#8F5A0D] font-medium block">A/C:</span>
                                <span className="font-mono font-semibold text-[#172033]">{paymentConfig.offlineAccountNumber}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Proof Upload with Live Preview & Auto-Compression */}
                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UploadCloud className="h-4 w-4 text-[#C98219]" />
                        Upload Payment Receipt / Screenshot
                      </span>
                      <span className="text-[11px] text-[#667085] font-normal">PNG, JPG, WEBP up to 15MB</span>
                    </label>

                    {!proofPreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-[8px] border-2 border-dashed border-[#D0D5DD] bg-[#F8FAFC] p-6 text-center hover:border-[#C98219] hover:bg-[#FEF7E6]/40 transition-colors cursor-pointer"
                      >
                        <ImageIcon className="mx-auto h-8 w-8 text-[#98A2B3] mb-2" />
                        <p className="text-xs font-bold text-[#172033]">
                          Click to browse or drop payment receipt screenshot
                        </p>
                        <p className="text-[11px] text-[#667085] mt-0.5">
                          High-resolution mobile screenshots are automatically optimized.
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="rounded-[8px] border border-[#C3E6CB] bg-[#EAF7EE] p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-[6px] bg-white border border-[#C3E6CB] overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={proofPreview}
                              alt="Payment Proof Preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#198754] truncate">
                              {proofFileName || 'payment_receipt.jpg'}
                            </p>
                            <p className="text-[11px] text-[#106A3B]">
                              ✓ Ready for verification
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeProofFile}
                          className="rounded-[6px] bg-white border border-[#F8C4C2] p-1.5 text-[#C2413B] hover:bg-[#FDECEC] transition-colors"
                          title="Remove attached receipt"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* UTR / Transaction Reference (Optional if screenshot is attached) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#172033]">
                        12-Digit UPI / Bank UTR Reference Number
                      </label>
                      <span className="text-[11px] text-[#667085]">
                        {proofPreview ? '(Optional if receipt uploaded)' : '(Required if no receipt)'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. 428910293810"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none font-mono"
                    />
                    <p className="text-[11px] text-[#667085] mt-1">
                      Located in your GPay, PhonePe, Paytm, or Bank SMS transaction summary.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOfflinePaymentSubmit}
                    disabled={verifyingPayment}
                    className="w-full rounded-[7px] bg-[#C98219] py-3.5 text-sm font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {verifyingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting Payment Proof...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Submit Registration Payment & Proof</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

        {/* STEP 3: Success or Admin Verification Pending */}
        {step === 'SUCCESS' && (
          isAutoActivated ? (
            <div className="rounded-[10px] border border-[#C3E6CB] bg-[#EAF7EE] p-8 text-center space-y-5 shadow-subtle animate-in fade-in">
              <div className="mx-auto h-16 w-16 rounded-full bg-white border border-[#C3E6CB] flex items-center justify-center shadow-xs">
                <CheckCircle2 className="h-10 w-10 text-[#198754]" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#198754]">Account Successfully Activated!</h2>
                <p className="text-sm text-[#106A3B] mt-1 max-w-md mx-auto">
                  Your centre is now fully onboarded under SevaTN with 1-year active operational validity and 5 KM geofenced access.
                </p>
              </div>

              {activatedCentre && (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#C3E6CB] bg-white px-4 py-1.5 text-xs font-mono font-bold text-[#198754] shadow-xs">
                  <span>Centre Code: <strong>{activatedCentre.centreCode || 'TN-CENTRE'}</strong></span>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="rounded-[7px] bg-[#C98219] px-7 py-3 text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle inline-flex items-center gap-2"
                >
                  <span>Enter SevaTN Centre Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6] p-8 text-center space-y-5 shadow-subtle animate-in fade-in">
              <div className="mx-auto h-16 w-16 rounded-full bg-white border border-[#F9DE9B] flex items-center justify-center shadow-xs">
                <Clock className="h-9 w-9 text-[#C98219]" />
              </div>

              <div>
                <span className="rounded-full bg-[#FEF7E6] border border-[#F9DE9B] px-3.5 py-1 text-xs font-extrabold text-[#8F5A0D] uppercase tracking-wider inline-block mb-2">
                  Status: Pending Admin & Partner Verification
                </span>
                <h2 className="text-2xl font-bold text-[#172033]">Registration Payment Submitted!</h2>
                <p className="text-xs sm:text-sm text-[#8F5A0D] mt-2 max-w-lg mx-auto leading-relaxed">
                  Your offline onboarding fee payment proof has been submitted. The Platform Administrator and your authorized partner (<strong className="text-[#172033]">{invitation?.partner?.name}</strong>) have received your submission in real time via live WebSocket.
                </p>
              </div>

              {/* Submitted Proof Details Box */}
              <div className="rounded-[8px] bg-white border border-[#F9DE9B] p-4 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between items-center text-[#667085]">
                  <span>Centre Name:</span>
                  <span className="font-bold text-[#172033]">{centreName}</span>
                </div>
                {paymentReference && (
                  <div className="flex justify-between items-center text-[#667085]">
                    <span>Reference / UTR:</span>
                    <span className="font-mono font-bold text-[#8F5A0D]">{paymentReference}</span>
                  </div>
                )}
                {proofPreview && (
                  <div className="pt-2 border-t border-[#E6EAF0] flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-[#F8FAFC] border border-[#E6EAF0] overflow-hidden shrink-0 flex items-center justify-center">
                      <img src={proofPreview} alt="Proof" className="h-full w-full object-cover" />
                    </div>
                    <span className="text-[11px] text-[#198754] font-medium">✓ Receipt Screenshot Attached</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-[#667085] max-w-md mx-auto">
                Once approved, you will be able to log in immediately using your registered email and password.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="rounded-[7px] bg-[#C98219] px-7 py-3 text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle inline-flex items-center gap-2"
                >
                  <span>Go to Sign In Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
