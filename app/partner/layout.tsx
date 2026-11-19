'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { NotificationPermissionGuard } from '@/components/platform/NotificationPermissionGuard';
import { LocationPermissionGuard } from '@/components/platform/LocationPermissionGuard';

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // The onboarding route is public and must not be blocked by authentication
  const isOnboardRoute = pathname?.startsWith('/partner/onboard');

  useEffect(() => {
    if (isOnboardRoute) {
      setLoading(false);
      return;
    }

    const user = api.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.role !== 'PARTNER' && user.role !== 'SUPER_ADMIN') {
      const dest = user.role === 'DISTRIBUTOR' ? '/distributor' : '/dashboard';
      router.push(dest);
      return;
    }
    setLoading(false);
  }, [router, isOnboardRoute]);

  // Public partner onboarding page renders directly without authentication or notification guard
  if (isOnboardRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C98219] border-t-transparent" />
      </div>
    );
  }

  return (
    <NotificationPermissionGuard>
      <LocationPermissionGuard>
        {children}
      </LocationPermissionGuard>
    </NotificationPermissionGuard>
  );
}
