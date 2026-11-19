'use client';

import React, { useState } from 'react';
import { Megaphone, X, Radio } from 'lucide-react';

export interface HeaderMarqueeBarProps {
  text: string;
  bgColor?: string; // 'DEFAULT' | 'GOLD' | 'ALERT' | 'EMERALD'
  speed?: number; // seconds, default 30
  dismissible?: boolean;
}

export const HeaderMarqueeBar: React.FC<HeaderMarqueeBarProps> = ({
  text,
  bgColor = 'DEFAULT',
  speed = 30,
  dismissible = true,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!text || dismissed) return null;

  // Theme styles
  const themes: Record<string, { bar: string; badge: string; text: string; dot: string }> = {
    DEFAULT: {
      bar: 'bg-[#0F172A] border-b border-slate-800 text-slate-100',
      badge: 'bg-slate-800/90 text-amber-300 border-slate-700',
      text: 'text-slate-100',
      dot: 'bg-amber-400',
    },
    GOLD: {
      bar: 'bg-[#8F5A0D] border-b border-[#734708] text-white',
      badge: 'bg-black/25 text-amber-100 border-white/20',
      text: 'text-white',
      dot: 'bg-white',
    },
    ALERT: {
      bar: 'bg-[#991B1B] border-b border-red-900 text-white',
      badge: 'bg-black/25 text-red-100 border-white/20',
      text: 'text-white',
      dot: 'bg-red-200 animate-ping',
    },
    EMERALD: {
      bar: 'bg-[#065F46] border-b border-emerald-900 text-white',
      badge: 'bg-black/25 text-emerald-100 border-white/20',
      text: 'text-white',
      dot: 'bg-emerald-300',
    },
  };

  const currentTheme = themes[bgColor] || themes.DEFAULT;
  const duration = Math.max(10, Math.min(speed || 30, 120));

  return (
    <div
      className={`relative z-50 flex items-center h-8 sm:h-9 overflow-hidden text-xs font-medium select-none shadow-sm ${currentTheme.bar}`}
      role="region"
      aria-label="Site Header Announcement Marquee"
    >
      {/* Left Pinned Label / Badge */}
      <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1 shrink-0 z-10 shadow-md">
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${currentTheme.dot}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${currentTheme.dot}`} />
        </span>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${currentTheme.badge}`}>
          <Megaphone className="h-3 w-3" />
          <span>Notice</span>
        </span>
      </div>

      {/* Marquee Scrolling Text Track */}
      <div className="relative flex-1 overflow-hidden h-full flex items-center group">
        <div
          className="inline-flex items-center whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused]"
          style={{
            animation: `marqueeScroll ${duration}s linear infinite`,
          }}
        >
          {/* Repeated items ensure seamless continuous scroll */}
          <span className="inline-block px-8 font-semibold tracking-wide">
            {text}
          </span>
          <span className="inline-block px-8 opacity-40 text-[10px]">• • •</span>
          <span className="inline-block px-8 font-semibold tracking-wide">
            {text}
          </span>
          <span className="inline-block px-8 opacity-40 text-[10px]">• • •</span>
          <span className="inline-block px-8 font-semibold tracking-wide">
            {text}
          </span>
          <span className="inline-block px-8 opacity-40 text-[10px]">• • •</span>
        </div>
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 mr-2 rounded hover:bg-black/20 text-white/70 hover:text-white transition-colors shrink-0 z-10"
          title="Dismiss notification for this session"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Inline Keyframes style */}
      <style jsx>{`
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};
