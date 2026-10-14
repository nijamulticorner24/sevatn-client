import React from 'react';
import { LucideIcon, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FileQuestion,
  actionLabel,
  onAction,
  action,
  className,
}) => {
  const btnLabel = action?.label || actionLabel;
  const btnClick = action?.onClick || onAction;

  return (
    <div
      className={cn(
        'rounded-[10px] border border-dashed border-[#D0D5DD] bg-[#FAFCFF] p-10 text-center flex flex-col items-center justify-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F2F4F7] text-[#667085] mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-[15px] font-semibold text-[#172033]">{title}</h3>
      <p className="mt-1 text-[13px] text-[#667085] max-w-sm leading-relaxed">
        {description}
      </p>
      {btnLabel && btnClick && (
        <button
          type="button"
          onClick={btnClick}
          className="mt-4 rounded-[7px] bg-[#C98219] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#B57414] transition-colors shadow-subtle"
        >
          {btnLabel}
        </button>
      )}
    </div>
  );
};
