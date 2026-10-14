'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Plus,
  Wallet,
  Clock,
  Compass,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { ServiceCard } from '@/components/platform/ServiceCard';
import { LocationStatusCard } from '@/components/platform/LocationStatusCard';

// ─── Revenue Analysis Chart Component (Smooth Area/Line Graph) ─────────────────
function RevenueAnalysisChart({ bookings, wallet }: { bookings: any[]; wallet: any }) {
  const today = new Date();
  const days: { label: string; dateStr: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateStr: d.toISOString().split('T')[0],
    });
  }

  const successStatuses = ['SUCCESS', 'COMPLETED', 'BOOKING_CONFIRMED'];
  const SERVICE_FEE = 100;

  const dayData = days.map((day) => {
    const dayBookings = bookings.filter((b) => {
      const created = b.createdAt ? b.createdAt.split('T')[0] : '';
      return created === day.dateStr;
    });
    const confirmed = dayBookings.filter(
      (b) => successStatuses.includes(b.status) || b.officialReference,
    ).length;
    return { ...day, total: dayBookings.length, confirmed, revenue: confirmed * SERVICE_FEE };
  });

  const maxRevenue = Math.max(...dayData.map((d) => d.revenue), 500);
  const totalRevenue = dayData.reduce((s, d) => s + d.revenue, 0);
  const totalConfirmed = dayData.reduce((s, d) => s + d.confirmed, 0);
  const totalBookings = dayData.reduce((s, d) => s + d.total, 0);

  const W = 600;
  const H = 160;
  const PAD_L = 36;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 40;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Compute (x, y) for each data point
  const pts = dayData.map((d, i) => ({
    x: PAD_L + (i / (dayData.length - 1)) * chartW,
    y: PAD_T + chartH - (maxRevenue > 0 ? (d.revenue / maxRevenue) * chartH : 0),
    ...d,
  }));

  // Build smooth cubic bezier path through points
  const smoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cp1x = points[i].x + (points[i + 1].x - points[i].x) / 3;
      const cp1y = points[i].y;
      const cp2x = points[i + 1].x - (points[i + 1].x - points[i].x) / 3;
      const cp2y = points[i + 1].y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return d;
  };

  const linePath = smoothPath(pts);
  // Area fill: line path + close to bottom
  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1].x} ${PAD_T + chartH} L ${pts[0].x} ${PAD_T + chartH} Z`;

  // Y-axis grid values
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-[12px] border border-[#E2E8F0] bg-white p-6 shadow-subtle">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
        <div>
          <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#C98219]" />
            Revenue Analysis
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">Last 7 days — TicketAssist booking revenue</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[11px] text-[#64748B] font-medium">7-Day Revenue</p>
            <p className="text-xl font-extrabold text-[#C98219] tabular-nums">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#64748B] font-medium">Passes Confirmed</p>
            <p className="text-xl font-extrabold text-[#15803D] tabular-nums">{totalConfirmed}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#64748B] font-medium">Wallet Balance</p>
            <p className="text-xl font-extrabold text-[#0F172A] tabular-nums">
              ₹{wallet ? Number(wallet.availableBalance).toLocaleString('en-IN') : '0'}
            </p>
          </div>
        </div>
      </div>

      {/* SVG Area + Line Chart */}
      <div className="mt-5 w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          aria-label="Revenue area line chart for last 7 days"
        >
          <defs>
            {/* Gradient fill under the area */}
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C98219" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#C98219" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Y-axis grid lines + labels */}
          {yTicks.map((frac, i) => {
            const y = PAD_T + chartH - frac * chartH;
            const label = Math.round(maxRevenue * frac);
            return (
              <g key={i}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke={frac === 0 ? '#CBD5E1' : '#F1F5F9'}
                  strokeWidth={frac === 0 ? 1.5 : 1}
                />
                <text x={PAD_L - 4} y={y + 3.5} textAnchor="end" fontSize="8" fill="#94A3B8" fontFamily="system-ui">
                  ₹{label}
                </text>
              </g>
            );
          })}

          {/* Gradient area fill */}
          <path d={areaPath} fill="url(#revenueGrad)" />

          {/* Smooth revenue line */}
          <path
            d={linePath}
            fill="none"
            stroke="#C98219"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data point dots + tooltips */}
          {pts.map((p, i) => {
            const isToday = i === pts.length - 1;
            return (
              <g key={p.dateStr}>
                {/* Outer glow ring for today */}
                {isToday && (
                  <circle cx={p.x} cy={p.y} r={8} fill="#C98219" fillOpacity="0.15" />
                )}
                {/* Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isToday ? 5 : 3.5}
                  fill={p.revenue > 0 ? '#C98219' : '#CBD5E1'}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Revenue value above dot (only if > 0) */}
                {p.revenue > 0 && (
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#A96B12"
                    fontFamily="Inter, sans-serif"
                  >
                    ₹{p.revenue}
                  </text>
                )}
                {/* Day label on x-axis */}
                <text
                  x={p.x}
                  y={H - PAD_B + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isToday ? '700' : '500'}
                  fill={isToday ? '#C98219' : '#64748B'}
                  fontFamily="Inter, sans-serif"
                >
                  {p.label}
                </text>
                {/* Booking count below day label */}
                <text
                  x={p.x}
                  y={H - PAD_B + 28}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#94A3B8"
                  fontFamily="system-ui"
                >
                  {p.total > 0 ? `${p.total} appl.` : '—'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-2 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center gap-5 text-xs text-[#64748B]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-6 rounded bg-[#C98219]" /> Revenue Line
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#C98219] border-2 border-white ring-1 ring-[#C98219]" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#CBD5E1] border-2 border-white" /> No Revenue
        </span>
        <span className="ml-auto font-semibold text-[#0F172A]">
          Total Applications (7 days): <span className="text-[#C98219]">{totalBookings}</span>
        </span>
      </div>
    </div>
  );
}

// ─── Platform Home Page ────────────────────────────────────────────────────────
export default function SevaTNPlatformHomePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [instantHistory, setInstantHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Location Geofence State
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'VALIDATED' | 'OUTSIDE_RADIUS' | 'UNAVAILABLE'>('UNAVAILABLE');

  useEffect(() => {
    const u = api.getUser();
    setUser(u);

    Promise.all([
      api.getMe().catch(() => null),
      api.getWallet().catch(() => null),
      api.getBookings('ALL', 1).catch(() => ({ bookings: [] })),
      api.getInstantServiceHistory().catch(() => []),
    ]).then(([profileData, walletData, bookingsData, instantData]) => {
      if (profileData) setProfile(profileData);
      if (walletData) setWallet(walletData);
      if (bookingsData?.bookings) setBookings(bookingsData.bookings);
      if (Array.isArray(instantData)) setInstantHistory(instantData);
      setLoading(false);

      // Check GPS Location
      checkGPSLocation(profileData?.registeredLocation || profileData?.centre);
    });
  }, []);

  const checkGPSLocation = (registeredLoc?: any) => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setGpsCoords(coords);

          if (coords.accuracy !== undefined && coords.accuracy !== null && coords.accuracy > 2500) {
            console.warn(`GPS accuracy too low (${coords.accuracy}m). Discarding for geofence validation.`);
            setLocationStatus('UNAVAILABLE');
            setLocating(false);
            return;
          }

          api.setLocationCoordinates(coords.latitude, coords.longitude, coords.accuracy);

          const targetLoc = registeredLoc || profile?.registeredLocation || profile?.centre;
          if (targetLoc?.latitude && targetLoc?.longitude) {
            const d = calculateDistanceKm(coords, targetLoc);
            setDistanceKm(d);
            if (d <= 5.0) {
              setLocationStatus('VALIDATED');
            } else {
              setLocationStatus('OUTSIDE_RADIUS');
            }
          } else {
            setLocationStatus('VALIDATED');
          }
          setLocating(false);
        },
        (err) => {
          console.warn('GPS location error:', err.message);
          setLocationStatus('UNAVAILABLE');
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
    }
  };

  const calculateDistanceKm = (c1: { latitude: number; longitude: number }, c2: { latitude: number; longitude: number }) => {
    const R = 6371.0;
    const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
    const dLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1.latitude * Math.PI) / 180) *
        Math.cos((c2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const activeBookingsCount = bookings.filter(
    (b) => b.status === 'WATCHING' || b.status === 'QUEUED' || b.status === 'PENDING' || b.status === 'EXECUTING',
  ).length;

  const successfulBookingsCount = bookings.filter(
    (b) => b.status === 'SUCCESS' || b.status === 'COMPLETED' || b.status === 'BOOKING_CONFIRMED' || b.officialReference,
  ).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-[12px] border border-[#E2E8F0] bg-white animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-64 rounded-[12px] border border-[#E2E8F0] bg-white animate-pulse" />
          <div className="h-64 rounded-[12px] border border-[#E2E8F0] bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  const centre = profile?.centre;
  const partner = profile?.partner;

  return (
    <div className="space-y-7">
      {/* 1. Global Platform Identity & Welcome Banner */}
      <div className="rounded-[12px] border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs text-[#1D4ED8] font-bold mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#1D4ED8]" />
              <span>SevaTN Platform • Powered by NIJA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              {getTimeGreeting()}, {user?.name || 'Operator'}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-xl">
              <span className="font-semibold text-[#0F172A]">{centre?.centreName || 'Tamil Nadu eSevai Centre'}</span> • {centre?.district || 'Tamil Nadu'} ({centre?.taluk || 'Local Service Area'})
            </p>
          </div>

          {/* Partner & Validity Badge Card */}
          <div className="rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 shrink-0 space-y-2 min-w-[260px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B] font-medium">Authorized Partner:</span>
              <span className="font-bold text-[#0F172A]">{partner?.name || 'NIJA Digital Network'}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-[#E2E8F0] pt-2">
              <span className="text-[#64748B] font-medium">Partner Code:</span>
              <span className="font-mono font-bold text-[#1D4ED8]">{partner?.partnerCode || 'PT-001'}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-[#E2E8F0] pt-2">
              <span className="text-[#64748B] font-medium">Platform License:</span>
              <span className="font-mono font-bold text-[#15803D]">
                {user?.expiryDate ? formatDate(user.expiryDate) : 'Active License'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 5 KM Location Guard */}
      <LocationStatusCard
        status={locationStatus}
        distanceKm={distanceKm}
        locating={locating}
        onRefresh={() => checkGPSLocation()}
        registeredDistrict={centre?.district}
        registeredTaluk={centre?.taluk}
      />

      {/* 3. Your Services Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">Your Available Services</h2>
            <p className="text-xs text-[#64748B]">Enterprise assisted service modules enabled for your centre</p>
          </div>
          <Link
            href="/dashboard/services"
            className="text-xs font-bold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline flex items-center gap-1"
          >
            <span>All Services Directory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* Service 1: TicketAssist */}
          <ServiceCard
            id="ticket-assist"
            title="TicketAssist"
            category="Booking Services"
            description="Fast booking assistance service with no advance deduction. Wallet amount is debited only upon successful pass confirmation."
            icon={ShieldCheck}
            iconColor="text-[#C98219]"
            iconBg="bg-[#FEF7E6] border-[#F9DE9B]"
            status="ACTIVE"
            badge="Active"
            requiresLocation={true}
            locationStatus={locationStatus}
            highlights={[]}
            metrics={[
              { label: 'Active in Queue', value: activeBookingsCount },
              { label: 'Confirmed Passes', value: successfulBookingsCount },
              { label: 'Wallet Balance', value: wallet ? formatINR(wallet.availableBalance) : '₹0.00' },
            ]}
            primaryAction={{
              label: 'Open TicketAssist',
              href: '/dashboard/ticket-assist',
              icon: ArrowRight,
            }}
            secondaryAction={{
              label: 'New Booking',
              href: '/dashboard/bookings/new',
              icon: Plus,
            }}
          />

          {/* Service 2: Instant Service (Coming Soon) */}
          <ServiceCard
            id="instant-service"
            title="Instant Service"
            category="Citizen Services"
            description="Citizen services and automated document verification workflows are in active development for your centre."
            icon={Zap}
            iconColor="text-[#C98219]"
            iconBg="bg-[#FEF7E6] border-[#F9DE9B]"
            status="COMING_SOON"
            badge="In Development"
            requiresLocation={false}
            highlights={[]}
            metrics={[]}
            primaryAction={{
              label: 'Coming Soon',
              href: '/dashboard/services',
              icon: Clock,
            }}
          />
        </div>
      </div>

      {/* 4. Quick Actions / Platform Navigation Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/services"
          className="rounded-[10px] border border-[#E2E8F0] bg-white p-4 hover:border-[#1D4ED8] hover:bg-[#F8FAFC] shadow-subtle transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">Services Directory</p>
              <p className="text-xs text-[#64748B]">Explore all platform modules</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#1D4ED8] group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/dashboard/bookings"
          className="rounded-[10px] border border-[#E2E8F0] bg-white p-4 hover:border-[#1D4ED8] hover:bg-[#F8FAFC] shadow-subtle transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B]">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">Booking Queue</p>
              <p className="text-xs text-[#64748B]">{bookings.length} total applications</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#1D4ED8] group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/dashboard/wallet"
          className="rounded-[10px] border border-[#E2E8F0] bg-white p-4 hover:border-[#1D4ED8] hover:bg-[#F8FAFC] shadow-subtle transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">Wallet & Ledger</p>
              <p className="text-xs text-[#64748B] tabular-nums">{wallet ? formatINR(wallet.availableBalance) : '₹0.00'} balance</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#1D4ED8] group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/dashboard/profile"
          className="rounded-[10px] border border-[#E2E8F0] bg-white p-4 hover:border-[#1D4ED8] hover:bg-[#F8FAFC] shadow-subtle transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-[#F8FAFC] text-[#475467] border border-[#E2E8F0]">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">Centre Profile</p>
              <p className="text-xs text-[#64748B]">Location & Operator settings</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#1D4ED8] group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* 5. Revenue Analysis Chart */}
      <RevenueAnalysisChart bookings={bookings} wallet={wallet} />
    </div>
  );
}
