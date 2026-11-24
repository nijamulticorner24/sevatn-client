'use client';

import React from 'react';
import NewBookingPage from '@/app/dashboard/bookings/new/page';
import { NotificationPermissionGuard } from '@/components/platform/NotificationPermissionGuard';
import { LocationPermissionGuard } from '@/components/platform/LocationPermissionGuard';

export default function BookingsNewPage() {
  return (
    <NotificationPermissionGuard>
      <LocationPermissionGuard>
        <NewBookingPage />
      </LocationPermissionGuard>
    </NotificationPermissionGuard>
  );
}
