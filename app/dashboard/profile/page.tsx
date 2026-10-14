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
} from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locSuccess, setLocSuccess] = useState<string | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="pb-4 border-b border-[#E6EAF0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#8F5A0D] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5 text-[#C98219]" />
            <span>SevaTN — Operator Profile</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033]">Centre Profile & Authorization</h1>
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
                  Active & Locked (5 KM Radius)
                </span>
              ) : (
                <span className="font-bold text-[#B07210] flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#D97706] inline-block" />
                  Not Configured (Click 'Register GPS')
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
                  For security and compliance, once registered, this centre's default GPS coordinates are permanently locked. Only a Super Administrator can modify coordinates.
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
              Operator & Partner Affiliation
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
            <div className="flex justify-between py-1 border-b border-[#F0F3F7]">
              <span className="text-[#667085]">Login Email:</span>
              <span className="font-mono text-[#172033]">{user?.email}</span>
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
    </div>
  );
}
