import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricBlockProps {
  label: string;
  value: string | number;
  subtext?: string;
  helper?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'info';
  className?: string;
}

export const MetricBlock: React.FC<MetricBlockProps> = ({
  label,
  value,
  subtext,
  helper,
  icon: Icon,
  variant = 'default',
  className,
}) => {
  const iconVariants = {
    default: 'text-[#667085] bg-[#F2F4F7]',
    brand: 'text-[#C98219] bg-[#FDF7ED]',
    success: 'text-[#198754] bg-[#EAF7EE]',
    warning: 'text-[#B7791F] bg-[#FEF7E6]',
    info: 'text-[#3568A8] bg-[#EDF4FC]',
  };

  const displayText = subtext || helper;

  return (
    <div
      className={cn(
        'rounded-[10px] border border-[#E6EAF0] bg-white p-5 shadow-subtle flex flex-col justify-between',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-semibold tracking-wider text-[#667085] uppercase">
          {label}
        </span>
        {Icon && (
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-[6px]',
              iconVariants[variant],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-[26px] font-bold text-[#172033] tracking-tight tabular-nums leading-none">
          {value}
        </p>
        {displayText && (
          <p className="mt-1.5 text-[12px] text-[#667085] leading-tight">
            {displayText}
          </p>
        )}
      </div>
    </div>
  );
};
