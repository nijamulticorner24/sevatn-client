'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight, ShieldCheck, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ServiceCardProps {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  status: 'ACTIVE' | 'BETA' | 'MAINTENANCE' | 'COMING_SOON';
  requiresLocation?: boolean;
  locationStatus?: 'VALIDATED' | 'OUTSIDE_RADIUS' | 'UNAVAILABLE';
  primaryAction: {
    label: string;
    href: string;
    icon?: LucideIcon;
    external?: boolean;
  };
  secondaryAction?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
  highlights?: string[];
  metrics?: {
    label: string;
    value: string | number;
  }[];
  badge?: string;
  className?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  category,
  description,
  icon: Icon,
  iconColor = 'text-[#C98219]',
  iconBg = 'bg-[#FEF7E6] border-[#F9DE9B]',
  status,
  requiresLocation = true,
  locationStatus,
  primaryAction,
  secondaryAction,
  highlights = [],
  metrics = [],
  badge,
  className,
}) => {
  const isAvailable = status === 'ACTIVE' || status === 'BETA';
  const PrimaryIcon = primaryAction.icon || ArrowRight;

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-[12px] border border-[#E2E8F0] bg-white p-6 shadow-subtle transition-all duration-200 hover:border-[#C98219]/40 hover:shadow-card',
        className,
      )}
    >
      <div>
        {/* Top Header / Badges */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border shadow-2xs transition-transform group-hover:scale-105',
                iconBg,
              )}
            >
              <Icon className={cn('h-6 w-6', iconColor)} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  {category}
                </span>
                {badge && (
                  <span className="rounded bg-[#FEF7E6] px-2 py-0.5 text-[10px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                    {badge}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] tracking-tight group-hover:text-[#C98219] transition-colors">
                {title}
              </h3>
            </div>
          </div>

          <div className="shrink-0">
            {status === 'ACTIVE' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-2.5 py-1 text-[11px] font-bold text-[#15803D] border border-[#BBF7D0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
                Operational
              </span>
            )}
            {status === 'BETA' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-bold text-[#1D4ED8] border border-[#BFDBFE]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8] animate-pulse" />
                Live Beta
              </span>
            )}
            {status === 'MAINTENANCE' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFBEB] px-2.5 py-1 text-[11px] font-bold text-[#B45309] border border-[#FDE68A]">
                Maintenance
              </span>
            )}
            {status === 'COMING_SOON' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-bold text-[#64748B] border border-[#E2E8F0]">
                Coming Soon
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mt-3.5 text-xs sm:text-[13px] text-[#64748B] leading-relaxed">
          {description}
        </p>

        {/* Highlights / Features List */}
        {highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 text-[11px] font-medium text-[#475467]"
              >
                <CheckCircle2 className="h-3 w-3 text-[#15803D]" />
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Metrics Grid if provided */}
        {metrics.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-[#E2E8F0]">
            {metrics.map((m, i) => (
              <div key={i} className="rounded-[8px] bg-[#F8FAFC] p-2 border border-[#E2E8F0]/80">
                <span className="block text-[10.5px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {m.label}
                </span>
                <span className="text-sm font-extrabold text-[#0F172A] tabular-nums">
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Location & Actions */}
      <div className="mt-5 pt-4 border-t border-[#E2E8F0] space-y-3">
        {requiresLocation && locationStatus && (
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-[#64748B] flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#1D4ED8]" />
              5 KM Guard:
            </span>
            <span
              className={cn(
                'font-semibold',
                locationStatus === 'VALIDATED'
                  ? 'text-[#15803D]'
                  : locationStatus === 'OUTSIDE_RADIUS'
                  ? 'text-[#B91C1C]'
                  : 'text-[#B45309]',
              )}
            >
              {locationStatus === 'VALIDATED'
                ? 'Verified Area'
                : locationStatus === 'OUTSIDE_RADIUS'
                ? 'Outside 5 KM Radius'
                : 'GPS Check Needed'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {isAvailable ? (
            <Link
              href={primaryAction.href}
              className="flex-1 rounded-[7px] bg-[#C98219] px-4 py-2.5 text-xs sm:text-[13px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle flex items-center justify-center gap-2 group-hover:shadow-card"
            >
              <span>{primaryAction.label}</span>
              <PrimaryIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 rounded-[7px] bg-[#E2E8F0] px-4 py-2.5 text-xs sm:text-[13px] font-bold text-[#94A3B8] cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>{primaryAction.label}</span>
            </button>
          )}

          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="rounded-[7px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              {secondaryAction.icon && <secondaryAction.icon className="h-3.5 w-3.5 text-[#64748B]" />}
              <span>{secondaryAction.label}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
