'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlatformPageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  badge?: string;
  icon?: LucideIcon;
  iconColor?: string;
  badgeClassName?: string;
  titleClassName?: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PlatformPageHeader: React.FC<PlatformPageHeaderProps> = ({
  title,
  subtitle,
  badge,
  icon: Icon,
  iconColor = 'text-[#C98219]',
  badgeClassName = 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]',
  titleClassName,
  backHref,
  backLabel = 'Back to Platform',
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-3 pb-4 border-b border-[#E2E8F0]', className)}>
      {backHref && (
        <div className="flex items-center gap-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-semibold text-[#475467] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#64748B]" />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {badge && (
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border', badgeClassName)}>
                {badge}
              </span>
            )}
          </div>
          <h1 className={cn('text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#0F172A] flex items-center gap-2.5', titleClassName)}>
            {Icon && <Icon className={cn('h-6 w-6', iconColor)} />}
            <span>{title}</span>
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
      </div>
    </div>
  );
};
