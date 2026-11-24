'use client';

import React from 'react';
import { Coins } from 'lucide-react';

interface CoinIconProps {
  className?: string;
  size?: number;
}

export const CoinIcon: React.FC<CoinIconProps> = ({
  className = 'h-3.5 w-3.5 text-[#C98219] inline-block align-middle shrink-0',
  size,
}) => {
  return <Coins className={className} size={size} />;
};

export const CoinAmount: React.FC<{
  amount: number | string;
  className?: string;
  iconClassName?: string;
  showChipsLabel?: boolean;
}> = ({
  amount,
  className = 'inline-flex items-center gap-1 font-bold tabular-nums',
  iconClassName = 'h-3.5 w-3.5 text-[#C98219] shrink-0',
  showChipsLabel = false,
}) => {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val || 0);

  return (
    <span className={className}>
      <Coins className={iconClassName} />
      <span>{formatted}</span>
      {showChipsLabel && <span className="font-normal text-xs text-secondary-500 ml-0.5">Chips</span>}
    </span>
  );
};

export default CoinIcon;
