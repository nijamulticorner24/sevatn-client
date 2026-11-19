'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export type LocationGuardState =
  | 'CHECKING'
  | 'PROMPT'
  | 'REQUESTING'
  | 'GRANTED'
  | 'DENIED'
  | 'UNSUPPORTED';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface UseLocationPermissionReturn {
  permissionState: LocationGuardState;
  rawPermission: 'granted' | 'denied' | 'prompt' | 'unsupported';
  isSupported: boolean;
  coords: LocationCoordinates | null;
  errorMessage: string | null;
  requestPermission: () => Promise<boolean>;
  recheckPermission: () => void;
}

export function useLocationPermission(): UseLocationPermissionReturn {
  const [permissionState, setPermissionState] = useState<LocationGuardState>('CHECKING');
  const [rawPermission, setRawPermission] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [coords, setCoords] = useState<LocationCoordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isRequestingRef = useRef<boolean>(false);

  // Helper to obtain current position with promise
  const fetchPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation unsupported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      });
    });
  }, []);

  const evaluatePermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setIsSupported(false);
      setRawPermission('unsupported');
      setPermissionState('UNSUPPORTED');
      return;
    }

    // Try modern Permissions API first
    if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setRawPermission(status.state as any);

        if (status.state === 'granted') {
          // If already granted, fetch live position to ensure GPS hardware is active
          try {
            const pos = await fetchPosition();
            const c: LocationCoordinates = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            };
            setCoords(c);
            const sanitizedAcc = Math.min(pos.coords.accuracy || 100, 2500);
            api.setLocationCoordinates(c.latitude, c.longitude, sanitizedAcc);
            setPermissionState('GRANTED');
            setErrorMessage(null);
          } catch (posErr: any) {
            // Position unavailable (e.g. Windows location turned off in OS settings)
            if (posErr.code === 2) {
              setPermissionState('DENIED');
              setErrorMessage('Device location service is turned off. Please enable Location in Windows/OS Settings.');
            } else {
              // Still granted at browser permission level
              setPermissionState('GRANTED');
            }
          }
        } else if (status.state === 'denied') {
          setPermissionState('DENIED');
          setErrorMessage('Location access is blocked in your browser settings.');
        } else {
          setPermissionState('PROMPT');
          setErrorMessage(null);
        }

        // Listen for user changing permission in site settings
        status.onchange = () => {
          evaluatePermission();
        };
        return;
      } catch {
        // Fallback for browsers with restricted permissions query
      }
    }

    // Fallback: check if stored coordinates exist or prompt
    const cached = api.getLocationCoordinates();
    if (cached && cached.latitude && cached.longitude) {
      setCoords(cached);
      setRawPermission('granted');
      setPermissionState('GRANTED');
    } else {
      setPermissionState('PROMPT');
    }
  }, [fetchPosition]);

  const recheckPermission = useCallback(() => {
    if (isRequestingRef.current) return;
    evaluatePermission();
  }, [evaluatePermission]);

  useEffect(() => {
    evaluatePermission();

    const handleFocusOrVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      recheckPermission();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocusOrVisibility);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleFocusOrVisibility);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocusOrVisibility);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleFocusOrVisibility);
      }
    };
  }, [evaluatePermission, recheckPermission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setPermissionState('UNSUPPORTED');
      setRawPermission('unsupported');
      setIsSupported(false);
      return false;
    }

    isRequestingRef.current = true;
    setPermissionState('REQUESTING');

    try {
      const pos = await fetchPosition();
      const c: LocationCoordinates = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      setCoords(c);
      const sanitizedAcc = Math.min(pos.coords.accuracy || 100, 2500);
      api.setLocationCoordinates(c.latitude, c.longitude, sanitizedAcc);
      setRawPermission('granted');
      setPermissionState('GRANTED');
      setErrorMessage(null);
      isRequestingRef.current = false;
      return true;
    } catch (err: any) {
      isRequestingRef.current = false;
      console.warn('[useLocationPermission] Request failed:', err);

      if (err.code === 1) {
        // PERMISSION_DENIED
        setRawPermission('denied');
        setPermissionState('DENIED');
        setErrorMessage('Location access was denied in browser settings.');
      } else if (err.code === 2) {
        // POSITION_UNAVAILABLE
        setRawPermission('denied');
        setPermissionState('DENIED');
        setErrorMessage('Device location service is turned off. Please turn ON Location in Windows / Device Settings.');
      } else {
        // TIMEOUT or OTHER
        setRawPermission('prompt');
        setPermissionState('PROMPT');
        setErrorMessage(err.message || 'Location verification timed out. Please try again.');
      }
      return false;
    }
  }, [fetchPosition]);

  return {
    permissionState,
    rawPermission,
    isSupported,
    coords,
    errorMessage,
    requestPermission,
    recheckPermission,
  };
}
