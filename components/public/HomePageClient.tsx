'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  FileCheck2,
  Clock,
  Compass,
  Headphones,
  Check,
  ChevronRight,
  Smartphone,
  LayoutGrid,
  Search,
  Activity,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { PublicFooter } from '@/components/public/PublicFooter';

export function HomePageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#171717] flex flex-col font-sans selection:bg-[#C98219]/15 selection:text-[#7A4A12]">
      {/* ========================================================= */}
      {/* SECTION A — NAVIGATION */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 h-[68px] bg-white/95 backdrop-blur-md border-b border-[#E6EAF0]">
        <div className="mx-auto max-w-[1280px] h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Brand Wordmark & Attribution */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#C98219] rounded-[8px] p-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#C98219] text-white font-bold shadow-subtle transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex items-center">
              <span className="text-[18px] font-extrabold text-[#171717] tracking-tight">
                Seva<span className="text-[#C98219]">TN</span>
              </span>
              <span className="ml-2.5 rounded-full bg-[#FEF7E6] px-2.5 py-0.5 text-[10.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                Powered by NIJA
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-[6px] text-[13.5px] font-semibold text-[#171717] hover:bg-[#F8FAFC] transition-colors"
            >
              Home
            </Link>
            <a
              href="#services"
              onClick={(e) => scrollToSection(e, 'services')}
              className="px-3.5 py-2 rounded-[6px] text-[13.5px] font-semibold text-[#525252] hover:text-[#171717] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              Our Services
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="px-3.5 py-2 rounded-[6px] text-[13.5px] font-semibold text-[#525252] hover:text-[#171717] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              How It Works
            </a>
            <Link
              href="/contact"
              className="px-3.5 py-2 rounded-[6px] text-[13.5px] font-semibold text-[#525252] hover:text-[#171717] hover:bg-[#F8FAFC] transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Right-side Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-[7px] border border-[#D0D5DD] bg-white px-4 py-2 text-[13.5px] font-semibold text-[#171717] hover:bg-[#F8FAFC] hover:border-[#98A2B3] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C98219]"
            >
              Sign In
            </Link>
            <Link
              href="/auth/login"
              className="rounded-[7px] bg-[#C98219] px-4 py-2 text-[13.5px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C98219]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Navigation Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-[6px] bg-[#C98219] px-3 py-1.5 text-[12.5px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle"
            >
              Get Started
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-[6px] text-[#525252] hover:text-[#171717] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#C98219]"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#E6EAF0] bg-white px-4 pt-3 pb-6 shadow-elevated animate-in fade-in slide-in-from-top-2">
            <nav className="space-y-1" aria-label="Mobile Navigation">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-[7px] text-[14px] font-semibold text-[#171717] bg-[#F8FAFC]"
              >
                <span>Home</span>
              </Link>
              <a
                href="#services"
                onClick={(e) => scrollToSection(e, 'services')}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-[7px] text-[14px] font-semibold text-[#525252] hover:text-[#171717] hover:bg-[#F8FAFC]"
              >
                <span>Our Services</span>
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-[7px] text-[14px] font-semibold text-[#525252] hover:text-[#171717] hover:bg-[#F8FAFC]"
              >
                <span>How It Works</span>
              </a>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-[7px] text-[14px] font-semibold text-[#525252] hover:text-[#171717] hover:bg-[#F8FAFC]"
              >
                <span>Contact</span>
              </Link>
            </nav>

            <div className="mt-4 pt-4 border-t border-[#E6EAF0] space-y-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-[7px] border border-[#D0D5DD] bg-white py-2.5 text-[13.5px] font-semibold text-[#171717]"
              >
                Sign In
              </Link>
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-[7px] bg-[#C98219] py-2.5 text-[13.5px] font-bold text-white shadow-subtle hover:bg-[#B57414]"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* SECTION B — HERO */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-white border-b border-[#E6EAF0]">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(#E5E7EB_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content (Text & CTAs) */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3.5 py-1 text-[11.5px] font-extrabold tracking-wider uppercase text-[#8F5A0D]">
                <span className="flex h-2 w-2 rounded-full bg-[#C98219]" />
                <span>ONE PLATFORM. MULTIPLE SERVICES.</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-[36px] sm:text-[46px] lg:text-[54px] font-extrabold text-[#171717] tracking-tight leading-[1.12]">
                Everything You Need, <br className="hidden sm:inline" />
                <span className="text-[#C98219]">Made Simpler.</span>
              </h1>

              {/* Supporting Description */}
              <p className="text-[16px] sm:text-[18px] text-[#525252] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Discover convenient digital services in one place. From booking assistance to everyday
                service access, SevaTN helps you get started with a simple, guided experience.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <a
                  href="#services"
                  onClick={(e) => scrollToSection(e, 'services')}
                  className="inline-flex items-center gap-2 rounded-[7px] bg-[#C98219] px-6 py-3.5 text-[14.5px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C98219]"
                >
                  <span>Explore Services</span>
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="#how-it-works"
                  onClick={(e) => scrollToSection(e, 'how-it-works')}
                  className="inline-flex items-center gap-2 rounded-[7px] border border-[#D0D5DD] bg-white px-6 py-3.5 text-[14.5px] font-semibold text-[#171717] hover:bg-[#F8FAFC] hover:border-[#98A2B3] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C98219]"
                >
                  <span>How It Works</span>
                </a>
              </div>

              {/* Trust Statement */}
              <div className="pt-3 border-t border-[#E6EAF0]/80">
                <p className="text-[13px] font-medium text-[#737373] flex items-center justify-center lg:justify-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#C98219] shrink-0" />
                  <span>Simple to use. Clear steps. Service-focused support.</span>
                </p>
              </div>
            </div>

            {/* Right Content: Refined SaaS Composition */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[420px]">
                {/* Decorative Ambient Aura */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#FEF7E6] to-[#FAF3E7] rounded-[24px] blur-xl opacity-70 -z-10" />

                {/* Main Smartphone / Interface Card */}
                <div className="rounded-[20px] border border-[#E6EAF0] bg-white p-4 sm:p-5 shadow-elevated">
                  {/* Phone Header / Status Bar */}
                  <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#F0F3F7]">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-[6px] bg-[#C98219] flex items-center justify-center text-white">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#171717] leading-none">SevaTN Hub</p>
                        <p className="text-[10px] text-[#737373] mt-0.5">Unified Access</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#198754] animate-pulse" />
                      Connected
                    </span>
                  </div>

                  {/* Service Tiles Selection Component */}
                  <div className="space-y-3">
                    {/* Booking Calendar Mini Preview */}
                    <div className="rounded-[12px] border border-[#E8D5B7] bg-[#FDF7ED]/60 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#C98219]" />
                          <span className="text-[12px] font-bold text-[#171717]">Booking Calendar</span>
                        </div>
                        <span className="rounded bg-[#FEF7E6] px-1.5 py-0.5 text-[9.5px] font-bold text-[#8F5A0D] border border-[#F9DE9B]">
                          Supported Dates
                        </span>
                      </div>

                      {/* Mini Date Strip */}
                      <div className="grid grid-cols-5 gap-1.5 text-center text-[10.5px]">
                        <div className="rounded-[6px] bg-white p-1 border border-[#E6EAF0] text-[#737373]">
                          <span className="block text-[9px]">Mon</span>
                          <span className="font-bold text-[#171717]">14</span>
                        </div>
                        <div className="rounded-[6px] bg-white p-1 border border-[#E6EAF0] text-[#737373]">
                          <span className="block text-[9px]">Tue</span>
                          <span className="font-bold text-[#171717]">15</span>
                        </div>
                        <div className="rounded-[6px] bg-[#C98219] p-1 text-white font-bold shadow-xs">
                          <span className="block text-[9px] text-white/80">Wed</span>
                          <span>16</span>
                        </div>
                        <div className="rounded-[6px] bg-white p-1 border border-[#E6EAF0] text-[#737373]">
                          <span className="block text-[9px]">Thu</span>
                          <span className="font-bold text-[#171717]">17</span>
                        </div>
                        <div className="rounded-[6px] bg-white p-1 border border-[#E6EAF0] text-[#737373]">
                          <span className="block text-[9px]">Fri</span>
                          <span className="font-bold text-[#171717]">18</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#525252] pt-1 border-t border-[#E8D5B7]/60">
                        <span>Selected Slot: <strong className="text-[#171717]">Morning Session</strong></span>
                        <span className="text-[#C98219] font-bold">Active</span>
                      </div>
                    </div>

                    {/* Digital Service Tile */}
                    <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck2 className="h-4 w-4 text-[#3568A8]" />
                          <span className="text-[12px] font-bold text-[#171717]">Digital Services</span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#198754] bg-[#EAF7EE] px-1.5 py-0.5 rounded">
                          Registry Online
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-[8px] bg-[#F8FAFC] border border-[#E6EAF0] px-3 py-2 text-[11.5px]">
                        <span className="text-[#525252]">Status Verification</span>
                        <span className="font-mono font-bold text-[#171717]">Reference #2026</span>
                      </div>
                    </div>

                    {/* Guided Steps Progress Strip */}
                    <div className="rounded-[10px] bg-[#F8FAFC] border border-[#E6EAF0] p-3 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 text-[#525252]">
                        <Clock className="h-3.5 w-3.5 text-[#C98219]" />
                        <span>Simple 3-Step Process</span>
                      </div>
                      <span className="font-semibold text-[#171717]">SevaTN Assisted</span>
                    </div>
                  </div>
                </div>

                {/* Floating Micro Badge */}
                <div className="absolute -bottom-3 -right-2 sm:-right-4 rounded-[10px] border border-[#E6EAF0] bg-white p-2.5 shadow-card flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-[#FEF7E6] flex items-center justify-center text-[#C98219]">
                    <Check className="h-4 w-4 text-[#C98219]" />
                  </div>
                  <div>
                    <p className="text-[11.5px] font-bold text-[#171717]">Guided Experience</p>
                    <p className="text-[10px] text-[#737373]">Clear step-by-step updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION C — SERVICES */}
      {/* ========================================================= */}
      <section id="services" className="py-16 sm:py-24 bg-[#FAFAFA] border-b border-[#E6EAF0]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-12 sm:mb-16">
            <span className="text-[11.5px] font-extrabold tracking-wider uppercase text-[#C98219]">
              EXPLORE OUR PLATFORM
            </span>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[#171717] tracking-tight">
              Services Designed Around Your Needs
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#525252] leading-relaxed">
              Choose a service to get started. Each service provides its own focused experience, with
              clear steps to help you move forward.
            </p>
          </div>

          {/* Two Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* SERVICE CARD 1 — TicketAssist */}
            <div className="rounded-[14px] border border-[#E6EAF0] bg-white p-6 sm:p-8 shadow-subtle hover:border-[#E8D5B7] hover:shadow-card transition-all flex flex-col justify-between">
              <div className="space-y-5">
                {/* Top Label & Icon */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#FEF7E6] px-3 py-1 text-[11px] font-extrabold tracking-wider uppercase text-[#8F5A0D] border border-[#F9DE9B]">
                    BOOKING ASSISTANCE
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219]">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-[22px] sm:text-[24px] font-bold text-[#171717]">
                    TicketAssist
                  </h3>
                  <p className="mt-2 text-[14px] sm:text-[14.5px] text-[#525252] leading-relaxed">
                    Manage your booking journey through a guided experience. Check supported availability,
                    organize booking details and follow your booking status from one convenient interface.
                  </p>
                </div>

                {/* Feature Highlights */}
                <div className="pt-2">
                  <p className="text-[12px] font-bold text-[#171717] uppercase tracking-wider mb-2.5">
                    Service Highlights
                  </p>
                  <ul className="space-y-2 text-[13.5px] text-[#525252]">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#C98219] shrink-0 mt-0.5" />
                      <span>Guided booking workflow</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#C98219] shrink-0 mt-0.5" />
                      <span>Availability and booking status visibility</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#C98219] shrink-0 mt-0.5" />
                      <span>Organized booking details</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#C98219] shrink-0 mt-0.5" />
                      <span>Clear progress updates</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card Footer / CTA */}
              <div className="mt-8 pt-5 border-t border-[#F0F3F7]">
                <Link
                  href="/dashboard/ticket-assist"
                  className="w-full flex items-center justify-center gap-2 rounded-[7px] bg-[#C98219] py-3 px-4 text-[14px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle focus:outline-none focus:ring-2 focus:ring-[#C98219]"
                >
                  <span>Open TicketAssist</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* SERVICE CARD 2 — Instant Service */}
            <div className="rounded-[14px] border border-[#E6EAF0] bg-white p-6 sm:p-8 shadow-subtle hover:border-[#BFDBFE] hover:shadow-card transition-all flex flex-col justify-between">
              <div className="space-y-5">
                {/* Top Label & Icon */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-extrabold tracking-wider uppercase text-[#1E40AF] border border-[#BFDBFE]">
                    DIGITAL SERVICES
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#EFF6FF] text-[#1D4ED8]">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-[22px] sm:text-[24px] font-bold text-[#171717]">
                    Instant Service
                  </h3>
                  <p className="mt-2 text-[14px] sm:text-[14.5px] text-[#525252] leading-relaxed">
                    Access available digital services through a straightforward interface designed to make
                    service discovery and the next steps easier.
                  </p>
                </div>

                {/* Feature Highlights */}
                <div className="pt-2">
                  <p className="text-[12px] font-bold text-[#171717] uppercase tracking-wider mb-2.5">
                    Service Highlights
                  </p>
                  <ul className="space-y-2 text-[13.5px] text-[#525252]">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                      <span>Simple service discovery</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                      <span>Guided service access</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                      <span>Clear information and next steps</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                      <span>Convenient digital experience</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card Footer / CTA */}
              <div className="mt-8 pt-5 border-t border-[#F0F3F7]">
                <Link
                  href="/dashboard/instant-service"
                  className="w-full flex items-center justify-center gap-2 rounded-[7px] bg-[#171717] py-3 px-4 text-[14px] font-bold text-white hover:bg-[#262626] transition-colors shadow-subtle focus:outline-none focus:ring-2 focus:ring-[#171717]"
                >
                  <span>Explore Instant Service</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION D — HOW IT WORKS */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-[#E6EAF0]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          {/* Section Heading */}
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[#171717] tracking-tight">
              Getting Started Is Simple
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#525252] leading-relaxed">
              Start with the service you need and follow a clear path from beginning to completion.
            </p>
          </div>

          {/* Three Steps Grid with Connecting Line on Desktop */}
          <div className="relative max-w-4xl mx-auto">
            {/* Desktop Horizontal Connecting Line */}
            <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[2px] bg-[#E6EAF0] -z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {/* Step 01 */}
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white border-2 border-[#C98219] text-[#C98219] font-extrabold text-[16px] shadow-subtle">
                  01
                </div>
                <h3 className="text-[17px] font-bold text-[#171717]">
                  Choose a Service
                </h3>
                <p className="text-[13.5px] text-[#525252] leading-relaxed max-w-xs mx-auto">
                  Explore the available services and select the one that matches your needs.
                </p>
              </div>

              {/* Step 02 */}
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white border-2 border-[#C98219] text-[#C98219] font-extrabold text-[16px] shadow-subtle">
                  02
                </div>
                <h3 className="text-[17px] font-bold text-[#171717]">
                  Follow the Guided Steps
                </h3>
                <p className="text-[13.5px] text-[#525252] leading-relaxed max-w-xs mx-auto">
                  Enter the required details and follow the instructions provided for your selected service.
                </p>
              </div>

              {/* Step 03 */}
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white border-2 border-[#C98219] text-[#C98219] font-extrabold text-[16px] shadow-subtle">
                  03
                </div>
                <h3 className="text-[17px] font-bold text-[#171717]">
                  Track Your Progress
                </h3>
                <p className="text-[13.5px] text-[#525252] leading-relaxed max-w-xs mx-auto">
                  Review available status updates and follow the next steps shown in your service interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION E — WHY SEVA TN */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-24 bg-[#FAFAFA] border-b border-[#E6EAF0]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[#171717] tracking-tight">
              A More Organized Way to Access Services
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#525252] leading-relaxed">
              SevaTN brings service discovery and guided digital experiences together in one accessible platform.
            </p>
          </div>

          {/* 4 Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Benefit 1 */}
            <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-3 hover:border-[#D0D5DD] transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219]">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#171717]">
                One Convenient Platform
              </h3>
              <p className="text-[13px] text-[#525252] leading-relaxed">
                Find supported services without navigating an unnecessarily complicated interface.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-3 hover:border-[#D0D5DD] transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219]">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#171717]">
                Clear User Experience
              </h3>
              <p className="text-[13px] text-[#525252] leading-relaxed">
                Understand the steps involved and see the information relevant to your selected service.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-3 hover:border-[#D0D5DD] transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219]">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#171717]">
                Progress Visibility
              </h3>
              <p className="text-[13px] text-[#525252] leading-relaxed">
                Review the status and updates provided by the service you are using.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-3 hover:border-[#D0D5DD] transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219]">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#171717]">
                Built for Everyday Access
              </h3>
              <p className="text-[13px] text-[#525252] leading-relaxed">
                Use a responsive experience designed for mobile phones, tablets and desktop computers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION F — CALL TO ACTION */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#E6EAF0]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-[16px] border border-[#E8D5B7] bg-[#FDF7ED]/70 p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-4">
            <h2 className="text-[28px] sm:text-[34px] font-extrabold text-[#171717] tracking-tight">
              Ready to Get Started?
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#525252] max-w-xl mx-auto leading-relaxed">
              Choose a service and take your next step with SevaTN.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3.5">
              <a
                href="#services"
                onClick={(e) => scrollToSection(e, 'services')}
                className="inline-flex items-center gap-2 rounded-[7px] bg-[#C98219] px-6 py-3 text-[14px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle focus:outline-none focus:ring-2 focus:ring-[#C98219]"
              >
                <span>Explore Services</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-[7px] border border-[#D0D5DD] bg-white px-6 py-3 text-[14px] font-semibold text-[#171717] hover:bg-[#F8FAFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C98219]"
              >
                <span>Contact Support</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION G — FOOTER */}
      {/* ========================================================= */}
      <PublicFooter />
    </div>
  );
}
