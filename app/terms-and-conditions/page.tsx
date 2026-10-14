'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  Clock,
  ShieldCheck,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function TermsAndConditionsPage() {
  const effectiveDate = 'January 1, 2026';
  const lastUpdated = 'October 11, 2026';

  const sections = [
    { id: 'section-1', number: '1', title: 'Introduction' },
    { id: 'section-2', number: '2', title: 'Definitions' },
    { id: 'section-3', number: '3', title: 'Eligibility and Authorized Registration' },
    { id: 'section-4', number: '4', title: 'Registration Fee and Activation (365 Days)' },
    { id: 'section-5', number: '5', title: 'Registered Location and Service Access (5 KM Policy)' },
    { id: 'section-6', number: '6', title: 'Account Security and Responsibilities' },
    { id: 'section-7', number: '7', title: 'TicketAssist Terms & Booking Assistance' },
    { id: 'section-8', number: '8', title: 'Instant Service Terms' },
    { id: 'section-9', number: '9', title: 'Wallets, Payments, and Transactions' },
    { id: 'section-10', number: '10', title: 'Third-Party Services and Availability' },
    { id: 'section-11', number: '11', title: 'Acceptable Use' },
    { id: 'section-12', number: '12', title: 'Privacy and Personal Information' },
    { id: 'section-13', number: '13', title: 'Intellectual Property' },
    { id: 'section-14', number: '14', title: 'Service Suspension and Termination' },
    { id: 'section-15', number: '15', title: 'Disclaimers and Limitation of Liability' },
    { id: 'section-16', number: '16', title: 'Changes to These Terms' },
    { id: 'section-17', number: '17', title: 'Governing Law and Disputes' },
    { id: 'section-18', number: '18', title: 'Contact and Support' },
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
              <span>LEGAL AGREEMENT • SEVA TN</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#171717] leading-tight">
              Terms & Conditions
            </h1>

            <p className="mt-3 text-[15px] sm:text-[16px] text-[#525252] leading-relaxed">
              These Terms & Conditions govern your access to and use of the SevaTN platform, TicketAssist booking assistance, Instant Service workflows, and related infrastructure operated by <strong>YUKTRON</strong>.
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

        {/* Content & Table of Contents Container */}
        <section className="py-10 sm:py-16 bg-[#FAFAFA]">
          <div className="mx-auto max-w-[960px] px-4 sm:px-6 lg:px-8">
            {/* Table of Contents Card */}
            <div className="rounded-[14px] border border-[#E6EAF0] bg-white p-6 sm:p-7 shadow-subtle mb-12">
              <h2 className="text-xs font-bold text-[#171717] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#FEF7E6] text-[#C98219] text-xs font-extrabold border border-[#F9DE9B]/60">
                  #
                </span>
                Table of Contents
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

            {/* Legal Body Sections */}
            <article className="space-y-12 text-[14.5px] sm:text-[15px] text-[#525252] leading-relaxed">
              {/* Section 1 */}
              <section id="section-1" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">1.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Introduction</h2>
                </div>
                <p>
                  Welcome to <strong>SevaTN — Powered by NIJA</strong> (&ldquo;SevaTN&rdquo;, &ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), a specialized operations, queue-monitoring, and assisted-services technological infrastructure operated by <strong>YUKTRON</strong>.
                </p>
                <p>
                  By accessing or registering for an account on SevaTN, including applying as an authorized franchise partner, operating an accredited centre, utilizing TicketAssist automated assistance, or submitting queries through Instant Service, you agree to be legally bound by these Terms & Conditions (&ldquo;Terms&rdquo;).
                </p>
                <p>
                  If you are entering into these Terms on behalf of a business, common service centre (CSC), eSevai centre, or internet café, you represent and warrant that you possess full authority to bind that entity to these Terms. If you do not agree to these Terms in their entirety, you must not access or use the Platform.
                </p>
              </section>

              {/* Section 2 */}
              <section id="section-2" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">2.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Definitions</h2>
                </div>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>&ldquo;SevaTN Platform&rdquo;</strong> refers to the digital portals, worker PC orchestration services, APIs, and management software developed and operated by YUKTRON.
                  </li>
                  <li>
                    <strong>&ldquo;Centre Operator&rdquo;</strong> refers to an individual, proprietor, or enterprise that manages an accredited local computer centre or eSevai kiosk with an active SevaTN account.
                  </li>
                  <li>
                    <strong>&ldquo;Franchise Partner&rdquo;</strong> refers to an authorized district or regional network administrator designated to onboard, monitor, and coordinate affiliated Centre Operators.
                  </li>
                  <li>
                    <strong>&ldquo;TicketAssist&rdquo;</strong> refers to the automated and human-assisted queue monitoring and slot reservation assistance module designed for official pilgrimage Virtual-Q portals.
                  </li>
                  <li>
                    <strong>&ldquo;Instant Service&rdquo;</strong> refers to the assisted submission and query processing module for Tamil Nadu e-governance and public citizen services.
                  </li>
                  <li>
                    <strong>&ldquo;Devotee / Citizen&rdquo;</strong> refers to the ultimate end-user pilgrim or applicant seeking booking or service assistance through a Centre Operator.
                  </li>
                  <li>
                    <strong>&ldquo;Centre Wallet&rdquo;</strong> refers to the double-entry prepaid credit balance maintained by a Centre Operator on the Platform to pay for verified service transactions.
                  </li>
                </ul>
              </section>

              {/* Section 3 */}
              <section id="section-3" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">3.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Eligibility and Authorized Registration</h2>
                </div>
                <p>
                  SevaTN is intended exclusively for legitimate commercial, eSevai, and computer service operations. To be eligible for an account:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>You must be at least 18 years of age and legally competent to enter into contracts under Indian law.</li>
                  <li>You must operate an identifiable, physical service establishment located within the state of Tamil Nadu.</li>
                  <li>You must register through a valid, authenticated invitation token issued by an authorized Franchise Partner or platform administrator.</li>
                  <li>All registration information provided, including centre name, operator name, email address, mobile number, district, and taluk, must be accurate, complete, and current.</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section id="section-4" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">4.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Registration Fee and Activation (365 Days)</h2>
                </div>
                <p>
                  Account activation requires the payment of the established Centre Onboarding Fee. The currently stated registration fee is <strong>₹500</strong>, subject to the specific fee amount displayed and confirmed during the checkout and onboarding workflow.
                </p>
                <div className="rounded-[10px] border border-[#F9DE9B] bg-[#FEF7E6] p-4 text-xs text-[#8F5A0D] space-y-1">
                  <p className="font-bold text-[#8F5A0D] flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#C98219]" />
                    365-Day Validity Period:
                  </p>
                  <p>
                    Upon successful payment verification and administrator review, the centre account is granted an operational activation period of <strong>365 days</strong> from the date of activation.
                  </p>
                </div>
                <p>
                  Registration fees cover account provisioning, cryptographic credential enrollment, infrastructure leasing, and dedicated cluster access. Refund eligibility for registration payments is strictly governed by our <Link href="/refund-policy" className="text-[#C98219] hover:text-[#B57414] underline font-semibold">Refund Policy</Link>.
                </p>
              </section>

              {/* Section 5 */}
              <section id="section-5" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">5.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Registered Location and Service Access (5 KM Policy)</h2>
                </div>
                <p>
                  To prevent fraudulent proxy operations, ensure geofenced integrity, and comply with regional administrative policies, Centre Operators must register their fixed physical kiosk coordinates (latitude and longitude) during account setup.
                </p>
                <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-4 text-xs text-[#525252] space-y-1">
                  <p className="font-bold text-[#171717] flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#C98219]" />
                    5 KM Radius Access Control:
                  </p>
                  <p>
                    Access to automated booking dispatch, slot claiming, and instant service execution is subject to location verification. The platform verifies that operational requests originate within an authorized <strong>5 kilometer radius</strong> of the centre&apos;s registered physical location, subject to the actual backend configuration.
                  </p>
                </div>
                <p>
                  Circumventing, spoofing, or manipulating GPS coordinates or network telemetry to bypass the 5 km access policy constitutes a material breach of these Terms and will result in immediate account suspension.
                </p>
              </section>

              {/* Section 6 */}
              <section id="section-6" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">6.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Account Security and Responsibilities</h2>
                </div>
                <p>
                  You are solely responsible for maintaining the confidentiality of your account credentials, login passwords, and any associated worker machine tokens. You must immediately notify YUKTRON via our <Link href="/contact" className="text-[#C98219] hover:text-[#B57414] font-semibold underline">Contact Support Portal</Link> if you suspect any unauthorized access or security breach.
                </p>
                <p>
                  All actions, transactions, and bookings conducted under your account credentials are presumed to be authorized by you, and you accept full liability for any losses resulting from compromised credentials.
                </p>
              </section>

              {/* Section 7 */}
              <section id="section-7" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">7.</span>
                  <h2 className="text-xl font-bold text-[#171717]">TicketAssist Terms & Booking Assistance</h2>
                </div>
                <p>
                  TicketAssist provides automated and human-assisted queue monitoring, slot check automation, and fast-fill assistance for official temple darshan virtual queues.
                </p>
                <div className="rounded-[10px] border border-[#FED7AA] bg-[#FFF7ED] p-4 text-xs text-[#9A3412] space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-[#EA580C]" />
                    Crucial Platform Clarifications:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong>No Booking Guarantees:</strong> SevaTN does not guarantee the availability of pilgrimage slots or the successful issuance of passes. Slot availability is solely determined and controlled by the relevant official authorities and temple boards.
                    </li>
                    <li>
                      <strong>No Government Affiliation:</strong> SevaTN and YUKTRON are independent private technology providers. We are not affiliated with, endorsed by, or an official agency of the Travancore Devaswom Board or any governmental department.
                    </li>
                    <li>
                      <strong>Anti-Circumvention Policy:</strong> TicketAssist never intercepts OTPs or bypasses security CAPTCHAs. All verification challenges require operator interaction.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 8 */}
              <section id="section-8" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">8.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Instant Service Terms</h2>
                </div>
                <p>
                  The Instant Service module facilitates assisted submission of public eSevai queries, verification requests, and citizen application filings.
                </p>
                <p>
                  Centre Operators warrant that all citizen information, certificates, identification documents, and application parameters submitted via Instant Service are obtained with the explicit informed consent of the respective citizen. Statutory government filing fees remitted directly to state portals are non-refundable once an application is acknowledged by the official portal.
                </p>
              </section>

              {/* Section 9 */}
              <section id="section-9" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">9.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Wallets, Payments, and Transactions</h2>
                </div>
                <p>
                  Platform transactions are processed using a secure double-entry Centre Wallet ledger. Centre Operators deposit funds in advance via approved online payment gateways or offline UPI transfers.
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong>Temporary Holding (Reservation):</strong> When a booking job is leased to a worker PC, the applicable service fee is temporarily reserved (held) from the Centre Wallet.
                  </li>
                  <li>
                    <strong>Fee Capture:</strong> Service fees are permanently debited and captured <em>only upon receipt of a verified official booking confirmation reference</em>.
                  </li>
                  <li>
                    <strong>Automatic Release:</strong> If a booking attempt fails, encounters slot exhaustion, or times out, the held funds are automatically and immediately released back to the centre&apos;s available balance.
                  </li>
                </ul>
                <p>
                  Refunds of unreserved available wallet balances are governed by our dedicated <Link href="/refund-policy" className="text-[#C98219] hover:text-[#B57414] underline font-semibold">Refund Policy</Link>.
                </p>
              </section>

              {/* Section 10 */}
              <section id="section-10" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">10.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Third-Party Services and Availability</h2>
                </div>
                <p>
                  The Platform interfaces with external third-party services, including government portals, pilgrimage booking engines, SMS gateways, and payment service providers.
                </p>
                <p>
                  YUKTRON is not liable for service interruptions, server downtime, slot quota changes, or API modifications caused by third-party platforms beyond our reasonable operational control.
                </p>
              </section>

              {/* Section 11 */}
              <section id="section-11" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">11.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Acceptable Use</h2>
                </div>
                <p>You agree not to:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Use the Platform for any unlawful, deceptive, or fraudulent purpose.</li>
                  <li>Resell, sublicense, or share your account credentials with unauthorized third parties.</li>
                  <li>Attempt to decompile, reverse-engineer, or disassemble any part of the SevaTN software.</li>
                  <li>Execute unauthorized penetration tests, vulnerability scans, or denial-of-service attacks.</li>
                  <li>Harass, abuse, or submit false claims to our support desk or franchise partners.</li>
                </ul>
              </section>

              {/* Section 12 */}
              <section id="section-12" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">12.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Privacy and Personal Information</h2>
                </div>
                <p>
                  YUKTRON collects and processes personal information necessary to manage accounts, process booking requests, verify locations, and maintain financial records. Devotee details (names, photo identification IDs) entered for booking passes are processed strictly for generating the requested pass and are not sold or exploited for third-party commercial marketing.
                </p>
              </section>

              {/* Section 13 */}
              <section id="section-13" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">13.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Intellectual Property</h2>
                </div>
                <p>
                  All proprietary software, algorithms, user interfaces, branding, logos, and documentation related to SevaTN and TicketAssist are the exclusive intellectual property of <strong>YUKTRON</strong> and its licensors. No title or ownership rights are transferred to Centre Operators under these Terms.
                </p>
              </section>

              {/* Section 14 */}
              <section id="section-14" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">14.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Service Suspension and Termination</h2>
                </div>
                <p>
                  YUKTRON reserves the right to suspend or terminate account access immediately, without prior notice, if:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You breach any provision of these Terms or the Acceptable Use policy.</li>
                  <li>Fraudulent, chargeback, or illegal transaction activity is detected.</li>
                  <li>Coordinates spoofing or geofencing circumvention is verified.</li>
                  <li>Your account remains inactive or un-renewed past the 365-day validity cycle.</li>
                </ul>
              </section>

              {/* Section 15 */}
              <section id="section-15" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">15.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Disclaimers and Limitation of Liability</h2>
                </div>
                <p>
                  Except as expressly provided herein, SevaTN is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. YUKTRON disclaims all implied warranties of merchantability, fitness for a particular purpose, and non-infringement to the fullest extent permitted by law.
                </p>
                <p>
                  To the maximum extent permitted by applicable Indian law, YUKTRON&apos;s total aggregate liability arising out of or related to these Terms or the Platform shall not exceed the service fees paid by you to YUKTRON during the preceding three (3) months. Nothing in these Terms shall limit liability for death, personal injury, fraud, or statutory consumer rights that cannot lawfully be waived.
                </p>
              </section>

              {/* Section 16 */}
              <section id="section-16" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">16.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Changes to These Terms</h2>
                </div>
                <p>
                  We may revise these Terms from time to time to reflect operational, technological, or legal developments. When revisions occur, we will update the &ldquo;Last Updated&rdquo; date at the top of this page. Continued use of the Platform after the effective date of updated Terms constitutes your binding acceptance.
                </p>
              </section>

              {/* Section 17 */}
              <section id="section-17" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">17.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Governing Law and Disputes</h2>
                </div>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal action, dispute, or proceeding arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts having jurisdiction in Tamil Nadu, India.
                </p>
              </section>

              {/* Section 18 */}
              <section id="section-18" className="scroll-mt-24 space-y-3.5">
                <div className="flex items-baseline gap-2.5 border-b border-[#E6EAF0] pb-2">
                  <span className="text-lg font-bold font-mono text-[#C98219]">18.</span>
                  <h2 className="text-xl font-bold text-[#171717]">Contact and Support</h2>
                </div>
                <p>
                  For legal inquiries, dispute notices, or support concerning these Terms, please contact:
                </p>
                <div className="rounded-[12px] border border-[#E6EAF0] bg-white p-6 space-y-2.5 text-[13px] shadow-subtle">
                  <p><strong>Platform:</strong> SevaTN — Powered by NIJA</p>
                  <p><strong>Operating Business:</strong> YUKTRON</p>
                  <p>
                    <strong>Online Support Desk:</strong>{' '}
                    <Link href="/contact" className="text-[#C98219] hover:text-[#B57414] underline font-semibold">
                      Visit Contact Support (/contact)
                    </Link>
                  </p>
                  <p>
                    <strong>Payment & Refund Rules:</strong>{' '}
                    <Link href="/refund-policy" className="text-[#C98219] hover:text-[#B57414] underline font-semibold">
                      Review Refund Policy (/refund-policy)
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
