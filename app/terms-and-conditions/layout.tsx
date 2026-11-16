import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — SevaTN — Powered by NIJA',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
