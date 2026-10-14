import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — SevaTN — Powered by NIJA',
  description:
    'Comprehensive Refund Policy for SevaTN centre registration fees, double-entry wallet deposits, TicketAssist booking transactions, and Instant Service requests.',
};

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
