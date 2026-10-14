import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: {
    default: 'ServiceTN — Your Services, One Simple Platform',
    template: '%s | ServiceTN',
  },
  description:
    'Explore digital services with ServiceTN. Access booking assistance and convenient digital service experiences through one simple platform.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'ServiceTN — Your Services, One Simple Platform',
    description:
      'Explore digital services with ServiceTN. Access booking assistance and convenient digital service experiences through one simple platform.',
    type: 'website',
    siteName: 'ServiceTN — Powered by NIJA',
    images: [
      {
        url: '/logo.png',
        width: 866,
        height: 288,
        alt: 'ServiceTN — Powered by NIJA',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F7F9FC] text-[#172033] font-sans selection:bg-[#C98219]/20 selection:text-[#7A4A12]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
