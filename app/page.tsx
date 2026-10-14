import type { Metadata } from 'next';
import { HomePageClient } from '@/components/public/HomePageClient';

export const metadata: Metadata = {
  title: 'ServiceTN — Your Services, One Simple Platform',
  description:
    'Explore digital services with ServiceTN. Access booking assistance and convenient digital service experiences through one simple platform.',
  openGraph: {
    title: 'ServiceTN — Your Services, One Simple Platform',
    description:
      'Explore digital services with ServiceTN. Access booking assistance and convenient digital service experiences through one simple platform.',
    type: 'website',
    siteName: 'ServiceTN — Powered by NIJA',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ServiceTN — Your Services, One Simple Platform',
    description:
      'Explore digital services with ServiceTN. Access booking assistance and convenient digital service experiences through one simple platform.',
    images: ['/logo.png'],
  },
};

export default function LandingPage() {
  return <HomePageClient />;
}
