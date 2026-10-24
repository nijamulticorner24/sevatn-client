'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Compass,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  Lock,
  Trash2,
  Search,
  User,
  Plus,
  Check,
} from 'lucide-react';

const OFFICIAL_ROUTES = [
  { id: 'Pamba (Regular Footpath Route)', name: 'Pamba Base', desc: 'Direct traditional footpath from Pamba base', tag: 'Standard' },
  { id: 'Nilakkal - Pamba Shuttle Route', name: 'Nilakkal Shuttle', desc: 'Vehicular shuttle route connecting to Pamba', tag: 'Shuttle' },
  { id: 'Erumeli (Perur Thodu - Kalaketty Traditional)', name: 'Erumeli Traditional', desc: 'Long sacred forest traditional pathway', tag: 'Traditional' },
  { id: 'Vandiperiyar (Sathram - Pulmedu Forest Route)', name: 'Vandiperiyar / Pulmedu', desc: 'Scenic forest route via Sathram checkpoint', tag: 'Forest' },
  { id: 'Kottaiyadi Traditional Trek', name: 'Kottaiyadi Trek', desc: 'Alternative uphill trek walkway', tag: 'Walkway' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function NewBookingPage() {
  const router = useRouter();
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [serviceFee, setServiceFee] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const termsRef = useRef<HTMLDivElement>(null);

  // Section 1: Official Devotee Account State
  const [accountMode, setAccountMode] = useState<'saved' | 'new'>('saved');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [accountLabel, setAccountLabel] = useState('');
  const [officialUsername, setOfficialUsername] = useState('');
  const [officialPassword, setOfficialPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Helper for current date in YYYY-MM-DD
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Section 2: Booking Details State
  const [requestedDate, setRequestedDate] = useState(getTodayDateStr());
  const [route, setRoute] = useState(OFFICIAL_ROUTES[0].id);

  // Compact Date Picker State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(() => {
    const d = new Date();
    return d.getFullYear();
  });
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return d.getMonth();
  });

  // Compact Route Dropdown State
  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const [routeSearch, setRouteSearch] = useState('');

  // Refs for click outside
  const calendarRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.getBookingConfig().catch(() => null),
      api.getAccounts().catch(() => []),
      api.getWallet().catch(() => null),
      api.ensureLocationCoordinates().catch(() => null),
    ]).then(([cfg, aData, wData, loc]) => {
      if (cfg && cfg.serviceFee !== undefined) {
        setServiceFee(Number(cfg.serviceFee));
      }
      if (aData && aData.length > 0) {
        setSavedAccounts(aData);
        setSelectedAccountId(aData[0].id);
        setAccountMode('saved');
        setOfficialUsername(aData[0].username);
        setOfficialPassword('••••••••••••');
      } else {
        setSavedAccounts(aData || []);
        setAccountMode('new');
      }
      if (wData) setWallet(wData);
      setWalletLoading(false);
      if (loc) {
        setLocationCoords(loc);
      }
    });
  }, []);

  // Listen for outside click to close popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (routeRef.current && !routeRef.current.contains(event.target as Node)) {
        setIsRouteOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalendarOpen(false);
        setIsRouteOpen(false);
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleAccountSelect = (accId: string) => {
    setSelectedAccountId(accId);
    setIsAccountDropdownOpen(false);
    const acc = savedAccounts.find((a) => a.id === accId);
    if (acc) {
      setOfficialUsername(acc.username);
      setOfficialPassword('••••••••••••');
      setAccountLabel(acc.label || '');
    }
  };

  const handleDeleteAccount = async (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved devotee profile?')) {
      return;
    }
    setDeletingAccountId(accountId);
    try {
      await api.deleteAccount(accountId);
      const updated = savedAccounts.filter((a) => a.id !== accountId);
      setSavedAccounts(updated);
      if (selectedAccountId === accountId) {
        if (updated.length > 0) {
          handleAccountSelect(updated[0].id);
        } else {
          setSelectedAccountId('');
          setAccountMode('new');
          setOfficialUsername('');
          setOfficialPassword('');
          setAccountLabel('');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete devotee profile');
    } finally {
      setDeletingAccountId(null);
    }
  };

  const handleModeChange = (mode: 'saved' | 'new') => {
    setAccountMode(mode);
    setIsAccountDropdownOpen(false);
    if (mode === 'new') {
      setSelectedAccountId('');
      setAccountLabel('');
      setOfficialUsername('');
      setOfficialPassword('');
    } else if (savedAccounts.length > 0) {
      handleAccountSelect(savedAccounts[0].id);
    }
  };

  // Calendar popover helpers
  const todayStr = getTodayDateStr();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const canGoPrevMonth =
    calendarYear > currentYear || (calendarYear === currentYear && calendarMonth > currentMonth);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canGoPrevMonth) return;
    if (calendarMonth === 0) {
      setCalendarYear((prev) => prev - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (calendarMonth === 11) {
      setCalendarYear((prev) => prev + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth((prev) => prev + 1);
    }
  };

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  const calendarDays: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const formatted = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, dateStr: formatted });
  }

  const handleDateSelect = (dateStr: string) => {
    if (dateStr < todayStr) return;
    setRequestedDate(dateStr);
    setIsCalendarOpen(false);
    setError(null);
  };

  // Formatted display date helper
  const formattedDisplayDate = requestedDate
    ? new Date(requestedDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  // Route filter
  const filteredRoutes = OFFICIAL_ROUTES.filter((r) => {
    const q = routeSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.desc.toLowerCase().includes(q) ||
      r.tag.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  const activeAccount = savedAccounts.find((a) => a.id === selectedAccountId);
  const currentUser = api.getUser();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const selectedRouteObj = OFFICIAL_ROUTES.find((r) => r.id === route) || OFFICIAL_ROUTES[0];
  const availableBalance = wallet ? Number(wallet.availableBalance ?? wallet.balance ?? 0) : null;
  const isInsufficientBalance = !isSuperAdmin && availableBalance !== null && availableBalance < serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 0. Validate minimum wallet balance requirement (exempt for Super Admin)
    if (!isSuperAdmin && availableBalance !== null && availableBalance < serviceFee) {
      setError(`Insufficient wallet balance. You need at least ₹${serviceFee} (service fee) to request this service. Please recharge your wallet.`);
      return;
    }

    // 1. Check whether the user has accepted the required Terms & Conditions
    if (!termsAccepted) {
      const termsMsg = 'Please accept the Terms & Conditions and Refund Policy before continuing.';
      setError(termsMsg);
      setTermsError(true);
      if (termsRef.current) {
        termsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setTermsError(false);

    // 2. Validate required booking fields
    if (accountMode === 'new' && (!officialUsername.trim() || !officialPassword)) {
      setError('Please provide your official registered username/mobile and password.');
      return;
    }

    if (accountMode === 'saved' && !selectedAccountId) {
      setError('Please select an active saved account or enter new credentials.');
      return;
    }

    if (!requestedDate) {
      setError('Please select preferred darshan date.');
      return;
    }

    if (!route) {
      setError('Please select an approved entry route.');
      return;
    }

    // Set loading to prevent duplicate clicks and requests
    setLoading(true);

    try {
      // 3. Validate current dynamically calculated fee with the backend
      try {
        const cfg = await api.getBookingConfig();
        if (cfg && cfg.serviceFee !== undefined) {
          setServiceFee(Number(cfg.serviceFee));
        }
      } catch (_) {
        // Fallback to currently loaded service fee
      }

      // 4. Resolve coordinates for mandatory 5 KM Geofence validation
      let coords = api.getLocationCoordinates();
      if (!coords) {
        coords = await api.ensureLocationCoordinates();
      }

      // 5. Submit the booking request using existing booking flow
      const payload: any = {
        requestedDate,
        route,
        termsAccepted: true,
        idempotencyKey: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };

      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
        payload.accuracy = coords.accuracy;
      }

      if (accountMode === 'saved') {
        payload.accountId = selectedAccountId;
      } else {
        payload.username = officialUsername.trim();
        payload.password = officialPassword;
        if (accountLabel.trim()) {
          payload.accountLabel = accountLabel.trim();
          payload.label = accountLabel.trim();
        }
      }

      await api.createBooking(payload);

      // 5. Show "Booking request submitted" only when backend confirms request was successfully queued
      setSuccessMsg('Booking request submitted');
      setTimeout(() => {
        router.push(isSuperAdmin ? '/admin/bookings' : '/dashboard/bookings');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please verify your balance and account details.');
      setLoading(false);
    }
  };

  if (walletLoading) {
    return (
      <div className="w-full max-w-[1300px] mx-auto py-20 flex flex-col items-center justify-center space-y-3">
        <div className="h-9 w-9 border-3 border-[#C98219]/20 border-t-[#C98219] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#667085]">Checking wallet balance...</p>
      </div>
    );
  }

  if (isInsufficientBalance) {
    return (
      <div className="w-full max-w-[620px] mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-200">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#667085] hover:text-[#C98219] transition-colors mb-4"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="rounded-[12px] border border-[#FCD34D] bg-white p-7 sm:p-9 shadow-card text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] shadow-subtle">
            <Lock className="h-7 w-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">
              Wallet Balance Required to Open Booking
            </h2>
            <p className="text-[13px] text-[#667085] max-w-md mx-auto leading-relaxed">
              This service requires a minimum wallet balance of <strong className="text-[#172033]">₹{serviceFee}</strong> (Booking Fee). Please recharge your wallet to open and access the new booking request form.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto p-3.5 rounded-[9px] bg-[#FAFBFD] border border-[#E6EAF0]">
            <div className="text-center border-r border-[#E6EAF0] pr-2">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#667085]">
                Current Balance
              </span>
              <span className="text-base font-extrabold text-[#DC2626] tabular-nums">
                ₹{(availableBalance ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-center pl-2">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#667085]">
                Minimum Required
              </span>
              <span className="text-base font-extrabold text-[#15803D] tabular-nums">
                ₹{serviceFee.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#8F5A0D] bg-[#FEF7E6] border border-[#F9DE9B] rounded-[8px] p-2.5 max-w-sm mx-auto">
            Once you add funds (at least <strong>₹{serviceFee}</strong>) to your wallet, this booking page will open immediately.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/wallet"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] px-6 py-2.5 text-[13px] font-bold text-white transition-all shadow-subtle hover:shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Add Funds to Wallet</span>
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[8px] border border-[#D0D5DD] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1300px] mx-auto space-y-5">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6EAF0]">
        <div>
          <Link
            href={isSuperAdmin ? "/admin/bookings" : "/dashboard/bookings"}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#667085] hover:text-[#C98219] transition-colors mb-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>{isSuperAdmin ? "Back to Central Queue" : "Back to Bookings"}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#172033] tracking-tight">
              Create Booking Request
            </h1>
            {isSuperAdmin && (
              <span className="rounded bg-[#FEF7E6] px-2.5 py-0.5 text-[11px] font-bold text-[#8F5A0D] border border-[#F9DE9B] flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#C98219]" />
                Super Admin Mode
              </span>
            )}
            {locationCoords && (
              <span className="rounded bg-[#EAF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#155724] border border-[#C3E6CB] flex items-center gap-1.5" title={`GPS: ${locationCoords.latitude.toFixed(4)}, ${locationCoords.longitude.toFixed(4)}`}>
                <span className="h-2 w-2 rounded-full bg-[#198754] inline-block animate-pulse" />
                5 KM Geofence Ready
              </span>
            )}
          </div>
          <p className="text-[12.5px] text-[#667085] mt-0.5">
            Configure booking parameters and assign an official devotee account for automated monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={isSuperAdmin ? "/admin/bookings" : "/dashboard/bookings"}
            className="rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Insufficient Wallet Balance Warning Alert */}
      {isInsufficientBalance && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[10px] border border-[#FCD34D] bg-[#FFFBEB] p-4 text-[#92400E] shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-[8px] bg-[#FEF3C7] text-[#D97706] shrink-0 mt-0.5">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-[13.5px] font-bold text-[#92400E]">
                Minimum Wallet Balance Required (₹{serviceFee})
              </h4>
              <p className="text-[12px] text-[#B45309] mt-0.5">
                To create a booking request for this service, your wallet needs a minimum balance of <span className="font-bold">₹{serviceFee}</span>. Your current available balance is <span className="font-bold text-[#B91C1C]">₹{availableBalance.toLocaleString('en-IN')}</span>. Please recharge your wallet to proceed.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/wallet"
            className="inline-flex items-center justify-center gap-1.5 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] px-4 py-2 text-[12px] font-bold text-white transition-all shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Funds to Wallet</span>
          </Link>
        </div>
      )}

      {/* Error & Success Feedback Alerts */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-[8px] border border-[#F8C4C2] bg-[#FDECEC] p-3 text-[12.5px] text-[#992B26] shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 text-[#C2413B] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Booking Request Notice</p>
            <p className="mt-0.5 text-[12px] text-[#A8322B]">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-[8px] border border-[#C3E6CB] bg-[#EAF7EE] p-3 text-[12.5px] text-[#155724] shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-[#198754] shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Main Single-Scroll Grid: Left Form (7 cols lg), Right Sticky Summary (5 cols lg) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Compact Form Controls */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* SECTION 1: OFFICIAL DEVOTEE ACCOUNT */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 sm:p-5 shadow-subtle space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#FEF7E6] text-[#C98219]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[13.5px] font-bold text-[#172033]">
                    1. Official Devotee Account
                  </h2>
                  <p className="text-[11px] text-[#667085]">
                    Devotee account registered on official booking portal
                  </p>
                </div>
              </div>

              {/* Saved vs New Toggle */}
              <div className="flex items-center rounded-[7px] bg-[#F1F4F9] p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => handleModeChange('saved')}
                  disabled={savedAccounts.length === 0}
                  className={`px-2.5 py-1 rounded-[5px] transition-all ${
                    accountMode === 'saved'
                      ? 'bg-white text-[#172033] shadow-subtle font-bold'
                      : 'text-[#667085] hover:text-[#172033] disabled:opacity-40'
                  }`}
                >
                  Saved ({savedAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('new')}
                  className={`px-2.5 py-1 rounded-[5px] transition-all ${
                    accountMode === 'new'
                      ? 'bg-white text-[#172033] shadow-subtle font-bold'
                      : 'text-[#667085] hover:text-[#172033]'
                  }`}
                >
                  + New
                </button>
              </div>
            </div>

            {/* 1-Line Credential Verification Disclaimer */}
            <div className="flex items-center gap-2 rounded-[7px] border border-[#FEE4E2] bg-[#FEF3F2] px-3 py-2 text-[11.5px] text-[#B42318] shadow-2xs">
              <AlertCircle className="h-4 w-4 text-[#D92D20] shrink-0" />
              <span>
                <strong className="font-semibold text-[#912018]">Important:</strong> Please verify the username and password — if account credentials are wrong or fail verification, the booking will be cancelled.
              </span>
            </div>

            {/* Saved Account Compact Dropdown */}
            {accountMode === 'saved' && savedAccounts.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[11.5px] font-bold text-[#475467] uppercase tracking-wider">
                  Select Associated Devotee Profile <span className="text-[#C2413B]">*</span>
                </label>

                <div className="relative" ref={accountDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-[13px] text-[#172033] flex items-center justify-between hover:border-[#C98219] focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 transition-all text-left shadow-xs"
                    aria-haspopup="listbox"
                    aria-expanded={isAccountDropdownOpen}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-6 w-6 rounded-full bg-[#FEF7E6] text-[#C98219] font-bold text-[11px] flex items-center justify-center shrink-0 border border-[#F9DE9B]">
                        {(activeAccount?.label || activeAccount?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-[#172033] mr-1.5">
                          {activeAccount?.label || activeAccount?.username || 'Select Devotee Profile'}
                        </span>
                        {activeAccount?.label && (
                          <span className="text-[11.5px] text-[#667085] font-mono">
                            ({activeAccount.username})
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-[#98A2B3] shrink-0 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isAccountDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1.5 z-40 w-full bg-white rounded-[8px] border border-[#E6EAF0] shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[260px] overflow-y-auto">
                      <div className="p-1 space-y-0.5">
                        {savedAccounts.map((acc) => {
                          const isSelected = selectedAccountId === acc.id;
                          return (
                            <div
                              key={acc.id}
                              onClick={() => handleAccountSelect(acc.id)}
                              className={`flex items-center justify-between p-2.5 rounded-[6px] cursor-pointer transition-colors ${
                                isSelected ? 'bg-[#FDF7ED] text-[#172033]' : 'hover:bg-[#F8FAFC] text-[#344054]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                  isSelected ? 'bg-[#C98219] text-white' : 'bg-[#F2F4F7] text-[#475467]'
                                }`}>
                                  {(acc.label || acc.username).charAt(0).toUpperCase()}
                                </div>
                                <div className="truncate">
                                  <p className="text-[12.5px] font-bold text-[#172033] truncate">
                                    {acc.label || acc.username}
                                  </p>
                                  <p className="text-[11px] text-[#667085] font-mono truncate">
                                    {acc.username}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {isSelected && (
                                  <Check className="h-4 w-4 text-[#C98219]" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteAccount(e, acc.id)}
                                  disabled={deletingAccountId === acc.id}
                                  className="p-1 text-[#98A2B3] hover:text-[#C2413B] hover:bg-[#FDECEC] rounded transition-colors"
                                  title="Delete saved profile"
                                >
                                  {deletingAccountId === acc.id ? (
                                    <div className="h-3 w-3 border-2 border-[#C2413B]/30 border-t-[#C2413B] rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* New Account Inputs */}
            {accountMode === 'new' && (
              <div className="space-y-3 pt-0.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11.5px] font-semibold text-[#344054]">
                      Account Reference Name
                    </label>
                    <span className="text-[10px] font-medium text-[#667085] bg-[#F1F4F9] px-1.5 py-0.5 rounded">
                      Reference Tag
                    </span>
                  </div>
                  <input
                    type="text"
                    value={accountLabel}
                    onChange={(e) => setAccountLabel(e.target.value)}
                    placeholder="e.g. Ramesh Family, Chennai Mandalam, Devotee 1"
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-[12.5px] text-[#172033] placeholder:text-[#98A2B3] focus:border-[#C98219] focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#344054] mb-1">
                      Registered Mobile / Email <span className="text-[#C2413B]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={officialUsername}
                      onChange={(e) => setOfficialUsername(e.target.value)}
                      placeholder="e.g. 9876543210 or devotee@gmail.com"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-[12.5px] text-[#172033] placeholder:text-[#98A2B3] focus:border-[#C98219] focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#344054] mb-1">
                      Official Portal Password <span className="text-[#C2413B]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={officialPassword}
                        onChange={(e) => setOfficialPassword(e.target.value)}
                        placeholder="Enter account password"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 pr-9 text-[12.5px] font-mono text-[#172033] placeholder:text-[#98A2B3] focus:border-[#C98219] focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-[#98A2B3] hover:text-[#172033] transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-[6px] bg-[#F7F9FC] border border-[#E6EAF0] p-2 text-[11px] text-[#667085]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#198754] shrink-0 mt-0.5" />
                  <span>
                    Credentials are encrypted in-transit via AES-256 and only used in isolated local worker sessions.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: SCHEDULE & ROUTE (COMPACT 2-COLUMN ARRANGEMENT) */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 sm:p-5 shadow-subtle space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E6EAF0]">
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#FEF7E6] text-[#C98219]">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-[13.5px] font-bold text-[#172033]">
                  2. Schedule & Route
                </h2>
                <p className="text-[11px] text-[#667085]">
                  Compact date picker and approved entry route selection
                </p>
              </div>
            </div>

            {/* 2-Column Responsive Arrangement on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
              {/* COMPACT DATE PICKER */}
              <div className="space-y-1.5" ref={calendarRef}>
                <label className="block text-[11.5px] font-bold text-[#344054] uppercase tracking-wider">
                  Preferred Darshan Date <span className="text-[#C2413B]">*</span>
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCalendarOpen(!isCalendarOpen);
                      setIsRouteOpen(false);
                    }}
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-[13px] text-[#172033] flex items-center justify-between hover:border-[#C98219] focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 transition-all text-left shadow-xs"
                    aria-label="Select Darshan Date"
                    aria-expanded={isCalendarOpen}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calendar className="h-4 w-4 text-[#C98219] shrink-0" />
                      <span className="font-semibold text-[#172033] truncate">
                        {formattedDisplayDate || 'Select a darshan date'}
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-[#98A2B3] shrink-0 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Calendar Popover (Appears on Top) */}
                  {isCalendarOpen && (
                    <div className="absolute bottom-full left-0 mb-1.5 z-50 w-full sm:w-[310px] max-w-[calc(100vw-32px)] bg-white rounded-[10px] border border-[#E6EAF0] shadow-modal p-3 animate-in fade-in zoom-in-95 duration-100">
                      {/* Month/Year Header */}
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#F0F3F8]">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          disabled={!canGoPrevMonth}
                          className="h-7 w-7 rounded-[5px] flex items-center justify-center text-[#667085] hover:bg-[#F2F4F7] hover:text-[#172033] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        <span className="text-[13px] font-bold text-[#172033]">
                          {MONTH_NAMES[calendarMonth]} {calendarYear}
                        </span>

                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="h-7 w-7 rounded-[5px] flex items-center justify-center text-[#667085] hover:bg-[#F2F4F7] hover:text-[#172033] transition-colors"
                          aria-label="Next month"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Day Labels */}
                      <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {DAY_LABELS.map((lbl) => (
                          <span key={lbl} className="text-[10.5px] font-semibold text-[#98A2B3] py-0.5">
                            {lbl}
                          </span>
                        ))}
                      </div>

                      {/* Days Grid */}
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {calendarDays.map((item, idx) => {
                          if (!item) {
                            return <div key={`empty-${idx}`} className="h-7" />;
                          }

                          const isPast = item.dateStr < todayStr;
                          const isSelected = item.dateStr === requestedDate;
                          const isToday = item.dateStr === todayStr;

                          return (
                            <button
                              key={item.dateStr}
                              type="button"
                              disabled={isPast}
                              onClick={() => handleDateSelect(item.dateStr)}
                              className={`h-7 w-full text-[12px] font-medium rounded-[5px] flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-[#C98219] text-white font-bold shadow-xs'
                                  : isPast
                                  ? 'text-[#D0D5DD] cursor-not-allowed'
                                  : isToday
                                  ? 'bg-[#FEF7E6] text-[#8F5A0D] font-bold border border-[#F9DE9B]'
                                  : 'text-[#344054] hover:bg-[#F9FAFB] hover:text-[#C98219]'
                              }`}
                            >
                              {item.day}
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick Actions Footer */}
                      <div className="mt-2.5 pt-2 border-t border-[#F0F3F8] flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleDateSelect(todayStr)}
                          className="font-semibold text-[#C98219] hover:underline"
                        >
                          Today ({todayStr})
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCalendarOpen(false)}
                          className="font-semibold text-[#667085] hover:text-[#172033]"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COMPACT ROUTE DROPDOWN */}
              <div className="space-y-1.5" ref={routeRef}>
                <label className="block text-[11.5px] font-bold text-[#344054] uppercase tracking-wider">
                  Select Approved Entry Route <span className="text-[#C2413B]">*</span>
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRouteOpen(!isRouteOpen);
                      setIsCalendarOpen(false);
                    }}
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-[13px] text-[#172033] flex items-center justify-between hover:border-[#C98219] focus:outline-none focus:ring-2 focus:ring-[#C98219]/20 transition-all text-left shadow-xs"
                    aria-label="Select Approved Entry Route"
                    aria-expanded={isRouteOpen}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Compass className="h-4 w-4 text-[#C98219] shrink-0" />
                      <div className="truncate flex items-center gap-2">
                        <span className="font-semibold text-[#172033] truncate">
                          {selectedRouteObj ? selectedRouteObj.name : 'Select an approved route'}
                        </span>
                        {selectedRouteObj && (
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#8F5A0D] bg-[#FEF7E6] border border-[#F9DE9B] px-1.5 py-0.5 rounded shrink-0">
                            {selectedRouteObj.tag}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-[#98A2B3] shrink-0 transition-transform ${isRouteOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Route Dropdown Menu (Appears on Top) */}
                  {isRouteOpen && (
                    <div className="absolute bottom-full left-0 mb-1.5 z-50 w-full bg-white rounded-[10px] border border-[#E6EAF0] shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[300px]">
                      {/* Search box inside dropdown */}
                      <div className="p-2 border-b border-[#E6EAF0] bg-[#FAFBFD] sticky top-0 z-10">
                        <div className="relative">
                          <Search className="h-3.5 w-3.5 text-[#98A2B3] absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Filter routes..."
                            value={routeSearch}
                            onChange={(e) => setRouteSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-[5px] border border-[#D0D5DD] bg-white focus:outline-none focus:border-[#C98219]"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Routes List */}
                      <div className="p-1 space-y-0.5 overflow-y-auto">
                        {filteredRoutes.length === 0 ? (
                          <div className="p-3 text-center text-[12px] text-[#667085]">
                            No matching routes found
                          </div>
                        ) : (
                          filteredRoutes.map((r) => {
                            const isSelected = route === r.id;
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setRoute(r.id);
                                  setIsRouteOpen(false);
                                  setRouteSearch('');
                                  setError(null);
                                }}
                                className={`w-full text-left p-2.5 rounded-[6px] transition-colors flex items-start justify-between gap-2 ${
                                  isSelected
                                    ? 'bg-[#FDF7ED] text-[#172033] border-l-2 border-[#C98219]'
                                    : 'hover:bg-[#F8FAFC] text-[#344054]'
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[12.5px] font-bold text-[#172033] truncate">
                                      {r.name}
                                    </span>
                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#8F5A0D] bg-[#FEF7E6] border border-[#F9DE9B] px-1.5 py-0.2 rounded shrink-0">
                                      {r.tag}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#667085] line-clamp-1">
                                    {r.desc}
                                  </p>
                                </div>

                                {isSelected && (
                                  <Check className="h-4 w-4 text-[#C98219] shrink-0 mt-0.5" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Execution Assurance (Sticky Desktop, Single Scroll) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-4">
          {/* Summary Card */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 sm:p-5 shadow-subtle space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C98219]" />
                <h3 className="text-[13.5px] font-bold text-[#172033]">
                  Booking Summary
                </h3>
              </div>
              <span className="text-[10.5px] font-semibold text-[#198754] bg-[#EAF7EE] border border-[#C3E6CB] px-2 py-0.5 rounded-full">
                Zero Advance Risk
              </span>
            </div>

            {/* Parameter Review */}
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center justify-between py-1 border-b border-[#F0F3F8]">
                <span className="text-[#667085]">Devotee Profile</span>
                <span className="font-semibold text-[#172033] max-w-[160px] truncate text-right">
                  {accountMode === 'saved'
                    ? activeAccount?.label
                      ? `${activeAccount.label} (${activeAccount.username})`
                      : activeAccount?.username || 'Selected Profile'
                    : accountLabel
                    ? `${accountLabel} (${officialUsername || 'New'})`
                    : officialUsername || 'New Account'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F0F3F8]">
                <span className="text-[#667085]">Darshan Target</span>
                <span className="font-semibold text-[#172033] text-right">
                  {formattedDisplayDate || 'Not selected'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F0F3F8]">
                <span className="text-[#667085]">Approved Route</span>
                <span className="font-semibold text-[#172033] text-right truncate max-w-[160px]">
                  {selectedRouteObj ? selectedRouteObj.name : 'Not selected'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F0F3F8]">
                <span className="text-[#667085]">Assistance Service Fee</span>
                <span className="font-bold text-[#172033] tabular-nums">₹{serviceFee}</span>
              </div>

              <div className="flex items-center justify-between pt-0.5 text-[11px] text-[#667085]">
                <span className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-[#C98219]" />
                  Wallet Available:
                </span>
                <span className={`font-semibold tabular-nums ${isInsufficientBalance ? 'text-[#DC2626]' : 'text-[#172033]'}`}>
                  ₹{wallet ? (wallet.availableBalance ?? wallet.balance ?? 0) : '...'}
                  {isInsufficientBalance && (
                    <span className="ml-1 text-[10px] font-bold text-[#DC2626] bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FECACA]">
                      Low
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Low Wallet Alert Box in Summary */}
            {isInsufficientBalance && (
              <div className="rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] p-3 text-[11.5px] text-[#991B1B] space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-[#EF4444]" />
                    <span>Insufficient Wallet Balance</span>
                  </span>
                  <span className="text-[10px] bg-[#FEE2E2] px-1.5 py-0.5 rounded text-[#B91C1C]">
                    Min. ₹{serviceFee}
                  </span>
                </div>
                <p className="text-[11px] text-[#7F1D1D] leading-relaxed">
                  Your wallet has ₹{availableBalance}. A minimum of ₹{serviceFee} is required to queue a booking.
                </p>
                <Link
                  href="/dashboard/wallet"
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[6px] font-bold text-[11.5px] transition-colors shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Recharge Wallet (+₹{serviceFee})</span>
                </Link>
              </div>
            )}

            {/* Fee Policy Callout */}
            <div className="rounded-[7px] bg-[#FEF7E6] border border-[#F9DE9B] p-2.5 text-[11px] text-[#8F5A0D] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Fair Pricing Guarantee</span>
              </div>
              <p className="leading-relaxed text-[#7A4A12]">
                ₹{serviceFee} is temporarily held in reservation and captured <strong>only after</strong> a confirmed pass reference is positively verified.
              </p>
            </div>

            {/* Terms & Conditions Acceptance Checkbox */}
            <div
              ref={termsRef}
              className={`rounded-[8px] border p-3 transition-all ${
                termsError
                  ? 'border-[#EF4444] bg-[#FEF2F2] ring-2 ring-[#EF4444]/20'
                  : termsAccepted
                  ? 'border-[#C98219]/40 bg-[#FEFCF6]'
                  : 'border-[#E6EAF0] bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="terms-acceptance"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (e.target.checked) {
                      setTermsError(false);
                      if (error === 'Please accept the Terms & Conditions and Refund Policy before continuing.') {
                        setError(null);
                      }
                    }
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D0D5DD] text-[#C98219] accent-[#C98219] focus:ring-2 focus:ring-[#C98219] cursor-pointer"
                  aria-describedby={termsError ? 'terms-error-msg' : undefined}
                />
                <label
                  htmlFor="terms-acceptance"
                  className="text-[11.5px] leading-relaxed text-[#172033] select-none cursor-pointer"
                >
                  I have read and agree to the{' '}
                  <Link
                    href="/terms-and-conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#C98219] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/refund-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#C98219] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Refund Policy
                  </Link>
                  . Booking success is not guaranteed.
                </label>
              </div>

              {termsError && (
                <p id="terms-error-msg" className="mt-1.5 text-[11px] font-semibold text-[#DC2626] flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>Please accept the Terms & Conditions and Refund Policy before continuing.</span>
                </p>
              )}
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={loading || !termsAccepted || isInsufficientBalance}
              title={
                isInsufficientBalance
                  ? `Minimum ₹${serviceFee} wallet balance required`
                  : !termsAccepted
                  ? 'Please accept the Terms & Conditions and Refund Policy to enable booking'
                  : undefined
              }
              className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] py-2.5 text-[13px] font-bold text-white transition-all shadow-subtle hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#C98219] disabled:active:scale-100 active:scale-[0.99] cursor-pointer"
            >
              {isInsufficientBalance ? (
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span>Insufficient Balance (Min ₹{serviceFee})</span>
                </div>
              ) : loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting to Queue...</span>
                </>
              ) : (
                <>
                  <span>Queue Booking Request</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Compliance & Safeguard Box (Compact) */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-3.5 text-[11.5px] space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#172033]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#198754]" />
              <span>Operational Safeguards</span>
            </div>
            <ul className="space-y-1 text-[#667085] text-[11px]">
              <li className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-[#198754]" />
                <span>Runs in continuous compliance with official guidelines.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-[#198754]" />
                <span>Zero OTP bypass - human challenges route to operator.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-[#198754]" />
                <span>Automatic retry across registered worker fleet.</span>
              </li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
}
