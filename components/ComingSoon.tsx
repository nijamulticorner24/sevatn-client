'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Compass,
  Layers,
  ArrowLeft,
  Terminal,
  Code2,
  Cpu,
  FileCode,
  Activity,
} from 'lucide-react';

interface Milestone {
  title: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  desc: string;
}

interface ComingSoonProps {
  title: string;
  category: string;
  fileName?: string;
  codeSnippet?: string[];
  expectedDate?: string;
  icon?: React.ReactNode;
  milestones?: Milestone[];
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  category,
  fileName = 'nija-service-builder.ts',
  codeSnippet = [
    '// NIJA Engineering — Live Pipeline',
    'import { NijaKernel, ServiceRouter } from "@nija/core";',
    '',
    'export async function deployModule(centreId: string) {',
    '  const geofence = await NijaKernel.verifyGPS({ radius: "5KM" });',
    '  console.log("[NIJA] Geofence verified. Initializing secure pipeline...");',
    '  ',
    '  // NIJA is actively working here on this module',
    '  return ServiceRouter.buildBridge({ status: "BUILDING_BY_NIJA" });',
    '}',
  ],
  expectedDate = 'November 2026',
  icon,
  milestones = [
    {
      title: 'Infrastructure & Geofence Architecture',
      status: 'completed',
      desc: '5 KM tamper-resistant GPS validation and multi-tenant security.',
    },
    {
      title: 'Department API Integration (By NIJA)',
      status: 'in-progress',
      desc: 'NIJA Engineering team is currently coding official data bridges.',
    },
    {
      title: 'Pilot Testing & Centre Rollout',
      status: 'upcoming',
      desc: 'Phased enablement across verified eSevai centres in Tamil Nadu.',
    },
  ],
}) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Full raw code string
  const fullCodeText = codeSnippet.join('\n');
  const [charCount, setCharCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Character-by-character live typewriter coding animation
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isPaused) {
      // Pause at the end of typing before looping
      timer = setTimeout(() => {
        setCharCount(0);
        setIsPaused(false);
      }, 2800);
      return () => clearTimeout(timer);
    }

    if (charCount < fullCodeText.length) {
      // Vary typing speed slightly for organic developer typing feel (20ms - 45ms)
      const nextChar = fullCodeText[charCount];
      const delay = nextChar === '\n' ? 120 : nextChar === ' ' ? 20 : Math.floor(Math.random() * 25) + 20;

      timer = setTimeout(() => {
        setCharCount((prev) => prev + 1);
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, delay);
    } else {
      setIsPaused(true);
    }

    return () => clearTimeout(timer);
  }, [charCount, fullCodeText, isPaused]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOrPhone.trim()) {
      setSubscribed(true);
    }
  };

  // Convert currently typed character slice back into lines for rendering
  const typedText = fullCodeText.slice(0, charCount);
  const lines = typedText.split('\n');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Back Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#667085] hover:text-[#172033] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-[#C98219]" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-[11.5px] font-bold text-[#8F5A0D]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C98219] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C98219]"></span>
          </span>
          NIJA Engineering Live Development
        </span>
      </div>

      {/* Main Showcase Hero Card */}
      <div className="relative overflow-hidden rounded-[12px] border border-[#E6EAF0] bg-white p-6 sm:p-9 shadow-subtle text-center">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#FEF7E6] blur-3xl opacity-60 pointer-events-none" />

        {/* Animated Radar Pulse Icon Container */}
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#FEF7E6] animate-ping opacity-30" />
          <div className="absolute -inset-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6]/40" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF7E6] text-[#C98219] border border-[#F9DE9B] shadow-subtle">
            {icon || <Code2 className="h-8 w-8 animate-pulse text-[#C98219]" />}
          </div>
        </div>

        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E6EAF0] bg-[#F7F9FC] px-3.5 py-1 text-xs font-bold text-[#667085] mb-2">
          <Sparkles className="h-3.5 w-3.5 text-[#C98219]" />
          <span>{category}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#172033]">
          {title}
        </h1>

        {/* REAL-TIME ANIMATED WRITING CODE TERMINAL */}
        <div className="mt-6 text-left max-w-2xl mx-auto rounded-[10px] border border-[#E6EAF0] bg-[#F8FAFC] shadow-subtle overflow-hidden">
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#E6EAF0]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#EF4444] inline-block" />
                <span className="h-3 w-3 rounded-full bg-[#F59E0B] inline-block" />
                <span className="h-3 w-3 rounded-full bg-[#10B981] inline-block" />
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-[#F7F9FC] px-2.5 py-1 text-xs font-mono font-bold text-[#172033] border border-[#E6EAF0]">
                <FileCode className="h-3.5 w-3.5 text-[#C98219]" />
                <span>{fileName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-[#667085]">
                <Activity className="h-3 w-3 text-[#198754] animate-pulse" />
                Live Typing
              </span>
              <div className="flex items-center gap-1.5 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-2.5 py-0.5 text-[10.5px] font-bold text-[#8F5A0D]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C98219] animate-pulse inline-block" />
                <span>NIJA Working Here</span>
              </div>
            </div>
          </div>

          {/* Code Typing Area */}
          <div
            ref={scrollRef}
            className="p-4 sm:p-5 font-mono text-[12px] sm:text-[13px] leading-relaxed overflow-x-auto min-h-[210px] max-h-[260px] bg-[#FAFCFF] select-none"
          >
            {lines.map((line, idx) => {
              const isLastLine = idx === lines.length - 1;
              return (
                <div key={idx} className="flex gap-3 items-baseline">
                  <span className="text-[#98A2B3] text-[11px] w-5 text-right shrink-0 select-none">
                    {idx + 1}
                  </span>
                  <span
                    className={
                      line.startsWith('//')
                        ? 'text-[#667085] italic font-medium'
                        : line.includes('import') ||
                          line.includes('export') ||
                          line.includes('function') ||
                          line.includes('return') ||
                          line.includes('const') ||
                          line.includes('await') ||
                          line.includes('async')
                        ? 'text-[#C98219] font-bold'
                        : line.includes('"') || line.includes("'")
                        ? 'text-[#198754]'
                        : 'text-[#172033]'
                    }
                  >
                    {line}
                    {isLastLine && (
                      <span className="inline-block w-2 h-4 bg-[#C98219] ml-0.5 animate-pulse align-middle" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom Live Compiler Status Bar */}
          <div className="px-4 py-2.5 bg-[#F1F5F9] border-t border-[#E6EAF0] flex items-center justify-between text-[11.5px] text-[#667085] font-mono">
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-[#C98219] animate-spin [animation-duration:3s]" />
              <span className="text-[#172033] font-bold">
                {isPaused ? (
                  <span className="text-[#198754]">✅ Compilation Success (NIJA Core)</span>
                ) : (
                  <span>Typing: {charCount} / {fullCodeText.length} chars</span>
                )}
              </span>
            </div>
            <span className="text-[#8F5A0D] font-bold flex items-center gap-1">
              ⚡ NIJA Engineer Coding Live
            </span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mt-7 max-w-md mx-auto rounded-[10px] border border-[#E6EAF0] bg-[#F7F9FC] p-4 text-left">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-[#172033] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#C98219]" />
              Launch Readiness
            </span>
            <span className="text-[#C98219] font-mono">85% Complete</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E6EAF0]">
            <div
              className="h-full rounded-full bg-[#C98219] transition-all duration-1000 ease-out"
              style={{ width: '85%' }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#667085] text-right">
            Expected Rollout: <span className="font-bold text-[#172033]">{expectedDate}</span>
          </p>
        </div>

        {/* Notification Subscription Form */}
        <div className="mt-7 max-w-md mx-auto">
          {subscribed ? (
            <div className="rounded-[8px] border border-[#C3E6CB] bg-[#EAF7EE] p-3.5 text-center text-xs text-[#198754] font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>You are subscribed! NIJA will notify your centre when this module is deployed.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Enter Mobile / Email to get notified"
                className="flex-1 rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#98A2B3] focus:border-[#C98219] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-[7px] bg-[#C98219] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Bell className="h-4 w-4" />
                <span>Notify Me</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Feature Roadmap & Pipeline */}
      <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle">
        <h2 className="text-base font-bold text-[#172033] flex items-center gap-2 mb-5">
          <Layers className="h-4 w-4 text-[#C98219]" />
          Deployment Roadmap & Verification Pipeline
        </h2>

        <div className="space-y-4">
          {milestones.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3.5 rounded-[8px] border border-[#E6EAF0] bg-[#F8FAFC] transition-colors"
            >
              <div className="mt-0.5">
                {item.status === 'completed' && (
                  <CheckCircle2 className="h-5 w-5 text-[#198754]" />
                )}
                {item.status === 'in-progress' && (
                  <div className="h-5 w-5 rounded-full border-2 border-[#C98219] flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-[#C98219] animate-pulse" />
                  </div>
                )}
                {item.status === 'upcoming' && (
                  <div className="h-5 w-5 rounded-full border-2 border-[#D0D5DD] bg-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-[#172033]">{item.title}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      item.status === 'completed'
                        ? 'bg-[#EAF7EE] text-[#198754] border-[#C3E6CB]'
                        : item.status === 'in-progress'
                        ? 'bg-[#FEF7E6] text-[#8F5A0D] border-[#F9DE9B]'
                        : 'bg-[#F0F3F8] text-[#667085] border-[#E6EAF0]'
                    }`}
                  >
                    {item.status === 'completed'
                      ? 'Completed'
                      : item.status === 'in-progress'
                      ? 'In Progress (NIJA)'
                      : 'Planned'}
                  </span>
                </div>
                <p className="text-xs text-[#667085] mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Service Redirect Banner */}
      <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-white text-[#C98219] border border-[#F9DE9B] shadow-subtle">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#172033]">
              Need Virtual-Q Booking Right Now?
            </h4>
            <p className="text-xs text-[#8F5A0D] mt-0.5">
              TicketAssist is active with 5-minute automated queue watchers.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/bookings/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-[7px] bg-[#C98219] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#B57414] shadow-subtle transition-colors shrink-0"
        >
          <span>Open TicketAssist</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
