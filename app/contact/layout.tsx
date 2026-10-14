import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — SevaTN — Powered by NIJA',
  description:
    'Need help with SevaTN, partner registration, TicketAssist, Instant Service, or payments? Contact the official YUKTRON support desk.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
