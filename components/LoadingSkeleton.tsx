import React from 'react';
import { cn } from '@/lib/utils';

export const LoadingSkeleton: React.FC<{
  className?: string;
  rows?: number;
}> = ({ className, rows = 1 }) => {
  return (
    <div className="space-y-2.5 animate-pulse w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn('h-4 bg-[#E6EAF0] rounded-[6px] w-full', className)}
        />
      ))}
    </div>
  );
};
