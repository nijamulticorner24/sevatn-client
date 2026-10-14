'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Send,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  Sparkles,
  ExternalLink,
  MessageSquare,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

interface ContactFormData {
  fullName: string;
  email: string;
  serviceCategory: string;
  referenceNumber: string;
  message: string;
  botTrap: string; // Honeypot field for spam prevention
}

const INITIAL_FORM: ContactFormData = {
  fullName: '',
  email: '',
  serviceCategory: 'TicketAssist',
  referenceNumber: '',
  message: '',
  botTrap: '',
};

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<ContactFormData | null>(null);
  const [showReferenceField, setShowReferenceField] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!formData.serviceCategory) {
      newErrors.serviceCategory = 'Please select a topic.';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please enter your message.';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Spam honeypot trap
    if (formData.botTrap) {
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsSubmitting(false);
    setSubmittedData({ ...formData });
  };

  return (
    <div className="min-h-screen bg-white text-[#171717] flex flex-col font-sans selection:bg-[#C98219]/15 selection:text-[#7A4A12]">
      <PublicHeader />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* HERO SECTION — Clean, Warm, and Consistent with Home */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden bg-white border-b border-[#E6EAF0] pt-12 pb-14 sm:pt-16 sm:pb-20">
          {/* Subtle Background Pattern matching Home Page */}
          <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(#E5E7EB_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3.5 py-1 text-[11.5px] font-extrabold tracking-wider uppercase text-[#8F5A0D]">
                <span className="flex h-2 w-2 rounded-full bg-[#C98219]" />
                <span>SUPPORT DESK • SEVA TN</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-[32px] sm:text-[42px] lg:text-[48px] font-extrabold text-[#171717] tracking-tight leading-[1.15]">
                We're Here to Help. <br />
                <span className="text-[#C98219]">Get in Touch.</span>
              </h1>

              {/* Description */}
              <p className="text-[15px] sm:text-[17px] text-[#525252] leading-relaxed">
                Have questions about TicketAssist, Instant Service, partner onboarding, or your account? 
                Send us a message and our team will get back to you promptly.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* MAIN CONTENT SECTION */}
        {/* ========================================================= */}
        <section className="py-12 sm:py-16 bg-[#FAFAFA]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* ===================================================== */}
              {/* LEFT COLUMN: Simplified Contact Form (7 cols) */}
              {/* ===================================================== */}
              <div className="lg:col-span-7">
                {submittedData ? (
                  /* Success Confirmation State */
                  <div className="rounded-[14px] border border-[#E8D5B7] bg-[#FDF7ED] p-7 sm:p-9 space-y-6 shadow-subtle animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C98219] text-white shrink-0 shadow-subtle">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-[20px] font-bold text-[#171717]">
                          Inquiry Submitted Successfully
                        </h2>
                        <p className="text-[14px] text-[#525252] mt-1 leading-relaxed">
                          Thank you, <strong className="text-[#171717]">{submittedData.fullName}</strong>. 
                          Your message has been received. Our support team will review your inquiry and follow up promptly.
                        </p>
                      </div>
                    </div>

                    {/* Inquiry Details Summary Box */}
                    <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-5 space-y-2.5 text-[13px]">
                      <div className="flex justify-between items-center py-1 border-b border-[#F0F3F7]">
                        <span className="text-[#737373]">Topic / Service:</span>
                        <span className="font-semibold text-[#171717]">{submittedData.serviceCategory}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#F0F3F7]">
                        <span className="text-[#737373]">From:</span>
                        <span className="font-semibold text-[#171717]">{submittedData.email}</span>
                      </div>
                      {submittedData.referenceNumber && (
                        <div className="flex justify-between items-center py-1 border-b border-[#F0F3F7]">
                          <span className="text-[#737373]">Reference ID:</span>
                          <span className="font-mono font-semibold text-[#171717]">{submittedData.referenceNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#737373]">Status:</span>
                        <span className="font-semibold text-[#198754]">Received</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittedData(null);
                          setFormData(INITIAL_FORM);
                          setShowReferenceField(false);
                        }}
                        className="inline-flex items-center justify-center rounded-[7px] bg-[#C98219] px-6 py-3 text-[14px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle"
                      >
                        Send Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Clean, Streamlined Contact Form */
                  <div className="rounded-[14px] border border-[#E6EAF0] bg-white p-6 sm:p-8 shadow-subtle">
                    <div className="border-b border-[#F0F3F7] pb-5 mb-6">
                      <h2 className="text-[20px] font-bold text-[#171717]">
                        Send a Message
                      </h2>
                      <p className="text-[13.5px] text-[#737373] mt-1">
                        Fill out the quick form below and our team will be in touch.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                      {/* Honeypot Spam Guard */}
                      <div className="hidden" aria-hidden="true">
                        <label htmlFor="botTrap">Leave empty</label>
                        <input
                          type="text"
                          id="botTrap"
                          name="botTrap"
                          value={formData.botTrap}
                          onChange={(e) => setFormData({ ...formData, botTrap: e.target.value })}
                          tabIndex={-1}
                          autoComplete="off"
                        />
                      </div>

                      {/* Name & Email in 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="fullName"
                            className="block text-[13px] font-bold text-[#171717] mb-1.5"
                          >
                            Full Name <span className="text-[#C98219]">*</span>
                          </label>
                          <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={(e) => {
                              setFormData({ ...formData, fullName: e.target.value });
                              if (errors.fullName) setErrors({ ...errors, fullName: '' });
                            }}
                            placeholder="e.g. Ramesh Kumar"
                            className={`w-full rounded-[7px] border px-3.5 py-2.5 text-[14px] text-[#171717] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#C98219] focus:border-[#C98219] transition-colors ${
                              errors.fullName ? 'border-[#C2413B] bg-[#FDECEC]' : 'border-[#D0D5DD] bg-white'
                            }`}
                          />
                          {errors.fullName && (
                            <p className="mt-1.5 text-[12px] text-[#C2413B] flex items-center gap-1 font-medium">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              <span>{errors.fullName}</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="email"
                            className="block text-[13px] font-bold text-[#171717] mb-1.5"
                          >
                            Email Address <span className="text-[#C98219]">*</span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => {
                              setFormData({ ...formData, email: e.target.value });
                              if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            placeholder="your.email@example.com"
                            className={`w-full rounded-[7px] border px-3.5 py-2.5 text-[14px] text-[#171717] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#C98219] focus:border-[#C98219] transition-colors ${
                              errors.email ? 'border-[#C2413B] bg-[#FDECEC]' : 'border-[#D0D5DD] bg-white'
                            }`}
                          />
                          {errors.email && (
                            <p className="mt-1.5 text-[12px] text-[#C2413B] flex items-center gap-1 font-medium">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              <span>{errors.email}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Topic Selection */}
                      <div>
                        <label
                          htmlFor="serviceCategory"
                          className="block text-[13px] font-bold text-[#171717] mb-1.5"
                        >
                          Topic / Service <span className="text-[#C98219]">*</span>
                        </label>
                        <select
                          id="serviceCategory"
                          name="serviceCategory"
                          value={formData.serviceCategory}
                          onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-[14px] text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#C98219] focus:border-[#C98219] transition-colors"
                        >
                          <option value="TicketAssist">TicketAssist (Booking & Queue Inquiries)</option>
                          <option value="Instant Service">Instant Service (Digital Service Requests)</option>
                          <option value="Partner & Centre">Partner Franchise & Centre Onboarding</option>
                          <option value="Account & Login">Account, Password & Login Support</option>
                          <option value="Billing & Refund">Wallet, Transactions & Refund Requests</option>
                          <option value="General Inquiry">General Inquiry</option>
                        </select>
                      </div>

                      {/* Optional Reference ID Toggle / Input */}
                      <div>
                        {!showReferenceField ? (
                          <button
                            type="button"
                            onClick={() => setShowReferenceField(true)}
                            className="text-[12.5px] font-semibold text-[#C98219] hover:text-[#B57414] hover:underline inline-flex items-center gap-1"
                          >
                            <span>+ Have a Booking or Transaction Reference ID?</span>
                          </button>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label
                                htmlFor="referenceNumber"
                                className="block text-[13px] font-bold text-[#171717]"
                              >
                                Reference / Booking ID <span className="text-[#737373] font-normal">(Optional)</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowReferenceField(false);
                                  setFormData({ ...formData, referenceNumber: '' });
                                }}
                                className="text-[11.5px] text-[#737373] hover:text-[#171717]"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              type="text"
                              id="referenceNumber"
                              name="referenceNumber"
                              value={formData.referenceNumber}
                              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                              placeholder="e.g. BK-2026-X891 or Payment Ref"
                              className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-[14px] text-[#171717] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#C98219] focus:border-[#C98219] font-mono transition-colors"
                            />
                          </div>
                        )}
                      </div>

                      {/* Message Field */}
                      <div>
                        <label
                          htmlFor="message"
                          className="block text-[13px] font-bold text-[#171717] mb-1.5"
                        >
                          Your Message <span className="text-[#C98219]">*</span>
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={4}
                          value={formData.message}
                          onChange={(e) => {
                            setFormData({ ...formData, message: e.target.value });
                            if (errors.message) setErrors({ ...errors, message: '' });
                          }}
                          placeholder="How can we assist you? Describe your question or issue in detail..."
                          className={`w-full rounded-[7px] border px-3.5 py-2.5 text-[14px] text-[#171717] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#C98219] focus:border-[#C98219] transition-colors ${
                            errors.message ? 'border-[#C2413B] bg-[#FDECEC]' : 'border-[#D0D5DD] bg-white'
                          }`}
                        />
                        {errors.message && (
                          <p className="mt-1.5 text-[12px] text-[#C2413B] flex items-center gap-1 font-medium">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{errors.message}</span>
                          </p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-[7px] bg-[#C98219] px-6 py-3.5 text-[14px] font-bold text-white hover:bg-[#B57414] transition-colors shadow-subtle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C98219] disabled:opacity-60 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <span>Preparing Request...</span>
                          ) : (
                            <>
                              <span>Send Message</span>
                              <Send className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Trust Assurance */}
                      <p className="text-[12px] text-[#737373] text-center pt-2 leading-relaxed">
                        Inquiries are handled directly by official SevaTN support operators.
                      </p>
                    </form>
                  </div>
                )}
              </div>

              {/* ===================================================== */}
              {/* RIGHT COLUMN: Clean Support Cards (5 cols) */}
              {/* ===================================================== */}
              <div className="lg:col-span-5 space-y-6">
                {/* Official Support Channel Card */}
                <div className="rounded-[14px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle hover:border-[#E8D5B7] transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219]">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#171717]">
                        Online Support Desk
                      </h3>
                      <p className="text-[12px] text-[#737373]">Web portal inquiry service</p>
                    </div>
                  </div>

                  <p className="text-[13px] text-[#525252] leading-relaxed">
                    Submit your questions or assistance requests through the form on this page. Our team reviews all submissions promptly during active operating hours.
                  </p>
                </div>

                {/* Operating Hours & Speed */}
                <div className="rounded-[14px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219]">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#171717]">
                        Operating Hours
                      </h3>
                      <p className="text-[12px] text-[#737373]">Dedicated support schedule</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-[13px]">
                    <div className="flex items-center justify-between text-[#525252] py-1 border-b border-[#F0F3F7]">
                      <span>Monday – Saturday:</span>
                      <strong className="text-[#171717]">9:00 AM – 7:00 PM IST</strong>
                    </div>
                    <div className="flex items-center justify-between text-[#525252] py-1 border-b border-[#F0F3F7]">
                      <span>Sunday:</span>
                      <span className="text-[#737373]">Limited Coverage</span>
                    </div>
                    <div className="flex items-center justify-between text-[#525252] py-1">
                      <span>Average Response:</span>
                      <span className="font-semibold text-[#198754]">Within 24 Hours</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="rounded-[8px] bg-[#FEF7E6] border border-[#F9DE9B] p-3 flex items-start gap-2.5 text-[12px] text-[#8F5A0D]">
                      <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-[#C98219]" />
                      <span>
                        Official platform operated under <strong>YUKTRON</strong> • SevaTN — Powered by NIJA.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Helpful Quick Links */}
                <div className="rounded-[14px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-3">
                  <h4 className="text-[12px] font-bold text-[#171717] uppercase tracking-wider">
                    Quick Navigation
                  </h4>
                  <ul className="space-y-2 text-[13px]">
                    <li>
                      <Link
                        href="/#services"
                        className="text-[#525252] hover:text-[#C98219] transition-colors flex items-center justify-between group"
                      >
                        <span>Explore Our Services</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#98A2B3] group-hover:text-[#C98219] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/auth/login"
                        className="text-[#525252] hover:text-[#C98219] transition-colors flex items-center justify-between group"
                      >
                        <span>Sign In to Centre Portal</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#98A2B3] group-hover:text-[#C98219] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/terms-and-conditions"
                        className="text-[#525252] hover:text-[#C98219] transition-colors flex items-center justify-between group"
                      >
                        <span>Terms and Conditions</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#98A2B3] group-hover:text-[#C98219] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/refund-policy"
                        className="text-[#525252] hover:text-[#C98219] transition-colors flex items-center justify-between group"
                      >
                        <span>Refund & Cancellation Policy</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#98A2B3] group-hover:text-[#C98219] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
