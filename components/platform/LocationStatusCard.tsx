'use client';

import React from 'react';
import { MapPin, Loader2, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LocationStatusCardProps {
  status: 'VALIDATED' | 'OUTSIDE_RADIUS' | 'UNAVAILABLE';
  distanceKm: number | null;
  locating: boolean;
  onRefresh: () => void;
  registeredDistrict?: string;
  registeredTaluk?: string;
  className?: string;
}

export const LocationStatusCard: React.FC<LocationStatusCardProps> = ({
  status,
  distanceKm,
  locating,
  onRefresh,
  registeredDistrict,
  registeredTaluk,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-[12px] border border-[#E2E8F0] bg-white p-5 shadow-subtle transition-all',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border shadow-2xs',
              status === 'VALIDATED'
                ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                : status === 'OUTSIDE_RADIUS'
                ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
            )}
          >
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-[#0F172A]">5 KM Service Location Guard</h3>
              <span
                className={cn(
                  'rounded px-2 py-0.5 text-[10.5px] font-bold border',
                  status === 'VALIDATED'
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                    : status === 'OUTSIDE_RADIUS'
                    ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                    : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
                )}
              >
                {status === 'VALIDATED'
                  ? 'Location Verified (Authorized)'
                  : status === 'OUTSIDE_RADIUS'
                  ? 'Access Restricted (Outside 5 KM)'
                  : 'GPS Sync Required'}
              </span>
            </div>

            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              {status === 'VALIDATED' && (
                <span>
                  You are within your registered service boundary
                  {distanceKm !== null ? ` (${distanceKm} km away)` : ''} in{' '}
                  <strong className="text-[#0F172A]">
                    {registeredDistrict || 'Tamil Nadu'}
                    {registeredTaluk ? ` (${registeredTaluk})` : ''}
                  </strong>
                  . Full service dispatch and instant verifications are enabled.
                </span>
              )}
              {status === 'OUTSIDE_RADIUS' && (
                <span className="text-[#B91C1C] font-medium">
                  Service access restricted: Current GPS position is {distanceKm} KM away from your
                  registered centre coordinates. Maximum allowed operating radius is 5 KM.
                </span>
              )}
              {status === 'UNAVAILABLE' && (
                <span>
                  Please enable browser GPS access to validate your physical workstation location
                  against your registered centre address.
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={locating}
          className="rounded-[7px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center gap-2 self-start sm:self-auto shrink-0 shadow-2xs disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1D4ED8]" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-[#1D4ED8]" />
          )}
          <span>{locating ? 'Acquiring GPS...' : 'Sync GPS Location'}</span>
        </button>
      </div>
    </div>
  );
};
