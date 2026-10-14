'use client';

import React from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  Calendar,
  Clock,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function RefundPolicyPage() {
  const effectiveDate = 'January 1, 2026';
  const lastUpdated = 'October 11, 2026';

  const sections = [
    { id: 'section-1', number: '1', title: 'Introduction' },
    { id: 'section-2', number: '2', title: 'Registration Fee' },
    { id: 'section-3', number: '3', title: 'Wallet Deposits and Balances' },
    { id: 'section-4', number: '4', title: 'TicketAssist Booking Transactions' },
    { id: 'section-5', number: '5', title: 'Instant Service Payments' },
    { id: 'section-6', number: '6', title: 'Duplicate, Failed, or Incorrect Payments' },
    { id: 'section-7', number: '7', title: 'How to Request a Refund' },
    { id: 'section-8', number: '8', title: 'Refund Review and Processing' },
    { id: 'section-9', number: '9', title: 'Exceptions and Legal Rights' },
    { id: 'section-10', number: '10', title: 'Contact Information' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#171717] flex flex-col font-sans selection:bg-[#C98219]/15 selection:text-[#7A4A12]">
      <PublicHeader />

      <main className="flex-1">
        {/* Document Header */}
        <section className="relative overflow-hidden bg-white border-b border-[#E6EAF0] py-12 sm:py-16">
          <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(#E5E7EB_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="relative mx-auto max-w-[960px] px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3.5 py-1 text-[11.5px] font-extrabold tracking-wider uppercase text-[#8F5A0D] mb-4">
              <span className="flex h-2 w-2 rounded-full bg-[#C98219]" />
              <span>FINANCIAL GOVERNANCE • SEVA TN</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#171717] leading-tight">
              Refund Policy
            </h1>

            <p className="mt-3 text-[15px] sm:text-[16px] text-[#525252] leading-relaxed">
              SevaTN — Powered by NIJA aims to provide clear information about payments, cancellations, and refund requests. Refund eligibility depends on the type of payment, the transaction status, the applicable service terms, and relevant law.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#737373] border-t border-[#F0F3F7] pt-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#C98219]" />
                Effective Date: <strong className="text-[#171717]">{effectiveDate}</strong>
              </span>
              <span className="hidden sm:inline text-[#E6EAF0]">•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#C98219]" />
                Last Updated: <strong className="text-[#171717]">{lastUpdated}</strong>
              </span>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <section className="py-10 sm:py-16 bg-[#FAFAFA]">
          <div className="mx-auto max-w-[960px] px-4 sm:px-6 lg:px-8">
            {/* Table of Contents */}
            <div className="rounded-[14px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle mb-12">
              <h2 className="text-xs font-bold text-[#171717] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#FEF7E6] text-[#C98219] text-xs font-extrabold border border-[#F9DE9B]/60">
                  #
                </span>
                Policy Contents
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="flex items-center gap-2 py-1 text-[#525252] hover:text-[#C98219] hover:underline transition-colors"
                  >
                    <span className="font-mono text-[#9CA3AF] w-5 shrink-0">{sec.number}.</span>
                    <span className="truncate">{sec.title}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Policy Sections */}
            <article className="space-y-12 text-[14.5px] sm:text-[15px] text-[#525252] leading-relaxed">
              {/* 1. Introduction */}
              <section id="section-1" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">1.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Introduction</h2>
                </div>
                <p>
                  SevaTN — Powered by NIJA aims to provide clear information about payments, cancellations, and refund requests. Refund eligibility depends on the type of payment, the transaction status, the applicable service terms, and relevant law.
                </p>
                <p>
                  This policy outlines the financial rules, transaction distinctions, and review procedures applied to Centre Onboarding Fees, Centre Wallet deposits, TicketAssist booking fees, and Instant Service charges across the platform operated by <strong>YUKTRON</strong>.
                </p>
              </section>

              {/* 2. Registration Fee */}
              <section id="section-2" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">2.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Registration Fee</h2>
                </div>
                <p>
                  The currently stated centre registration fee is <strong>₹500</strong>, subject to the specific fee amount displayed and confirmed during the checkout and onboarding process.
                </p>
                <p>
                  Once an onboarding payment is confirmed, centre credentials generated, and the 365-day platform activation granted, the registration fee is non-refundable as it covers dedicated infrastructure provisioning, cryptographic certificate setup, and localized partner coordination.
                </p>
                <p>
                  Where a centre onboarding payment is successfully debited from the applicant&apos;s bank account but account activation fails entirely due to a technical error on our platform that our technical team cannot resolve within a reasonable period, or where a refund is expressly required by applicable consumer law, a full refund of the verified registration fee will be disbursed.
                </p>
              </section>

              {/* 3. Wallet Deposits and Balances */}
              <section id="section-3" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">3.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Wallet Deposits and Balances</h2>
                </div>
                <p>
                  To provide absolute financial safety and transparent double-entry accounting, SevaTN strictly distinguishes between the following transaction states:
                </p>

                {/* Status Comparison Table */}
                <div className="overflow-x-auto rounded-[10px] border border-[#E6EAF0] bg-white text-xs shadow-subtle">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#171717] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Transaction State</th>
                        <th className="py-2.5 px-3">Authoritative Ledger Meaning</th>
                        <th className="py-2.5 px-3">Refund / Balance Effect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EAF0]">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#15803D]">Successful Deposit</td>
                        <td className="py-2 px-3">Payment verified by payment gateway or confirmed UTR.</td>
                        <td className="py-2 px-3">Added to Available Balance.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#B45309]">Pending Deposit</td>
                        <td className="py-2 px-3">Awaiting bank or gateway settlement confirmation.</td>
                        <td className="py-2 px-3">Not available for use until cleared.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#DC2626]">Failed Deposit</td>
                        <td className="py-2 px-3">Payment declined, timed out, or rejected by bank.</td>
                        <td className="py-2 px-3">No wallet credit; funds handled by payer&apos;s bank.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#C98219]">Wallet Reservation (Hold)</td>
                        <td className="py-2 px-3">Funds temporarily reserved during an active slot attempt.</td>
                        <td className="py-2 px-3">Not a completed charge; held in escrow.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#525252]">Completed Deduction</td>
                        <td className="py-2 px-3">Service fee permanently captured upon verified booking reference.</td>
                        <td className="py-2 px-3">Completed service transaction.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#0891B2]">Released Reservation</td>
                        <td className="py-2 px-3">Booking attempt did not result in a confirmed pass.</td>
                        <td className="py-2 px-3">Immediately returned to Available Balance.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-[#7C3AED]">Approved Refund</td>
                        <td className="py-2 px-3">Administrator-approved balance withdrawal payout.</td>
                        <td className="py-2 px-3">Deducted from wallet and remitted to verified bank.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-[#737373]">
                  A pending or failed payment must not be treated as a successful deposit. A temporary booking reservation must never be treated as a completed charge without verifying the authoritative transaction record in the platform ledger.
                </p>
                <p>
                  Refunds of unreserved available wallet balances are subject to administrator review, anti-money-laundering verification, and applicable law. The platform does not promise automatic instant withdrawal or a fixed processing window without prior verification.
                </p>
              </section>

              {/* 4. TicketAssist Booking Transactions */}
              <section id="section-4" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">4.</span>
                  <h2 className="text-xl font-bold text-[#171717]">TicketAssist Booking Transactions</h2>
                </div>
                <p>
                  TicketAssist operates on an immutable performance-based accounting principle:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong>Confirmation-Contingent Charge:</strong> Service fees (e.g. ₹100 per pass) are permanently captured only when an official, verifiable booking confirmation reference is generated and stored in the system.
                  </li>
                  <li>
                    <strong>No Charge on Unsuccessful Attempts:</strong> If slot availability closes, a worker PC job times out, or the official portal rejects an entry, the held reservation is automatically released back to the centre&apos;s available wallet. No fee is deducted.
                  </li>
                  <li>
                    <strong>No Guarantee of Temple Slots:</strong> Availability of darshan slots is determined exclusively by the official temple board and authorities. SevaTN does not control or manufacture slot allocations. A refund is not granted merely because availability changed before an attempt could be completed.
                  </li>
                  <li>
                    <strong>Devotee Pass Cancellations:</strong> If a devotee chooses to cancel an officially confirmed darshan pass after issuance, cancellation rules and any pilgrim fee refunds are governed entirely by the official temple authority portal, not SevaTN.
                  </li>
                </ul>
              </section>

              {/* 5. Instant Service Payments */}
              <section id="section-5" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">5.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Instant Service Payments</h2>
                </div>
                <p>
                  Refund eligibility for Instant Service queries depends on the specific service terms, verified processing status, payment status, and applicable law:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong>Pending Requests:</strong> Requests that have not yet been accepted by an operator or dispatched to government endpoints may be cancelled for a full wallet credit.
                  </li>
                  <li>
                    <strong>Statutory Government Fees:</strong> Government application and eSevai statutory fees remitted directly to state portals cannot be refunded once an application has been lodged and acknowledged by the official portal.
                  </li>
                  <li>
                    <strong>Application Rejections:</strong> Where an application is rejected by the government authority due to citizen document deficiencies, incorrect identity proofs, or eligibility disqualifications, platform processing fees are non-refundable.
                  </li>
                </ul>
              </section>

              {/* 6. Duplicate, Failed, or Incorrect Payments */}
              <section id="section-6" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">6.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Duplicate, Failed, or Incorrect Payments</h2>
                </div>
                <p>You should contact our support desk promptly if you encounter any of the following:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>A payment was deducted from your bank or UPI app, but the wallet balance is not credited after 30 minutes.</li>
                  <li>A duplicate charge appears on your statement for a single top-up or transaction.</li>
                  <li>A transaction status shows conflicting states between your gateway receipt and platform ledger.</li>
                </ul>
                <div className="rounded-[10px] border border-[#FEE2E2] bg-[#FEF2F2] p-4 text-xs text-[#991B1B]">
                  <strong className="font-bold">Required Details for Investigation:</strong> Please provide the 12-digit UTR number, gateway transaction reference, date, amount, and centre code. <em>Never send passwords, OTPs, ATM PINs, or full payment-card numbers.</em>
                </div>
              </section>

              {/* 7. How to Request a Refund */}
              <section id="section-7" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">7.</span>
                  <h2 className="text-xl font-bold text-[#171717]">How to Request a Refund</h2>
                </div>
                <p>To submit a refund or transaction audit request, please follow this verified procedure:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Submit an inquiry through our{' '}
                    <Link href="/contact" className="text-[#C98219] hover:text-[#B57414] underline font-semibold">
                      Contact Support (/contact)
                    </Link>{' '}
                    portal.
                  </li>
                  <li>
                    Include your <strong>Centre Code</strong>, <strong>Transaction Reference</strong> (e.g. UTR number or Booking ID), and the specific service category.
                  </li>
                  <li>
                    Clearly explain the reason for the refund request and the observed payment or booking status.
                  </li>
                  <li>
                    Attach your bank debit receipt or payment confirmation screenshot after redacting unnecessary sensitive account numbers.
                  </li>
                  <li>
                    Allow our support desk to verify the authoritative transaction records against the double-entry database ledger.
                  </li>
                </ol>
              </section>

              {/* 8. Refund Review and Processing */}
              <section id="section-8" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">8.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Refund Review and Processing</h2>
                </div>
                <p>
                  Each refund request is audited against our database logs, worker execution telemetry, and payment gateway settlement reports.
                </p>
                <p>
                  Upon verification, the support desk will inform the applicant of the review outcome. Where a refund is approved, it will be credited either back to the operator&apos;s available Centre Wallet or disbursed to the original payment source in accordance with standard banking and payment-provider clearing cycles. We do not publish arbitrary fixed turnaround day guarantees, but review all submissions expeditiously upon receipt of complete details.
                </p>
              </section>

              {/* 9. Exceptions and Legal Rights */}
              <section id="section-9" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">9.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Exceptions and Legal Rights</h2>
                </div>
                <p>
                  All refund determinations remain subject to the verified transaction status, applicable service terms, payment gateway guidelines, and mandatory statutory rights under Indian consumer law.
                </p>
                <p>
                  Nothing contained in this Refund Policy shall be construed to waive, restrict, or exclude any statutory consumer protection right that cannot lawfully be disclaimed or limited under applicable law.
                </p>
              </section>

              {/* 10. Contact Information */}
              <section id="section-10" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">10.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Contact Information</h2>
                </div>
                <p>For questions or assistance regarding this Refund Policy, please contact:</p>
                <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-6 space-y-2.5 text-[13px] shadow-subtle">
                  <p><strong>Platform:</strong> SevaTN — Powered by NIJA</p>
                  <p><strong>Operating Business:</strong> YUKTRON</p>
                  <p>
                    <strong>Online Helpdesk:</strong>{' '}
                    <Link href="/contact" className="text-[#C98219] hover:text-[#B57414] underline font-semibold">
                      Contact Us (/contact)
                    </Link>
                  </p>
                  <p>
                    <strong>Terms of Service:</strong>{' '}
                    <Link href="/terms-and-conditions" className="text-[#C98219] hover:text-[#B57414] underline font-semibold">
                      Terms & Conditions (/terms-and-conditions)
                    </Link>
                  </p>
                </div>
              </section>
            </article>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
