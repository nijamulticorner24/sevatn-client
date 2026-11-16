import type { Metadata } from 'next';
import { HomePageClient } from '@/components/public/HomePageClient';

export const metadata: Metadata = {
  title: 'ServiceTN — Your Services, One Simple Platform',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LandingPage() {
  return <HomePageClient />;
}
