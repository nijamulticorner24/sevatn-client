import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — SevaTN — Powered by NIJA',
  description:
    'Official Terms & Conditions governing access to SevaTN, TicketAssist darshan booking assistance, Instant Service, and centre infrastructure operated by YUKTRON.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
