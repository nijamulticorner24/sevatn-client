import type { Metadata } from 'next';
import { HomePageClient } from '@/components/public/HomePageClient';

export const metadata: Metadata = {
  title: 'SevaTN — Your Services, One Simple Platform',
  description:
    'Explore digital services with SevaTN. Access booking assistance and convenient digital service experiences through one simple platform.',
  openGraph: {
    title: 'SevaTN — Your Services, One Simple Platform',
    description:
      'Explore digital services with SevaTN. Access booking assistance and convenient digital service experiences through one simple platform.',
    type: 'website',
    siteName: 'SevaTN — Powered by NIJA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SevaTN — Your Services, One Simple Platform',
    description:
      'Explore digital services with SevaTN. Access booking assistance and convenient digital service experiences through one simple platform.',
  },
};

export default function LandingPage() {
  return <HomePageClient />;
}
