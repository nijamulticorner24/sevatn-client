'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'destructive-outline' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-[7px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 select-none active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

    const variantStyles = {
      primary:
        'bg-[#C98219] hover:bg-[#B57414] text-white font-bold shadow-subtle focus:ring-[#C98219]/40',
      secondary:
        'border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB] hover:border-[#98A2B3] font-semibold focus:ring-[#C98219]/20 shadow-xs',
      destructive:
        'bg-[#C2413B] hover:bg-[#A8322B] text-white font-bold shadow-subtle focus:ring-[#C2413B]/40',
      'destructive-outline':
        'border border-[#F5C6CB] bg-[#FDECEC] text-[#C2413B] hover:bg-[#F8D7DA] font-semibold focus:ring-[#C2413B]/20',
      outline:
        'border border-[#E4E7EC] bg-transparent text-[#172033] hover:bg-[#F7F9FC] font-medium focus:ring-[#1D4ED8]/20',
      ghost:
        'bg-transparent text-[#475467] hover:bg-[#F0F3F8] hover:text-[#172033] font-medium focus:ring-neutral-200',
      icon:
        'border border-[#D0D5DD] bg-white text-[#475467] hover:bg-[#F9FAFB] hover:text-[#172033] p-2 focus:ring-[#C98219]/20 shadow-xs',
    };

    const sizeStyles = {
      sm: 'h-8 px-2.5 text-[11.5px] gap-1.5',
      md: 'h-9.5 px-3.5 text-[13px] gap-2',
      lg: 'h-11 px-5 text-[14px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          variant !== 'icon' && sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
