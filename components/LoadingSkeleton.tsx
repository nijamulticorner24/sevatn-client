import React from 'react';
import { cn } from '@/lib/utils';

export const LoadingSkeleton: React.FC<{
  className?: string;
  rows?: number;
  count?: number;
}> = ({ className, rows, count }) => {
  const effectiveRows = rows ?? count ?? 1;
  return (
    <div className="space-y-2.5 animate-pulse w-full">
      {Array.from({ length: effectiveRows }).map((_, i) => (
        <div
          key={i}
          className={cn('h-4 bg-[#E6EAF0] rounded-[6px] w-full', className)}
        />
      ))}
    </div>
  );
};
