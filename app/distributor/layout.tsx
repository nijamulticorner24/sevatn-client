'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { NotificationPermissionGuard } from '@/components/platform/NotificationPermissionGuard';
import { LocationPermissionGuard } from '@/components/platform/LocationPermissionGuard';

export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = api.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.role !== 'DISTRIBUTOR' && user.role !== 'SUPER_ADMIN') {
      const dest = user.role === 'PARTNER' ? '/partner' : '/dashboard';
      router.push(dest);
      return;
    }
    setLoading(false);
  }, [router]);

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
