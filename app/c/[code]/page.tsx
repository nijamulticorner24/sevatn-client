'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Building2,
  MapPin,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Phone,
  Mail,
  User,
  Copy,
  Check,
  HelpCircle,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function CentreUniqueLoginPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params?.code as string;
  const centreCode = rawCode ? decodeURIComponent(rawCode).trim() : '';

  const [centre, setCentre] = useState<any>(null);
  const [loadingCentre, setLoadingCentre] = useState(true);
  const [centreError, setCentreError] = useState<string | null>(null);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (!centreCode) {
      setCentreError('No Centre Code specified in the URL.');
      setLoadingCentre(false);
      return;
    }

    setLoadingCentre(true);
    setCentreError(null);

    api
      .getPublicCentreInfo(centreCode)
      .then((data) => {
        setCentre(data);
        if (data.loginEmail) {
          setIdentifier(data.loginEmail);
        } else if (data.centreCode) {
          setIdentifier(data.centreCode);
        }
      })
      .catch((err: any) => {
        setCentreError(err.message || 'Centre with this unique code was not found or is currently inactive.');
      })
      .finally(() => {
        setLoadingCentre(false);
      });
  }, [centreCode]);

  const handleCopyPortalUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setLoginError('Please enter your login identifier and password.');
      return;
    }

    setSubmitting(true);
    setLoginError(null);

    try {
      const res = await api.login(identifier.trim(), password, centre?.centreCode || centreCode);
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
      setLoginError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1526] text-white flex flex-col justify-between selection:bg-[#C98219] selection:text-white">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 border-b border-white/10 bg-[#0E1526]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#C98219] to-[#995E0B] text-white font-bold shadow-lg shadow-[#C98219]/20 transition-transform group-hover:scale-105">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-white tracking-tight">
                Seva<span className="text-[#F5A623]">TN</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Centre Portal
              </span>
            </div>
            <p className="text-[10px] text-white/50 hidden sm:block">Tamil Nadu Citizen Services & Ticket Assist Platform</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {centre && (
            <button
              onClick={handleCopyPortalUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-colors cursor-pointer"
              title="Copy this Unique Centre URL"
            >
              {copiedUrl ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-[11px]">URL Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-white/60" />
                  <span className="text-[11px] font-medium hidden sm:inline">Copy Portal Link</span>
                </>
              )}
            </button>
          )}

          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 hover:text-white transition-colors"
          >
            <span>General Login</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          {loadingCentre ? (
            <div className="rounded-2xl border border-white/10 bg-[#162036]/90 backdrop-blur-xl p-10 text-center shadow-2xl animate-pulse space-y-4">
              <div className="h-12 w-12 rounded-full bg-white/10 mx-auto flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-[#C98219] animate-spin" />
              </div>
              <h3 className="text-base font-semibold text-white">Resolving Centre Information...</h3>
              <p className="text-xs text-white/50">Verifying unique centre authorization with Tamil Nadu SevaTN directory.</p>
            </div>
          ) : centreError ? (
            <div className="rounded-2xl border border-red-500/20 bg-[#162036]/95 backdrop-blur-xl p-8 text-center shadow-2xl space-y-5">
              <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/30 mx-auto flex items-center justify-center text-red-400">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Centre Link Not Found</h3>
                <p className="text-xs text-white/60 mt-1 max-w-md mx-auto leading-relaxed">
                  {centreError}
                </p>
                <div className="mt-3 inline-block font-mono text-[11px] px-3 py-1 rounded bg-black/30 border border-white/10 text-amber-300">
                  Requested Code: {centreCode || 'N/A'}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/auth/login"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#C98219] hover:bg-[#B57414] text-xs font-bold text-white transition-all shadow-lg shadow-[#C98219]/25 flex items-center justify-center gap-2"
                >
                  <span>Go to General Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/contact"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 transition-all flex items-center justify-center gap-2"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Contact Technical Support</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/15 bg-[#162036]/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-all">
              {/* Centre Header Banner */}
              <div className="relative bg-gradient-to-r from-[#17233D] via-[#1A2846] to-[#1E2E4F] border-b border-white/10 p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#C98219]/20 text-[#F5A623] border border-[#C98219]/40 tracking-wider">
                        {centre.centreCode}
                      </span>
                      {centre.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ACTIVE & AUTHORIZED
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {centre.status}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white pt-1 tracking-tight">
                      {centre.centreName}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-white/70 pt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-[#C98219]" />
                      <span>{centre.taluk}, {centre.district} District</span>
                      {centre.pincode && <span>— {centre.pincode}</span>}
                    </div>
                  </div>

                  <div className="hidden sm:flex h-12 w-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>

                {/* Operator Welcome Pill */}
                {centre.operatorName && (
                  <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/90">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span>
                        Operator: <strong className="text-white font-semibold">{centre.operatorName}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50 hidden sm:inline">
                      Dedicated Station Portal
                    </span>
                  </div>
                )}
              </div>

              {/* Sign In Form Body */}
              <div className="p-6 sm:p-7 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#C98219]" />
                    <span>Operator Sign In</span>
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Enter your authorized password to access your centre booking console
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Identifier Input */}
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1.5">
                      Login Identifier (Email, Mobile, or Centre Code)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. operator@example.com or mobile"
                        className="w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C98219] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-white/80">
                        Password
                      </label>
                      <Link
                        href="/auth/login"
                        className="text-[11px] text-[#F5A623] hover:text-[#FFB84D] transition-colors"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your private or temporary password"
                        className="w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-10 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C98219] focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Temporary Password Activation Hint */}
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
                    <KeyRound className="h-4 w-4 text-[#F5A623] shrink-0 mt-0.5" />
                    <div>
                      <strong>First-Time Sign In?</strong> Use the temporary password issued by the Super Administrator. You will be prompted to create your new permanent private password upon entering.
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C98219] to-[#995E0B] hover:from-[#D98E1F] hover:to-[#A7680D] text-white font-bold text-xs tracking-wide shadow-lg shadow-[#C98219]/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying & Opening Console...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to {centre.centreName}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Security Footer Info */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/40">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>TLS 256-Bit Encrypted Session</span>
                  </div>
                  <div>Tamil Nadu SevaTN E-Governance Network</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#0E1526]/80 backdrop-blur-md py-4 px-4 text-center text-xs text-white/40">
        <p>© 2026 SevaTN TicketAssist. Authorized Centre Portal for Tamil Nadu Citizen Services.</p>
      </footer>
    </div>
  );
}
