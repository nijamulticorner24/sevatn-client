import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — SevaTN — Powered by NIJA',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
