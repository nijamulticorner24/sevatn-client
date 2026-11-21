'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export const MAX_SERVICE_RADIUS_KM = 5.0;

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function calculateDistanceKm(
  c1: { latitude: number; longitude: number },
  c2: { latitude: number; longitude: number }
): number {
  const R = 6371.0; // Earth radius in KM
  const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
  const dLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.latitude * Math.PI) / 180) *
      Math.cos((c2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function useLocationGuard() {
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<Coordinates | null>(null);
  const [registeredCoords, setRegisteredCoords] = useState<Coordinates | null>(null);

  const checkLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch user profile and registered centre location
      const profile = await api.getMe().catch(() => null);
      const user = profile?.user || api.getUser();

      // Super Admins, Distributors, and Partners are exempt from the 5 KM physical geofence
      if (user?.role === 'SUPER_ADMIN' || user?.role === 'DISTRIBUTOR' || user?.role === 'PARTNER') {
        setIsWithinRadius(true);
        setDistanceKm(0);
        setLoading(false);
        return;
      }

      // Check registered centre location
      const targetLoc =
        profile?.registeredLocation ||
        profile?.centre?.registeredLocation ||
        profile?.centre ||
        user?.registeredLocation;

      if (!targetLoc || !targetLoc.latitude || !targetLoc.longitude) {
        // If no centre coordinates configured yet, default to within radius
        setIsWithinRadius(true);
        setLoading(false);
        return;
      }

      const regCoords: Coordinates = {
        latitude: Number(targetLoc.latitude),
        longitude: Number(targetLoc.longitude),
      };
      setRegisteredCoords(regCoords);

      // 2. Query browser GPS location
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        setIsWithinRadius(false);
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: Coordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setCurrentCoords(coords);

          // Update client storage so subsequent API requests send these coordinates
          const sanitizedAcc = coords.accuracy ? Math.min(Number(coords.accuracy), 2500) : 100;
          api.setLocationCoordinates(coords.latitude, coords.longitude, sanitizedAcc);

          const distance = calculateDistanceKm(coords, regCoords);
          setDistanceKm(distance);

          if (distance <= MAX_SERVICE_RADIUS_KM) {
            setIsWithinRadius(true);
          } else {
            setIsWithinRadius(false);
          }
          setLoading(false);
        },
        (geoErr) => {
          console.warn('GPS capture error in useLocationGuard:', geoErr.message);
          setError(geoErr.message || 'Unable to retrieve GPS coordinates');

          // Fallback: check if we have recent stored coordinates
          const cached = api.getLocationCoordinates();
          if (cached && cached.latitude && cached.longitude) {
            const distance = calculateDistanceKm(cached, regCoords);
            setDistanceKm(distance);
            setIsWithinRadius(distance <= MAX_SERVICE_RADIUS_KM);
          } else {
            // Cannot verify centre presence without GPS
            setIsWithinRadius(false);
          }
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    } catch (err: any) {
      console.error('Error in useLocationGuard:', err);
      setError(err.message || 'Location verification error');
      setIsWithinRadius(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkLocation();
  }, [checkLocation]);

  return {
    isWithinRadius,
    distanceKm,
    loading,
    error,
    currentCoords,
    registeredCoords,
    refreshLocation: checkLocation,
  };
}

