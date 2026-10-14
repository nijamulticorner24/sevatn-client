import React from 'react';
import { cn } from '@/lib/utils';

export type SystemStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'QUEUED'
  | 'ASSIGNED'
  | 'WATCHING'
  | 'WAITING'
  | 'AVAILABILITY_FOUND'
  | 'BOOKING'
  | 'CONFIRMATION_CHECK'
  | 'SUCCESS'
  | 'FAILED'
  | 'UNKNOWN'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REQUIRES_HUMAN'
  | 'ONLINE'
  | 'BUSY'
  | 'OFFLINE'
  | 'IDLE';

interface StateBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

interface BadgeConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
  pulse?: boolean;
}

export const StateBadge: React.FC<StateBadgeProps> = ({
  status,
  className,
  size = 'md',
  showDot = true,
}) => {
  const key = status?.toUpperCase() || 'UNKNOWN';

  const config: Record<string, BadgeConfig> = {
    // Queue & Initial States
    DRAFT: {
      bg: 'bg-[#F2F4F7]',
      text: 'text-[#344054]',
      border: 'border-[#D0D5DD]',
      dot: 'bg-[#667085]',
      label: 'Draft',
    },
    SUBMITTED: {
      bg: 'bg-[#EDF4FC]',
      text: 'text-[#204E8A]',
      border: 'border-[#BDD6F2]',
      dot: 'bg-[#3568A8]',
      label: 'Submitted',
    },
    QUEUED: {
      bg: 'bg-[#F1F4F9]',
      text: 'text-[#3B485C]',
      border: 'border-[#D3DCE8]',
      dot: 'bg-[#5C6B84]',
      label: 'Queued',
      pulse: true,
    },
    ASSIGNED: {
      bg: 'bg-[#EFF8FF]',
      text: 'text-[#175CD3]',
      border: 'border-[#B2DDFF]',
      dot: 'bg-[#2E90FA]',
      label: 'Assigned',
    },

    // Availability & Monitoring (Calm Amber)
    WATCHING: {
      bg: 'bg-[#FEF7E6]',
      text: 'text-[#8F5A0D]',
      border: 'border-[#F9DE9B]',
      dot: 'bg-[#C98219]',
      label: 'Watching Slots',
      pulse: true,
    },
    WAITING: {
      bg: 'bg-[#FEF7E6]',
      text: 'text-[#8F5A0D]',
      border: 'border-[#F9DE9B]',
      dot: 'bg-[#C98219]',
      label: 'Next Check Scheduled',
    },
    AVAILABILITY_FOUND: {
      bg: 'bg-[#EBFDF2]',
      text: 'text-[#027A48]',
      border: 'border-[#A6F4C5]',
      dot: 'bg-[#12B76A]',
      label: 'Slots Available',
      pulse: true,
    },

    // In Progress Execution
    BOOKING: {
      bg: 'bg-[#EFF8FF]',
      text: 'text-[#175CD3]',
      border: 'border-[#B2DDFF]',
      dot: 'bg-[#2E90FA]',
      label: 'Booking in Progress',
      pulse: true,
    },
    CONFIRMATION_CHECK: {
      bg: 'bg-[#F9F5FF]',
      text: 'text-[#6941C6]',
      border: 'border-[#E9D7FE]',
      dot: 'bg-[#7F56D9]',
      label: 'Verifying Official Pass',
      pulse: true,
    },

    // Terminal States
    SUCCESS: {
      bg: 'bg-[#EAF7EE]',
      text: 'text-[#106A3B]',
      border: 'border-[#BFE4C9]',
      dot: 'bg-[#198754]',
      label: 'Pass Confirmed',
    },
    COMPLETED: {
      bg: 'bg-[#EAF7EE]',
      text: 'text-[#106A3B]',
      border: 'border-[#BFE4C9]',
      dot: 'bg-[#198754]',
      label: 'Pass Confirmed',
    },
    BOOKING_CONFIRMED: {
      bg: 'bg-[#EAF7EE]',
      text: 'text-[#106A3B]',
      border: 'border-[#BFE4C9]',
      dot: 'bg-[#198754]',
      label: 'Pass Confirmed',
    },
    WISHLIST_ADDED: {
      bg: 'bg-[#EAF7EE]',
      text: 'text-[#106A3B]',
      border: 'border-[#BFE4C9]',
      dot: 'bg-[#198754]',
      label: 'Pass Confirmed',
    },
    EXECUTING: {
      bg: 'bg-[#EFF8FF]',
      text: 'text-[#175CD3]',
      border: 'border-[#B2DDFF]',
      dot: 'bg-[#2E90FA]',
      label: 'Processing Booking',
      pulse: true,
    },
    FAILED: {
      bg: 'bg-[#FDECEC]',
      text: 'text-[#992B26]',
      border: 'border-[#F8C4C2]',
      dot: 'bg-[#C2413B]',
      label: 'Unsuccessful',
    },
    UNKNOWN: {
      bg: 'bg-[#FFF8E6]',
      text: 'text-[#8B5A0C]',
      border: 'border-[#FCE0A6]',
      dot: 'bg-[#B7791F]',
      label: 'Verification Pending',
    },
    CANCELLED: {
      bg: 'bg-[#F2F4F7]',
      text: 'text-[#475467]',
      border: 'border-[#EAECF0]',
      dot: 'bg-[#98A2B3]',
      label: 'Cancelled',
    },
    EXPIRED: {
      bg: 'bg-[#F8F9FA]',
      text: 'text-[#667085]',
      border: 'border-[#E6EAF0]',
      dot: 'bg-[#98A2B3]',
      label: 'Cycle Expired',
    },
    REQUIRES_HUMAN: {
      bg: 'bg-[#FEF3F2]',
      text: 'text-[#B42318]',
      border: 'border-[#FECDCA]',
      dot: 'bg-[#F04438]',
      label: 'Action Required',
      pulse: true,
    },

    // Worker Status
    ONLINE: {
      bg: 'bg-[#EAF7EE]',
      text: 'text-[#106A3B]',
      border: 'border-[#BFE4C9]',
      dot: 'bg-[#198754]',
      label: 'Online',
    },
    BUSY: {
      bg: 'bg-[#FEF7E6]',
      text: 'text-[#8F5A0D]',
      border: 'border-[#F9DE9B]',
      dot: 'bg-[#C98219]',
      label: 'Busy',
      pulse: true,
    },
    IDLE: {
      bg: 'bg-[#EFF8FF]',
      text: 'text-[#175CD3]',
      border: 'border-[#B2DDFF]',
      dot: 'bg-[#2E90FA]',
      label: 'Idle / Ready',
    },
    OFFLINE: {
      bg: 'bg-[#F2F4F7]',
      text: 'text-[#667085]',
      border: 'border-[#D0D5DD]',
      dot: 'bg-[#98A2B3]',
      label: 'Offline',
    },
  };

  const style: BadgeConfig = config[key] || {
    bg: 'bg-[#F2F4F7]',
    text: 'text-[#475467]',
    border: 'border-[#D0D5DD]',
    dot: 'bg-[#667085]',
    label: key,
    pulse: false,
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-[12px] font-medium',
    lg: 'px-3 py-1 text-[13px] font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border leading-normal select-none',
        style.bg,
        style.text,
        style.border,
        sizeClasses[size],
        className,
      )}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {style.pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                style.dot,
              )}
            />
          )}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', style.dot)} />
        </span>
      )}
      <span>{style.label}</span>
    </span>
  );
};
