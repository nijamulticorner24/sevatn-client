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
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Minus,
  Info,
  Lock,
  Trash2,
  Search,
  User,
  Plus,
  Check,
  HeartHandshake,
  MapPinOff,
  Loader2,
  X,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import { useLocationGuard } from '@/hooks/useLocationGuard';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate } from '@/lib/utils';

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
  const toast = useToast();

  // 5 KM Geofence Location Guard
  const { isWithinRadius, distanceKm, loading: locationLoading, refreshLocation } = useLocationGuard();
  const [recalibratingGPS, setRecalibratingGPS] = useState(false);

  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [serviceFee, setServiceFee] = useState<number>(20);
  const [pricingBreakdown, setPricingBreakdown] = useState<any>(null);
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
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [pendingDeleteAccountId, setPendingDeleteAccountId] = useState<string | null>(null);
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
  const [pilgrimCount, setPilgrimCount] = useState<number>(1);
  const [pilgrimCountInput, setPilgrimCountInput] = useState<string>('1');
  const [pilgrimError, setPilgrimError] = useState<string | null>(null);

  // Section 3: Nominee Details State & Modal
  interface NomineeInput {
    id: string;
    nomineeName: string;
    nomineeAge: string;
    nomineeRelationship: string;
    nomineePhone: string;
  }

  const [nominees, setNominees] = useState<NomineeInput[]>([
    {
      id: '1',
      nomineeName: '',
      nomineeAge: '',
      nomineeRelationship: 'Spouse',
      nomineePhone: '',
    },
  ]);
  const [isNomineeModalOpen, setIsNomineeModalOpen] = useState(false);
  const [nomineeModalError, setNomineeModalError] = useState<string | null>(null);
  const [isNomineesConfirmed, setIsNomineesConfirmed] = useState(false);

  // Mandatory Pre-Submit Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [isRevealingPassword, setIsRevealingPassword] = useState(false);

  const areNomineesFilled = (items: NomineeInput[], count: number) => {
    if (count < 1 || items.length !== count) return false;
    return items.every((n) => {
      const age = parseInt(n.nomineeAge, 10);
      return (
        n.nomineeName &&
        n.nomineeName.trim().length > 0 &&
        !isNaN(age) &&
        age >= 18 &&
        age <= 120 &&
        Boolean(n.nomineeRelationship)
      );
    });
  };

  const adjustNominees = (targetCount: number) => {
    const clamped = Math.max(0, Math.min(10, targetCount));
    setNominees((prev) => {
      if (clamped === 0) return [];
      if (prev.length === clamped) return prev;
      if (prev.length < clamped) {
        const next = [...prev];
        for (let i = prev.length; i < clamped; i++) {
          next.push({
            id: String(Date.now() + i),
            nomineeName: '',
            nomineeAge: '',
            nomineeRelationship: i === 0 ? 'Spouse' : 'Other',
            nomineePhone: '',
          });
        }
        return next;
      } else {
        return prev.slice(0, clamped);
      }
    });
  };

  const handlePilgrimCountChange = (val: string) => {
    setPilgrimCountInput(val);
    setError(null);
    if (!val || val.trim() === '' || val.trim() === '0') {
      setPilgrimCount(0);
      setPilgrimError(null);
      adjustNominees(0);
      setIsNomineesConfirmed(false);
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setPilgrimError('Please enter a valid number of pilgrims (1-10).');
      return;
    }
    if (num > 10) {
      setPilgrimError('Sabarimala portal allows a maximum of 10 pilgrims per booking.');
      return;
    }
    if (num < 1) {
      setPilgrimCount(0);
      adjustNominees(0);
      setIsNomineesConfirmed(false);
      return;
    }
    setPilgrimError(null);
    setPilgrimCount(num);
    adjustNominees(num);
    setNomineeModalError(null);
    setIsNomineeModalOpen(true);
  };

  const setExplicitPilgrimCount = (num: number, openModal = true) => {
    if (num > 10) {
      setPilgrimError('Sabarimala portal allows a maximum of 10 pilgrims per booking.');
      return;
    }
    setPilgrimError(null);
    setPilgrimCountInput(String(num));
    setPilgrimCount(num);
    adjustNominees(num);
    if (num > 0 && openModal) {
      setNomineeModalError(null);
      setIsNomineeModalOpen(true);
    }
  };

  const handleNomineeChange = (index: number, field: keyof NomineeInput, value: string) => {
    const updated = [...nominees];
    (updated[index] as any)[field] = value;
    setNominees(updated);
  };

  const handleSaveNomineesInModal = () => {
    setNomineeModalError(null);
    if (pilgrimCount < 1 || nominees.length === 0) {
      setNomineeModalError('Please select at least 1 pilgrim before saving nominee details.');
      return;
    }

    for (let i = 0; i < nominees.length; i++) {
      const n = nominees[i];
      if (!n.nomineeName.trim()) {
        setNomineeModalError(`Nominee for Pilgrim #${i + 1}: Full name is required.`);
        return;
      }
      const nomAge = parseInt(n.nomineeAge, 10);
      if (!n.nomineeAge || isNaN(nomAge) || nomAge < 18 || nomAge > 120) {
        setNomineeModalError(`Nominee for Pilgrim #${i + 1}: Must be an adult with a valid age (18-120 years).`);
        return;
      }
      if (!n.nomineeRelationship) {
        setNomineeModalError(`Nominee for Pilgrim #${i + 1}: Please select relationship.`);
        return;
      }
    }

    setIsNomineesConfirmed(true);
    setIsNomineeModalOpen(false);
    setError(null);
  };

  const handleCopyNominee1ToAll = () => {
    if (nominees.length <= 1) return;
    const first = nominees[0];
    if (!first.nomineeName.trim()) {
      setNomineeModalError('Please enter Nominee for Pilgrim #1 before copying to all.');
      return;
    }
    const updated = nominees.map((n, idx) => {
      if (idx === 0) return n;
      return {
        ...n,
        nomineeName: first.nomineeName,
        nomineeAge: first.nomineeAge,
        nomineePhone: first.nomineePhone || '',
        nomineeRelationship: n.nomineeRelationship || 'Relative',
      };
    });
    setNominees(updated);
    setNomineeModalError(null);
  };

  const handleRetryGPS = async () => {
    setRecalibratingGPS(true);
    try {
      if (refreshLocation) {
        await refreshLocation();
      }
      toast.success('GPS coordinates re-checked.');
    } catch (err: any) {
      toast.error(err.message || 'GPS calibration failed');
    } finally {
      setRecalibratingGPS(false);
    }
  };

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
    const u = api.getUser();
    if (u?.role === 'DISTRIBUTOR') {
      window.location.replace('/distributor/bookings/new');
      return;
    }
    Promise.all([
      api.getBookingConfig().catch(() => null),
      api.getBookingPricingPreview(1).catch(() => null),
      api.getAccounts().catch(() => []),
      api.getWallet().catch(() => null),
      api.ensureLocationCoordinates().catch(() => null),
      api.getBookings(undefined, 1, undefined).catch(() => null),
    ]).then(([cfg, pricing, aData, wData, loc, bData]) => {
      if (pricing && pricing.finalTicketPrice) {
        setPricingBreakdown(pricing);
        setServiceFee(Number(pricing.finalTicketPrice));
      } else if (cfg && cfg.serviceFee !== undefined) {
        setServiceFee(Number(cfg.serviceFee));
      }
      if (bData && bData.bookings) {
        setExistingBookings(bData.bookings);
      }
      if (aData && aData.length > 0) {
        setSavedAccounts(aData);
        setSelectedAccountId(aData[0].id);
        setAccountMode('saved');
        setOfficialUsername(aData[0].username);
        setOfficialPassword('••••••••••••');
        api.getAccountPassword(aData[0].id)
          .then((res: any) => {
            if (res?.password) {
              setRevealedPasswords((prev) => ({ ...prev, [aData[0].id]: res.password }));
            }
          })
          .catch(() => null);
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

  // Three-Level Pricing Breakdown Preview Listener
  useEffect(() => {
    const qty = Math.max(1, pilgrimCount || 1);
    api.getBookingPricingPreview(qty)
      .then((res) => {
        if (res) {
          setPricingBreakdown(res);
          if (res.finalTicketPrice) {
            setServiceFee(res.finalTicketPrice);
          }
        }
      })
      .catch(() => null);
  }, [pilgrimCount]);

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
      if (!revealedPasswords[accId]) {
        api.getAccountPassword(accId)
          .then((res: any) => {
            if (res?.password) {
              setRevealedPasswords((prev) => ({ ...prev, [accId]: res.password }));
            }
          })
          .catch(() => null);
      }
    }
  };

  const handleToggleShowConfirmPassword = async (checked: boolean) => {
    setShowConfirmPassword(checked);
    if (checked && accountMode === 'saved' && selectedAccountId && !revealedPasswords[selectedAccountId]) {
      setIsRevealingPassword(true);
      try {
        const res = await api.getAccountPassword(selectedAccountId);
        if (res?.password) {
          setRevealedPasswords((prev) => ({ ...prev, [selectedAccountId]: res.password }));
        }
      } catch (err) {
        console.error('Failed to retrieve account password:', err);
      } finally {
        setIsRevealingPassword(false);
      }
    }
  };

  const handleDeleteAccount = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    setPendingDeleteAccountId(accountId);
  };

  const confirmDeleteAccount = async () => {
    if (!pendingDeleteAccountId) return;
    const accountId = pendingDeleteAccountId;
    setDeletingAccountId(accountId);
    try {
      await api.deleteAccount(accountId);
      const updated = savedAccounts.filter((a) => a.id !== accountId);
      setSavedAccounts(updated);
      toast.success('Devotee profile removed successfully.');
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
      toast.error(err.message || 'Failed to delete devotee profile');
    } finally {
      setDeletingAccountId(null);
      setPendingDeleteAccountId(null);
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

  const filteredSavedAccounts = savedAccounts.filter((a) => {
    if (!accountSearch.trim()) return true;
    const q = accountSearch.toLowerCase().trim();
    return (
      (a.label && a.label.toLowerCase().includes(q)) ||
      (a.username && a.username.toLowerCase().includes(q))
    );
  });

  const activeAccount = savedAccounts.find((a) => a.id === selectedAccountId);
  const currentUser = api.getUser();

  const isBookingActive = (b: any) => {
    if (!b) return false;
    const status = typeof b === 'string' ? b : b.status;
    return !['SUCCESS', 'COMPLETED', 'CANCELLED', 'FAILED', 'EXPIRED', 'SITE_UNAVAILABLE', 'SITE_ERROR'].includes(status);
  };

  const activeBookingForSelectedProfile = accountMode === 'saved'
    ? existingBookings.find((b) => b.accountId === selectedAccountId && isBookingActive(b))
    : officialUsername.trim()
      ? existingBookings.find(
        (b) =>
          b.account?.username?.toLowerCase() === officialUsername.trim().toLowerCase() &&
          isBookingActive(b),
      )
      : null;

  const selectedRouteObj = OFFICIAL_ROUTES.find((r) => r.id === route) || OFFICIAL_ROUTES[0];
  const availableBalance = wallet ? Number(wallet.availableBalance ?? wallet.balance ?? 0) : null;
  const totalServiceFee = serviceFee * pilgrimCount;
  const isInsufficientInitialBalance = availableBalance !== null && availableBalance < serviceFee;
  const isInsufficientBalance = availableBalance !== null && pilgrimCount > 0 && availableBalance < totalServiceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 0. Verify role is CENTRE or DISTRIBUTOR
    if (!currentUser || (currentUser.role !== 'CENTRE' && currentUser.role !== 'DISTRIBUTOR')) {
      setError('Booking creation is strictly restricted to authorized Centre operators and Distributors.');
      return;
    }

    // 0a. Validate pilgrim count limit (1 to 10)
    const parsedPilgrims = parseInt(pilgrimCountInput, 10);
    if (isNaN(parsedPilgrims) || parsedPilgrims < 1 || pilgrimCount < 1) {
      setError('Please select at least 1 pilgrim (1 to 10).');
      return;
    }
    if (parsedPilgrims > 10 || pilgrimCount > 10) {
      setError('Sabarimala portal allows a maximum of 10 pilgrims per booking.');
      return;
    }

    // 0b. Validate minimum wallet balance requirement
    if (availableBalance !== null && availableBalance < totalServiceFee) {
      setError(`Insufficient wallet balance. You need at least ₹${totalServiceFee} (₹${serviceFee} × ${pilgrimCount} pilgrim${pilgrimCount > 1 ? 's' : ''}) to request this service. Please recharge your wallet.`);
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

    // 1c. Devotee Profile Single Active Request Enforcement
    if (activeBookingForSelectedProfile) {
      setError(
        `This devotee profile already has an active booking request (#${activeBookingForSelectedProfile.bookingCode} for ${formatDate(activeBookingForSelectedProfile.requestedDate)}). Only 1 active booking request is allowed per devotee profile. No multiple dates or requests are permitted on the same profile until the active request is finalized or cancelled.`,
      );
      return;
    }

    // 1b. Location Guard Verification
    if (isWithinRadius === false) {
      setError(`Access Restricted: You are currently ${distanceKm !== null ? `${distanceKm} KM` : 'more than 5 KM'} away from your registered centre. Bookings are only permitted within 5 KM.`);
      return;
    }

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

    // 2b. Validate Nominees (Mandatory Pilgrim Insurance)
    if (!nominees || nominees.length === 0 || !areNomineesFilled(nominees, pilgrimCount)) {
      setNomineeModalError('Please complete the nominee insurance details for all pilgrims.');
      setError('Please fill in the Nominee Details for all pilgrims in Section 3 before submitting.');
      return;
    }

    // Trigger mandatory pre-submit confirmation modal before calling API
    setShowConfirmPassword(false);
    if (accountMode === 'saved' && selectedAccountId && !revealedPasswords[selectedAccountId]) {
      api.getAccountPassword(selectedAccountId)
        .then((res: any) => {
          if (res?.password) {
            setRevealedPasswords((prev) => ({ ...prev, [selectedAccountId]: res.password }));
          }
        })
        .catch(() => null);
    }
    setIsConfirmModalOpen(true);
  };

  const handleExecuteConfirmedBooking = async () => {
    // Set loading to prevent duplicate clicks and requests
    setLoading(true);
    setError(null);

    try {
      // 3. Validate current 3-tier fee with backend (Base Price + Franchise Markup + Distributor Markup)
      try {
        const pricing = await api.getBookingPricingPreview(pilgrimCount);
        if (pricing && pricing.finalTicketPrice) {
          setPricingBreakdown(pricing);
          setServiceFee(Number(pricing.finalTicketPrice));
        }
      } catch (_) {
        // Fallback to currently loaded service fee
      }

      // 4. Resolve coordinates for mandatory 5 KM Geofence validation
      let coords = api.getLocationCoordinates();
      if (!coords) {
        coords = await api.ensureLocationCoordinates();
      }

      // 5. Submit the booking request using complete validated payload
      const primaryNominee = {
        nomineeName: nominees[0].nomineeName.trim(),
        nomineeAge: parseInt(nominees[0].nomineeAge, 10),
        nomineeRelationship: nominees[0].nomineeRelationship,
        nomineePhone: nominees[0].nomineePhone?.trim() || undefined,
      };

      const payload: any = {
        requestedDate,
        route,
        pilgrimCount,
        termsAccepted: true,
        nominee: primaryNominee,
        nominees: nominees.map((n) => ({
          nomineeName: n.nomineeName.trim(),
          nomineeAge: parseInt(n.nomineeAge, 10),
          nomineeRelationship: n.nomineeRelationship,
          nomineePhone: n.nomineePhone?.trim() || undefined,
        })),
        nomineeName: primaryNominee.nomineeName,
        nomineeAge: primaryNominee.nomineeAge,
        nomineeRelationship: primaryNominee.nomineeRelationship,
        nomineePhone: primaryNominee.nomineePhone,
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wallet-refresh'));
      }

      // Close modal on successful queue
      setIsConfirmModalOpen(false);

      // 6. Show "Booking request submitted" only when backend confirms request was successfully queued
      setSuccessMsg('Booking request submitted');
      setTimeout(() => {
        router.push('/dashboard/bookings');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please verify your balance and account details.');
      setIsConfirmModalOpen(false);
      setLoading(false);
    }
  };

  // Role Guard: Exclusively Centre operators and Distributors can access booking creation
  if (currentUser && currentUser.role !== 'CENTRE' && currentUser.role !== 'DISTRIBUTOR') {
    const roleRedirect =
      currentUser.role === 'SUPER_ADMIN' ? '/admin' :
        currentUser.role === 'PARTNER' ? '/partner' : currentUser.role === 'DISTRIBUTOR' ? '/distributor' : '/dashboard';

    return (
      <div className="w-full max-w-[620px] mx-auto py-16 px-4 animate-in fade-in duration-200">
        <div className="rounded-[12px] border border-amber-200 bg-white p-7 sm:p-9 shadow-card text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-subtle">
            <Lock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#172033]">
              Booking Creation Restricted
            </h2>
            <p className="text-xs text-[#667085] max-w-md mx-auto leading-relaxed">
              Direct Sabarimala Q-Coupon booking operations are restricted to verified <strong className="text-[#172033]">Centre Operators</strong> and <strong className="text-[#172033]">Distributors</strong>. Other roles ({currentUser.role?.replace('_', ' ')}) cannot initiate bookings directly.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={roleRedirect}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] px-5 py-2.5 text-xs font-bold text-white transition-all shadow-subtle hover:shadow"
            >
              <span>Return to {currentUser.role?.replace('_', ' ')} Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (walletLoading || (locationLoading && isWithinRadius === null)) {
    return (
      <div className="w-full max-w-[1300px] mx-auto py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-9 w-9 animate-spin text-[#C98219]" />
        <p className="text-sm font-semibold text-[#172033]">
          {walletLoading ? 'Checking wallet balance...' : 'Verifying 5 KM Service Location...'}
        </p>
        <p className="text-xs text-[#667085]">
          {walletLoading ? 'Connecting to SevaTN financial ledger' : 'Validating GPS coordinates against registered centre geofence'}
        </p>
      </div>
    );
  }

  // 5 KM Geofence Blocking Popup Modal
  if (isWithinRadius === false) {
    const displayDistance = distanceKm !== null ? `${distanceKm}` : 'more than 5';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-red-100 text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Alert Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
            <MapPinOff className="h-7 w-7" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-[#172033]">
            Access Restricted: Location Mismatch
          </h3>

          {/* Message */}
          <p className="mt-3 text-xs leading-relaxed text-[#475467]">
            You are currently <span className="font-bold text-red-600 font-mono">{displayDistance} KM</span> away from your registered centre. You must be within 5 KM to create a booking. Please contact your Super Admin to update your centre coordinates.
          </p>

          {/* Distance Info Badge */}
          {distanceKm !== null && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-[11px] font-medium text-neutral-600">
              <span>Current Distance: <strong className="text-red-700">{distanceKm} KM</strong></span>
              <span className="text-neutral-300">|</span>
              <span>Allowed: <strong className="text-emerald-700">≤ 5.0 KM</strong></span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleRetryGPS}
              disabled={recalibratingGPS}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#C98219] hover:bg-[#B57414] text-white py-2.5 px-4 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {recalibratingGPS ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>{recalibratingGPS ? 'Calibrating...' : 'Recalibrate GPS'}</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-xl border border-[#D0D5DD] bg-white hover:bg-[#F9FAFB] text-[#344054] py-2.5 px-4 text-xs font-semibold transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isInsufficientInitialBalance) {
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
            href="/dashboard/bookings"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#667085] hover:text-[#C98219] transition-colors mb-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to Bookings</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#172033] tracking-tight">
              Create Booking Request
            </h1>
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
            href="/dashboard/bookings"
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
              <div className="flex items-center gap-1.5 rounded-[9px] bg-[#F1F4F9] p-1 border border-[#E6EAF0]">
                <button
                  type="button"
                  onClick={() => handleModeChange('saved')}
                  disabled={savedAccounts.length === 0}
                  className={`px-3.5 py-2 rounded-[7px] text-[12.5px] font-semibold transition-all ${
                    accountMode === 'saved'
                      ? 'bg-white text-[#172033] shadow-sm font-bold border border-[#E6EAF0]'
                      : 'text-[#667085] hover:text-[#172033] hover:bg-white/60 disabled:opacity-40'
                  }`}
                >
                  Saved ({savedAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('new')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-[7px] text-[13px] font-bold transition-all shadow-sm cursor-pointer ${
                    accountMode === 'new'
                      ? 'bg-[#C98219] text-white hover:bg-[#B57414] shadow'
                      : 'bg-[#FEF7E6] text-[#8F5A0D] border border-[#F9DE9B] hover:bg-[#FCE0A6]'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>+ New</span>
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
                    <div className="absolute top-full left-0 mt-1.5 z-40 w-full bg-white rounded-[8px] border border-[#E6EAF0] shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[300px] flex flex-col">
                      <div className="p-2 border-b border-[#E6EAF0] bg-[#FAFBFD] sticky top-0 z-10">
                        <div className="relative">
                          <Search className="h-3.5 w-3.5 text-[#98A2B3] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Filter devotee name or username..."
                            value={accountSearch}
                            onChange={(e) => setAccountSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full pl-8 pr-2.5 py-1.5 text-[12px] bg-white border border-[#D0D5DD] rounded-[6px] focus:outline-none focus:border-[#C98219]"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="p-1 space-y-0.5 overflow-y-auto flex-1">
                        {filteredSavedAccounts.length === 0 ? (
                          <div className="p-3 text-center text-[12px] text-[#667085]">
                            No matching devotee profile found.
                          </div>
                        ) : (
                          filteredSavedAccounts.map((acc) => {
                            const isSelected = selectedAccountId === acc.id;
                            const accActiveBooking = existingBookings.find(
                              (b) => b.accountId === acc.id && isBookingActive(b),
                            );
                            return (
                              <div
                                key={acc.id}
                                onClick={() => handleAccountSelect(acc.id)}
                                className={`flex items-center justify-between p-2.5 rounded-[6px] cursor-pointer transition-colors ${isSelected ? 'bg-[#FDF7ED] text-[#172033]' : 'hover:bg-[#F8FAFC] text-[#344054]'
                                  }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isSelected ? 'bg-[#C98219] text-white' : 'bg-[#F2F4F7] text-[#475467]'
                                    }`}>
                                    {(acc.label || acc.username).charAt(0).toUpperCase()}
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-[12.5px] font-bold text-[#172033] truncate">
                                        {acc.label || acc.username}
                                      </p>
                                      {accActiveBooking && (
                                        <span className="text-[9.5px] font-bold text-[#8F5A0D] bg-[#FEF7E6] border border-[#F9DE9B] px-1.5 py-0.2 rounded shrink-0">
                                          Active #{accActiveBooking.bookingCode}
                                        </span>
                                      )}
                                    </div>
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
                          })
                        )}
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

            {/* Account Verification Status Banner */}
            {accountMode === 'saved' && activeAccount && (
              <div className="flex items-center justify-between p-2.5 rounded-[7px] border bg-[#F8FAFC] text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="text-[#667085] font-medium">Verification Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] ${activeAccount.status === 'VERIFIED'
                      ? 'bg-[#EAF7EE] text-[#155724] border border-[#C3E6CB]'
                      : 'bg-[#FEF7E6] text-[#B45309] border border-[#FDE68A]'
                      }`}
                  >
                    {activeAccount.status === 'VERIFIED' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-[#198754]" />
                        <span>VERIFIED</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 text-[#D97706]" />
                        <span>{activeAccount.status || 'UNVERIFIED'}</span>
                      </>
                    )}
                  </span>
                </div>
                {activeAccount.status !== 'VERIFIED' && (
                  <span className="text-[11px] font-semibold text-[#B45309]">
                    Execution blocked until verified
                  </span>
                )}
              </div>
            )}

            {/* Active Booking Warning Banner (Single request limit per devotee profile) */}
            {activeBookingForSelectedProfile && (
              <div className="flex items-start gap-2.5 rounded-[8px] border border-[#FCD34D] bg-[#FFFBEB] p-3 text-[12.5px] text-[#92400E] animate-in fade-in duration-200">
                <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">
                    Active Booking Already Exists For This Devotee Profile
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#B45309]">
                    This devotee profile already has an in-flight booking request{' '}
                    <strong className="font-mono font-bold">#{activeBookingForSelectedProfile.bookingCode}</strong>{' '}
                    for <strong>{formatDate(activeBookingForSelectedProfile.requestedDate)}</strong> ({activeBookingForSelectedProfile.route}).
                  </p>
                  <p className="mt-1 text-[11.5px] text-[#92400E]">
                    Each devotee profile is strictly limited to <strong>1 active booking request</strong> at a time. Multiple dates or concurrent requests on the same profile are not permitted until the active request finishes or is cancelled.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Link
                      href={`/dashboard/bookings/${activeBookingForSelectedProfile.id}`}
                      className="inline-flex items-center gap-1 rounded bg-[#C98219] text-white px-3 py-1 text-[11.5px] font-bold hover:bg-[#B57414] transition-colors"
                    >
                      <span>Inspect Active Request #{activeBookingForSelectedProfile.bookingCode}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Link
                      href="/dashboard/bookings"
                      className="inline-flex items-center gap-1 rounded border border-[#D0D5DD] bg-white text-[#344054] px-2.5 py-1 text-[11.5px] font-semibold hover:bg-[#F9FAFB] transition-colors"
                    >
                      Bookings Queue
                    </Link>
                  </div>
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
                              className={`h-7 w-full text-[12px] font-medium rounded-[5px] flex items-center justify-center transition-all ${isSelected
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
                                className={`w-full text-left p-2.5 rounded-[6px] transition-colors flex items-start justify-between gap-2 ${isSelected
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

              {/* DYNAMIC PILGRIM COUNT SELECTOR (MAX 10) */}
              <div className="space-y-2 pt-2 border-t border-[#F0F3F8]">
                <div className="flex items-center justify-between">
                  <label className="block text-[11.5px] font-bold text-[#344054] uppercase tracking-wider">
                    Number of Pilgrims (Max 10) <span className="text-[#C2413B]">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[#8F5A0D] bg-[#FEF7E6] border border-[#F9DE9B] px-2 py-0.5 rounded">
                    ₹{pricingBreakdown?.finalTicketPrice ?? serviceFee} × {pilgrimCount} = ₹{totalServiceFee}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Interactive Stepper with Arrow Buttons */}
                  <div className="inline-flex items-center rounded-[8px] border border-[#D0D5DD] bg-white p-0.5 shadow-2xs w-fit">
                    <button
                      type="button"
                      onClick={() => {
                        const current = pilgrimCount || 0;
                        if (current > 1) {
                          setExplicitPilgrimCount(current - 1, true);
                        } else if (current === 1) {
                          setExplicitPilgrimCount(0, false);
                        }
                      }}
                      disabled={pilgrimCount <= 0}
                      className="h-8 w-8 rounded-[6px] text-[#344054] hover:bg-[#F2F4F7] hover:text-[#172033] flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Decrease Pilgrims (Arrow Down)"
                      aria-label="Decrease Pilgrims"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={pilgrimCountInput}
                      onChange={(e) => handlePilgrimCountChange(e.target.value)}
                      onClick={() => {
                        const num = parseInt(pilgrimCountInput, 10);
                        if (!isNaN(num) && num >= 1 && num <= 10) {
                          setNomineeModalError(null);
                          setIsNomineeModalOpen(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          const current = pilgrimCount || 0;
                          if (current < 10) setExplicitPilgrimCount(current + 1, true);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const current = pilgrimCount || 0;
                          if (current > 0) setExplicitPilgrimCount(current - 1, true);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          const num = parseInt(pilgrimCountInput, 10);
                          if (!isNaN(num) && num >= 1 && num <= 10) {
                            setExplicitPilgrimCount(num, true);
                          }
                        }
                      }}
                      onBlur={() => {
                        const num = parseInt(pilgrimCountInput, 10);
                        if (!isNaN(num) && num >= 1 && num <= 10) {
                          setNomineeModalError(null);
                          setIsNomineeModalOpen(true);
                        }
                      }}
                      className="h-8 w-12 text-center text-[13.5px] font-extrabold text-[#172033] focus:outline-none bg-transparent cursor-pointer"
                      placeholder="0"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const current = pilgrimCount || 0;
                        if (current < 10) {
                          setExplicitPilgrimCount(current + 1, true);
                        }
                      }}
                      disabled={pilgrimCount >= 10}
                      className="h-8 w-8 rounded-[6px] text-[#344054] hover:bg-[#F2F4F7] hover:text-[#172033] flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Increase Pilgrims (Arrow Up)"
                      aria-label="Increase Pilgrims"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quick Select Pills 1 to 10 */}
                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const isSelected = pilgrimCount === num && !pilgrimError;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setExplicitPilgrimCount(num, true)}
                          className={`h-8 min-w-[32px] px-2.5 rounded-[6px] text-[12px] font-bold transition-all cursor-pointer ${isSelected
                            ? 'bg-[#C98219] text-white shadow-2xs'
                            : 'bg-white border border-[#D0D5DD] text-[#344054] hover:border-[#C98219] hover:bg-[#FEF7E6] hover:text-[#C98219]'
                            }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Validation Error Message */}
                {pilgrimError && (
                  <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#B42318] bg-[#FEF3F2] p-2.5 rounded-[6px] border border-[#FECDCA]">
                    <AlertCircle className="h-4 w-4 shrink-0 text-[#D92D20]" />
                    <span>{pilgrimError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: NOMINEE DETAILS SUMMARY & ACTION CARD */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 sm:p-5 shadow-subtle space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#FEF7E6] text-[#C98219]">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[13.5px] font-bold text-[#172033]">
                    3. Nominee Details ({pilgrimCount} Pilgrim{pilgrimCount !== 1 ? 's' : ''})
                  </h2>
                  <p className="text-[11px] text-[#667085]">
                    Travancore Devaswom Board emergency insurance nominee for each pilgrim (18+ adult)
                  </p>
                </div>
              </div>

              {pilgrimCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setNomineeModalError(null);
                    setIsNomineeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#D0D5DD] bg-white px-3 py-1.5 text-[11.5px] font-bold text-[#C98219] hover:bg-[#FEF7E6] transition-all cursor-pointer shadow-2xs"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{areNomineesFilled(nominees, pilgrimCount) ? 'Edit Nominees' : 'Fill Details'}</span>
                </button>
              )}
            </div>

            {pilgrimCount === 0 ? (
              <div className="p-4 rounded-[8px] border border-dashed border-[#D0D5DD] bg-[#FAFBFD] text-center space-y-1">
                <p className="text-[12.5px] font-semibold text-[#475467]">
                  Pilgrims Not Selected
                </p>
                <p className="text-[11px] text-[#667085]">
                  Select 1 to 10 pilgrims in Section 2 above. A popup will open to enter nominee insurance details.
                </p>
              </div>
            ) : areNomineesFilled(nominees, pilgrimCount) ? (
              <div className="p-3.5 rounded-[8px] border border-[#C3E6CB] bg-[#F4FBF6] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#198754]" />
                    <span className="text-[12px] font-bold text-[#155724]">
                      Nominee Details Confirmed ({pilgrimCount} Pilgrim{pilgrimCount > 1 ? 's' : ''})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNomineeModalError(null);
                      setIsNomineeModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#155724] underline hover:text-[#0f3d19] cursor-pointer"
                  >
                    Edit in Popup
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11.5px]">
                  {nominees.map((n, idx) => (
                    <div key={n.id || idx} className="p-2.5 rounded-[6px] bg-white border border-[#D0E7D6] flex items-center justify-between shadow-2xs">
                      <span className="font-semibold text-[#172033] truncate">
                        #{idx + 1}: {n.nomineeName}
                      </span>
                      <span className="text-[10.5px] text-[#667085] shrink-0 ml-1">
                        {n.nomineeAge} yrs • {n.nomineeRelationship}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-[8px] border border-[#FDE68A] bg-[#FEFCE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-bold text-[#92400E]">
                      Nominee Details Required
                    </p>
                    <p className="text-[11px] text-[#B45309]">
                      Emergency insurance nominee information is required for {pilgrimCount} pilgrim{pilgrimCount > 1 ? 's' : ''}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNomineeModalError(null);
                    setIsNomineeModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-[7px] bg-[#C98219] hover:bg-[#B57414] px-4 py-2 text-[12px] font-bold text-white transition-all shadow-subtle shrink-0 cursor-pointer"
                >
                  <HeartHandshake className="h-4 w-4" />
                  <span>Fill Nominee Details ({pilgrimCount} Pilgrim{pilgrimCount > 1 ? 's' : ''})</span>
                </button>
              </div>
            )}
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
                <span className="text-[#667085]">Pilgrims / Devotees</span>
                <span className="font-semibold text-[#172033] text-right">
                  {pilgrimCount === 0 ? '0 Devotees (Select 1-10)' : `${pilgrimCount} Devotee${pilgrimCount > 1 ? 's' : ''} (Max 10)`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F0F3F8]">
                <span className="text-[#667085]">Emergency Nominee{nominees.length > 1 ? 's' : ''}</span>
                <span className="font-semibold text-[#172033] text-right truncate max-w-[160px]">
                  {pilgrimCount > 0 && nominees[0]?.nomineeName
                    ? nominees.length > 1
                      ? `${nominees[0].nomineeName} (+${nominees.length - 1})`
                      : nominees[0].nomineeName
                    : 'Not entered'}
                </span>
              </div>

              {/* Assistance Service Fee */}
              <div className="flex items-center justify-between py-1 border-b border-[#F0F3F8]">
                <span className="text-[#667085]">Assistance Service Fee</span>
                <div className="text-right">
                  <span className="font-bold text-[#172033] tabular-nums text-[13px]">₹{totalServiceFee}</span>
                  <div className="text-[10.5px] text-[#667085]">
                    (₹{pricingBreakdown?.finalTicketPrice ?? serviceFee} × {pilgrimCount} pilgrim{pilgrimCount !== 1 ? 's' : ''})
                  </div>
                </div>
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
                    Min. ₹{totalServiceFee}
                  </span>
                </div>
                <p className="text-[11px] text-[#7F1D1D] leading-relaxed">
                  Your wallet has ₹{availableBalance}. A minimum of ₹{totalServiceFee} (₹{serviceFee} × {pilgrimCount} pilgrim{pilgrimCount > 1 ? 's' : ''}) is required to queue this booking.
                </p>
                <Link
                  href="/dashboard/wallet"
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[6px] font-bold text-[11.5px] transition-colors shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Recharge Wallet (+₹{totalServiceFee})</span>
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
                ₹{totalServiceFee} (₹{serviceFee} × {pilgrimCount} pilgrim{pilgrimCount > 1 ? 's' : ''}) is temporarily held in reservation and captured <strong>only after</strong> a confirmed pass reference is positively verified.
              </p>
            </div>

            {/* Terms & Conditions Acceptance Checkbox */}
            <div
              ref={termsRef}
              className={`rounded-[8px] border p-3 transition-all ${termsError
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

            {/* Active Booking Block Notice */}
            {activeBookingForSelectedProfile && (
              <div className="rounded-[7px] bg-[#FFFBEB] border border-[#FCD34D] p-2.5 text-[#92400E] text-[11.5px] font-medium flex items-start gap-1.5">
                <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>
                  Profile already has active request <strong className="font-mono">#{activeBookingForSelectedProfile.bookingCode}</strong>. Only 1 active request is permitted per devotee profile.
                </span>
              </div>
            )}

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={loading || pilgrimCount < 1 || !termsAccepted || isInsufficientBalance || Boolean(activeBookingForSelectedProfile)}
              title={
                activeBookingForSelectedProfile
                  ? `Devotee Profile has an active booking request (#${activeBookingForSelectedProfile.bookingCode}). Only 1 active request is permitted per profile.`
                  : pilgrimCount < 1
                    ? 'Please select number of pilgrims (1-10)'
                    : isInsufficientBalance
                      ? `Minimum ₹${totalServiceFee} wallet balance required`
                      : !termsAccepted
                        ? 'Please accept the Terms & Conditions and Refund Policy to enable booking'
                        : undefined
              }
              className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] py-2.5 text-[13px] font-bold text-white transition-all shadow-subtle hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#C98219] disabled:active:scale-100 active:scale-[0.99] cursor-pointer"
            >
              {activeBookingForSelectedProfile ? (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Profile Has Active Request</span>
                </div>
              ) : isInsufficientBalance ? (
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span>Insufficient Balance (Min ₹{totalServiceFee})</span>
                </div>
              ) : loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting to Queue...</span>
                </>
              ) : pilgrimCount < 1 ? (
                <span>Select Pilgrims to Queue</span>
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

      {/* NOMINEE DETAILS POPUP MODAL */}
      {isNomineeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl lg:max-w-5xl rounded-[14px] bg-white shadow-2xl border border-[#E6EAF0] my-8 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-[#E6EAF0] bg-white sticky top-0 z-10 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219] shrink-0">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#172033]">
                    3. Nominee Insurance Details
                  </h3>
                  <p className="text-[11px] text-[#667085]">
                    Travancore Devaswom Board emergency accident nominee for each pilgrim (18+ adult)
                  </p>
                </div>
              </div>

              {/* Number of Pilgrims Arrow Stepper inside Modal */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="inline-flex items-center rounded-[7px] border border-[#D0D5DD] bg-[#FAFBFD] p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (pilgrimCount > 1) {
                        setExplicitPilgrimCount(pilgrimCount - 1, true);
                      }
                    }}
                    disabled={pilgrimCount <= 1}
                    className="h-7 w-7 rounded-[5px] text-[#344054] hover:bg-[#EEF2F6] flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Decrease Pilgrims (Arrow Down)"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  <span className="px-2.5 text-[12px] font-black text-[#172033] min-w-[70px] text-center select-none">
                    {pilgrimCount} {pilgrimCount === 1 ? 'Pilgrim' : 'Pilgrims'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (pilgrimCount < 10) {
                        setExplicitPilgrimCount(pilgrimCount + 1, true);
                      }
                    }}
                    disabled={pilgrimCount >= 10}
                    className="h-7 w-7 rounded-[5px] text-[#344054] hover:bg-[#EEF2F6] flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Increase Pilgrims (Arrow Up)"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsNomineeModalOpen(false);
                    setNomineeModalError(null);
                  }}
                  className="text-[#98A2B3] hover:text-[#172033] p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Error Banner */}
            {nomineeModalError && (
              <div className="mx-5 mt-4 p-3 rounded-[8px] bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] text-[12px] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#D92D20]" />
                <span className="font-semibold">{nomineeModalError}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {nominees.length > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-[8px] bg-[#FDF7ED] border border-[#E8D5B7] text-[#7A4A12]">
                  <div className="text-[12px] leading-relaxed">
                    <span className="font-bold">Group / Family Quick-Fill:</span> Apply Nominee #1 details to all remaining pilgrims in one tap.
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyNominee1ToAll}
                    className="shrink-0 self-start sm:self-center rounded-[6px] bg-[#C98219] hover:bg-[#B57414] text-white px-3 py-1.5 text-[11.5px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    Copy #1 to All
                  </button>
                </div>
              )}

              {/* 2-Column Grid Layout for Nominee Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {nominees.map((nominee, idx) => (
                  <div
                    key={nominee.id || idx}
                    className="p-3.5 rounded-[9px] border border-[#E6EAF0] bg-[#FAFBFD] space-y-2.5 relative flex flex-col justify-between shadow-2xs hover:border-[#D0D5DD] transition-colors"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#F0F3F8]">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C98219] text-white text-[10px] font-black">
                          {idx + 1}
                        </span>
                        <span className="text-[11.5px] font-bold text-[#172033] uppercase tracking-wider">
                          Nominee for Pilgrim #{idx + 1} {idx === 0 ? '(Primary)' : ''}
                        </span>
                      </div>
                      {nominees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setExplicitPilgrimCount(Math.max(1, pilgrimCount - 1), false)}
                          className="text-[#98A2B3] hover:text-[#C2413B] p-1 rounded transition-colors cursor-pointer text-xs flex items-center gap-1"
                          title="Remove this pilgrim"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#475467] mb-1">
                          Nominee Full Name <span className="text-[#C2413B]">*</span>
                        </label>
                        <input
                          type="text"
                          value={nominee.nomineeName}
                          onChange={(e) => handleNomineeChange(idx, 'nomineeName', e.target.value)}
                          placeholder="e.g. Lakshmi S"
                          className="w-full rounded-[6px] border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-[12.5px] text-[#172033] focus:border-[#C98219] focus:outline-none"
                          autoFocus={idx === 0}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#475467] mb-1">
                            Age (18+) <span className="text-[#C2413B]">*</span>
                          </label>
                          <input
                            type="number"
                            min="18"
                            max="120"
                            value={nominee.nomineeAge}
                            onChange={(e) => handleNomineeChange(idx, 'nomineeAge', e.target.value)}
                            placeholder="18+"
                            className="w-full rounded-[6px] border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-[12.5px] text-[#172033] focus:border-[#C98219] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#475467] mb-1">
                            Relationship <span className="text-[#C2413B]">*</span>
                          </label>
                          <select
                            value={nominee.nomineeRelationship}
                            onChange={(e) => handleNomineeChange(idx, 'nomineeRelationship', e.target.value)}
                            className="w-full rounded-[6px] border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-[12.5px] text-[#172033] focus:border-[#C98219] focus:outline-none"
                          >
                            <option value="Spouse">Spouse</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Son">Son</option>
                            <option value="Daughter">Daughter</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Guardian">Guardian</option>
                            <option value="Friend">Friend</option>
                            <option value="Relative">Relative</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {nominees.length < 10 && (
                <button
                  type="button"
                  onClick={() => setExplicitPilgrimCount(Math.min(10, pilgrimCount + 1), false)}
                  className="w-full flex items-center justify-center gap-2 rounded-[8px] border-2 border-dashed border-[#D0D5DD] bg-[#FAFBFD] py-3 text-[12px] font-bold text-[#C98219] hover:border-[#C98219] hover:bg-[#FEF7E6] transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Another Pilgrim ({nominees.length}/10)</span>
                </button>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E6EAF0] bg-[#FAFBFD] flex items-center justify-between gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  setIsNomineeModalOpen(false);
                  setNomineeModalError(null);
                }}
                className="rounded-[7px] border border-[#D0D5DD] bg-white px-4 py-2 text-[12px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveNomineesInModal}
                className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#C98219] hover:bg-[#B57414] px-5 py-2 text-[12px] font-bold text-white transition-all shadow-subtle hover:shadow cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Save Nominee Details</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY PRE-SUBMIT CONFIRMATION MODAL (BILINGUAL) */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border-2 border-orange-500 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Header: Warning banner */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 px-5 py-3.5 text-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-black tracking-tight leading-tight">
                    உங்கள் விவரங்களை உறுதிப்படுத்தவும்
                  </h3>
                  <p className="text-[11px] text-white/90 font-medium">
                    Please Confirm Your Details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Tamil Primary Warning Box */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 space-y-2">
                <h4 className="text-[13px] font-bold text-[#8F5A0D] flex items-center gap-1.5">
                  <span>உங்கள் விவரங்களை உறுதிப்படுத்தவும்</span>
                </h4>
                <p className="text-[12px] leading-relaxed text-[#7A4A12]">
                  கீழே உள்ள விவரங்களை சரிபார்க்கவும். தவறான தகவல்கள் இருந்தால், &quot;திரும்பிச் சென்று திருத்து&quot; என்பதைக் கிளிக் செய்யவும். உறுதிப்படுத்திய பிறகு, முன்பதிவை மாற்றவோ ரத்து செய்யவோ முடியாது.
                </p>
                <div className="pt-1 text-[12px] font-bold text-red-700 flex items-center gap-1">
                  <span>⚠️ தவறான விவரங்கள் முன்பதிவு தோல்விக்கு வழிவகுக்கும்.</span>
                </div>
              </div>

              {/* Data Summary Section (Display Exact Values) */}
              <div className="rounded-xl border border-[#E6EAF0] bg-[#FAFBFD] p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E6EAF0]">
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#344054]">
                    முன்பதிவு விவரங்கள் / Booking Summary Data
                  </span>
                  <span className="text-[10.5px] font-semibold text-[#8F5A0D] bg-[#FEF7E6] border border-[#F9DE9B] px-2 py-0.5 rounded">
                    {pilgrimCount} {pilgrimCount > 1 ? 'Pilgrims' : 'Pilgrim'}
                  </span>
                </div>

                <div className="space-y-2 text-[12.5px]">
                  {/* Account Reference Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#F0F3F8] gap-1">
                    <span className="text-[#667085] font-medium">Account Reference Name:</span>
                    <span className="font-bold text-[#172033] sm:text-right">
                      {accountMode === 'saved'
                        ? activeAccount?.label || activeAccount?.username || 'Devotee Account'
                        : accountLabel.trim() || officialUsername.trim() || 'New Devotee Account'}
                    </span>
                  </div>

                  {/* Registered Mobile / Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#F0F3F8] gap-1">
                    <span className="text-[#667085] font-medium">Registered Mobile / Email:</span>
                    <span className="font-bold font-mono text-[#172033] sm:text-right">
                      {accountMode === 'saved'
                        ? activeAccount?.username || officialUsername
                        : officialUsername.trim()}
                    </span>
                  </div>

                  {/* Official Portal Password */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#F0F3F8] gap-1">
                    <span className="text-[#667085] font-medium">Official Portal Password:</span>
                    <div className="sm:text-right">
                      <span className="font-mono font-bold text-[#172033] select-all">
                        {showConfirmPassword
                          ? accountMode === 'saved'
                            ? isRevealingPassword
                              ? '••••••••'
                              : revealedPasswords[selectedAccountId] || (officialPassword !== '••••••••••••' ? officialPassword : '••••••••')
                            : officialPassword || '••••••••'
                          : '••••••••'}
                      </span>
                      <div>
                        <label className="inline-flex items-center gap-1.5 text-[11px] text-[#C98219] font-medium cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showConfirmPassword}
                            onChange={(e) => handleToggleShowConfirmPassword(e.target.checked)}
                            className="rounded border-[#D0D5DD] text-[#C98219] accent-[#C98219] cursor-pointer"
                          />
                          <span>Show password</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Preferred Darshan Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#F0F3F8] gap-1">
                    <span className="text-[#667085] font-medium">Preferred Darshan Date:</span>
                    <span className="font-bold text-[#172033] sm:text-right">
                      {formattedDisplayDate || requestedDate}
                    </span>
                  </div>

                  {/* Approved Entry Route */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#F0F3F8] gap-1">
                    <span className="text-[#667085] font-medium">Approved Entry Route:</span>
                    <span className="font-bold text-[#172033] sm:text-right">
                      {selectedRouteObj ? selectedRouteObj.name : route}
                    </span>
                  </div>

                  {/* Number of Pilgrims */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#F0F3F8] gap-1">
                    <span className="text-[#667085] font-medium">Number of Pilgrims:</span>
                    <span className="font-bold text-[#172033] sm:text-right">
                      {pilgrimCount}
                    </span>
                  </div>

                  {/* Assistance Service Fee */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#F0F3F8] gap-1">
                    <span className="text-[#667085] font-medium">Assistance Service Fee:</span>
                    <span className="font-bold text-[#172033] sm:text-right">
                      ₹{totalServiceFee} (₹{pricingBreakdown?.finalTicketPrice ?? serviceFee} × {pilgrimCount} pilgrim{pilgrimCount > 1 ? 's' : ''})
                    </span>
                  </div>

                  {/* Nominee Details for each pilgrim */}
                  <div className="pt-1.5 space-y-1.5">
                    <span className="text-[#667085] font-medium block">
                      Nominee Details ({nominees.length} {nominees.length > 1 ? 'Pilgrims' : 'Pilgrim'}):
                    </span>
                    <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-[#E6EAF0]">
                      {nominees.map((n, idx) => (
                        <div
                          key={n.id || idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#F0F3F8] last:border-0 text-[12px] gap-0.5"
                        >
                          <span className="font-bold text-[#172033]">
                            Pilgrim #{idx + 1}: {n.nomineeName || 'N/A'}
                          </span>
                          <span className="text-[#667085]">
                            Age: <strong className="text-[#172033]">{n.nomineeAge || 'N/A'}</strong> | Relationship: <strong className="text-[#172033]">{n.nomineeRelationship || 'N/A'}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* English Section (Below, Smaller Text) */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-1 text-neutral-700">
                <h5 className="text-[12px] font-bold text-neutral-800">
                  Please Confirm Your Details
                </h5>
                <p className="text-[11px] leading-relaxed text-neutral-600">
                  Please verify the details below. If something is wrong, click &quot;Go Back &amp; Edit&quot;. Once confirmed, the booking cannot be changed or cancelled.
                </p>
                <p className="text-[11px] font-bold text-red-600 pt-0.5">
                  ⚠️ Wrong details will result in a failed booking.
                </p>
              </div>
            </div>

            {/* Buttons (Bilingual) */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sticky bottom-0">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={loading}
                className="w-full sm:w-auto rounded-lg border border-[#D0D5DD] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#344054] hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                திரும்பிச் சென்று திருத்து (Go Back &amp; Edit)
              </button>

              <button
                type="button"
                onClick={handleExecuteConfirmedBooking}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#C98219] hover:bg-[#B57414] px-5 py-2.5 text-[12.5px] font-bold text-white transition-all shadow-subtle hover:shadow cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>சமர்ப்பிக்கிறது... (Submitting...)</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>ஆம், சமர்ப்பிக்கவும் (Yes, Submit)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Devotee Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteAccountId)}
        title="Delete Saved Devotee Profile"
        description="Are you sure you want to delete this saved devotee profile? The credentials will be permanently removed from your centre's stored list."
        confirmLabel="Delete Profile"
        cancelLabel="Cancel"
        isDestructive={true}
        loading={Boolean(deletingAccountId)}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setPendingDeleteAccountId(null)}
      />

      {/* Mobile Sticky Docked Summary Bar */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E4E7EC] px-4 py-2.5 shadow-modal flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">
            Total ({pilgrimCount} Pilgrim{pilgrimCount !== 1 ? 's' : ''})
          </p>
          <p className="text-[16px] font-extrabold text-[#172033] tabular-nums leading-tight">
            ₹{(pricingBreakdown?.totalPrice || serviceFee * Math.max(1, pilgrimCount)).toLocaleString('en-IN')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (pilgrimCount < 1) {
              setExplicitPilgrimCount(1, false);
              return;
            }
            if (!areNomineesFilled(nominees, pilgrimCount)) {
              setError('Please fill in the Nominee Details for all pilgrims before submitting.');
              return;
            }
            if (accountMode === 'saved' && selectedAccountId && !revealedPasswords[selectedAccountId]) {
              api.getAccountPassword(selectedAccountId)
                .then((res: any) => {
                  if (res?.password) {
                    setRevealedPasswords((prev) => ({ ...prev, [selectedAccountId]: res.password }));
                  }
                })
                .catch(() => null);
            }
            setIsConfirmModalOpen(true);
          }}
          disabled={loading || isInsufficientBalance}
          className="rounded-[7px] bg-[#C98219] hover:bg-[#B57414] text-white font-bold px-4 py-2 text-[12.5px] shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
        >
          <span>Review &amp; Submit</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
