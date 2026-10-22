'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import {
  UserCheck,
  Building,
  CreditCard,
  CheckCircle2,
  Calendar,
  Lock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertCircle,
  Edit2,
  X,
  ArrowRight,
  RotateCcw,
  KeyRound,
} from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locSuccess, setLocSuccess] = useState<string | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  // Email Change Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<'INPUT' | 'OTP' | 'SUCCESS'>('INPUT');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [emailCooldown, setEmailCooldown] = useState(0);

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

  const loadProfile = () => {
    api.getMe()
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

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
      // Update local storage cached user
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

  const handleUpdateGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser. Please use a modern browser with GPS/location support.');
      setLocSuccess(null);
      return;
    }

    if (profile?.registeredLocation) {
      setLocError('Registered service location is locked for security purposes. Only a Super Administrator can change centre coordinates.');
      return;
    }

    setLocating(true);
    setLocSuccess(null);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Enforce 2,500m accuracy validation client-side before submission
        if (accuracy > 2500) {
          setLocError(
            `Location accuracy is too low (~${Math.round(accuracy)}m). SevaTN 5 KM geofence requires accuracy under 2,500m. Please enable precise device location, connect to Wi-Fi, or use a GPS-enabled device.`
          );
          setLocating(false);
          return;
        }

        try {
          await api.updateLocation({
            latitude,
            longitude,
            accuracy,
            district: profile?.centre?.district,
            address: profile?.centre?.address,
          });
          setLocSuccess(`GPS Location successfully updated and synced with 5 KM geofence (Accuracy: ~${Math.round(accuracy)}m)!`);
          loadProfile();
        } catch (err: any) {
          setLocError(`Failed to update service location: ${err.message}`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocError('Location permission denied. Please allow location access in your browser settings to sync your centre GPS.');
            break;
          case err.POSITION_UNAVAILABLE:
            setLocError('Location position unavailable. Please ensure your device has location/GPS services enabled or connect to Wi-Fi.');
            break;
          case err.TIMEOUT:
            setLocError('Location request timed out. Please try again.');
            break;
          default:
            setLocError(`GPS Error: ${err.message}`);
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[#667085]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C98219]" />
      </div>
    );
  }

  const centre = profile?.centre;
  const user = profile?.user;
  const partner = profile?.partner;
  const location = profile?.registeredLocation;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="pb-4 border-b border-[#E6EAF0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#8F5A0D] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5 text-[#C98219]" />
            <span>SevaTN — Operator Profile</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033]">Centre Profile &amp; Authorization</h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Your registered eSevai centre credentials, regional partner affiliation, and 5 KM service location.
          </p>
        </div>
        <span className="rounded bg-[#EAF7EE] px-3 py-1 text-xs font-bold text-[#198754] border border-[#C3E6CB] self-start sm:self-auto">
          Authorized Centre
        </span>
      </div>

      {/* Centre Status & Identification Banner */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B] font-bold shadow-subtle">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#172033]">
                {centre?.centreName || user?.name}
              </h2>
              <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-xs font-mono font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                {centre?.centreCode || 'TN-CENTRE'}
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Tamil Nadu eSevai Network • {centre?.taluk ? `${centre.taluk}, ` : ''}{centre?.district || 'Tamil Nadu'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-[11px] text-[#667085] block">Platform License Validity</span>
            <span className="font-mono font-bold text-[#8F5A0D]">
              {user?.expiryDate ? formatDate(user.expiryDate) : 'Active License'}
            </span>
          </div>
        </div>
      </div>

      {locSuccess && (
        <div className="rounded-[8px] border border-[#C3E6CB] bg-[#EAF7EE] p-3 text-xs text-[#198754] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#198754]" />
          <span>{locSuccess}</span>
        </div>
      )}

      {locError && (
        <div className="rounded-[8px] border border-[#F5C2C7] bg-[#F8D7DA] p-3 text-xs text-[#842029] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#842029]" />
          <span>{locError}</span>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Registered Service Location (5 KM Geofence) */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#C98219]" />
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                5 KM Service Location
              </h3>
            </div>
            {location ? (
              <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#F8F9FA] border border-[#E6EAF0] px-2.5 py-1 text-[11px] font-semibold text-[#667085]">
                <Lock className="h-3 w-3 text-[#667085]" />
                Location Locked
              </span>
            ) : (
              <button
                onClick={handleUpdateGPS}
                disabled={locating}
                className="rounded-[6px] bg-[#FEF7E6] border border-[#F9DE9B] px-2.5 py-1 text-[11px] font-bold text-[#8F5A0D] hover:bg-[#FAF3E7] transition-colors disabled:opacity-50"
              >
                {locating ? 'Registering...' : 'Register GPS (Once)'}
              </button>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Geofence Status:</span>
              {location ? (
                <span className="font-bold text-[#198754] flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#198754] inline-block" />
                  Active &amp; Locked (5 KM Radius)
                </span>
              ) : (
                <span className="font-bold text-[#B07210] flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#D97706] inline-block" />
                  Not Configured (Click &apos;Register GPS&apos;)
                </span>
              )}
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Registered Latitude:</span>
              <span className="font-mono font-bold text-[#172033]">
                {location?.latitude !== undefined && location?.latitude !== null ? location.latitude.toFixed(4) : 'Not configured'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Registered Longitude:</span>
              <span className="font-mono font-bold text-[#172033]">
                {location?.longitude !== undefined && location?.longitude !== null ? location.longitude.toFixed(4) : 'Not configured'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">GPS Accuracy:</span>
              <span className="font-mono text-[#475467]">
                {location?.accuracy !== undefined && location?.accuracy !== null ? `~${Math.round(location.accuracy)} meters` : '—'}
              </span>
            </div>
            <div className="py-1">
              <span className="text-[#667085] block mb-1">Physical Address:</span>
              <span className="text-[#172033] font-medium">{centre?.address || location?.address || '—'}</span>
            </div>

            {location && (
              <div className="rounded-[6px] bg-[#F8F9FA] border border-[#E9ECEF] p-2.5 text-[11px] text-[#667085] flex items-start gap-2 mt-2">
                <Lock className="h-3.5 w-3.5 shrink-0 text-[#6C757D] mt-0.5" />
                <span>
                  For security and compliance, once registered, this centre&apos;s default GPS coordinates are permanently locked. Only a Super Administrator can modify coordinates.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Partner & Operator Details */}
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E6EAF0]">
            <UserCheck className="h-4 w-4 text-[#C98219]" />
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Operator &amp; Partner Affiliation
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Authorized Partner:</span>
              <span className="font-bold text-[#8F5A0D]">
                {partner?.name || 'NIJA Digital Network (PT-001)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Operator Name:</span>
              <span className="font-bold text-[#172033]">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Login Email:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#172033] font-semibold">{user?.email}</span>
                <button
                  type="button"
                  onClick={handleOpenEmailModal}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-[#8F5A0D] bg-[#FEF7E6] border border-[#F9DE9B] hover:bg-[#FAF3E7] transition-colors cursor-pointer"
                  title="Change Email Address"
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
            <div className="flex justify-between py-1">
              <span className="text-[#667085]">Account Status:</span>
              <span className="px-2 py-0.5 rounded bg-[#EAF7EE] text-[#198754] font-bold text-[11px] border border-[#C3E6CB]">
                {user?.status || 'ACTIVE'}
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
                        placeholder="newoperator@gmail.com"
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
