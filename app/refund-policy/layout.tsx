import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — SevaTN — Powered by NIJA',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
