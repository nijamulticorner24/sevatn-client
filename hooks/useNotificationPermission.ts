'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type NotificationGuardState =
  | 'CHECKING'
  | 'DEFAULT'
  | 'REQUESTING'
  | 'GRANTED'
  | 'DENIED'
  | 'UNSUPPORTED';

export interface UseNotificationPermissionReturn {
  permissionState: NotificationGuardState;
  rawPermission: NotificationPermission | 'unsupported';
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission | 'unsupported'>;
  recheckPermission: () => void;
}

export function useNotificationPermission(): UseNotificationPermissionReturn {
  const [permissionState, setPermissionState] = useState<NotificationGuardState>('CHECKING');
  const [rawPermission, setRawPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const isRequestingRef = useRef<boolean>(false);

  const evaluatePermission = useCallback((): {
    state: NotificationGuardState;
    raw: NotificationPermission | 'unsupported';
    supported: boolean;
  } => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        state: 'UNSUPPORTED',
        raw: 'unsupported',
        supported: false,
      };
    }

    const current = window.Notification.permission;
    if (current === 'granted') {
      return { state: 'GRANTED', raw: 'granted', supported: true };
    }
    if (current === 'denied') {
      return { state: 'DENIED', raw: 'denied', supported: true };
    }
    return { state: 'DEFAULT', raw: 'default', supported: true };
  }, []);

  const recheckPermission = useCallback(() => {
    // Do not override if user is actively in the middle of clicking requestPermission
    if (isRequestingRef.current) return;

    const evalResult = evaluatePermission();
    setIsSupported(evalResult.supported);
    setRawPermission(evalResult.raw);
    setPermissionState(evalResult.state);
  }, [evaluatePermission]);

  useEffect(() => {
    // Initial evaluation on client mount
    recheckPermission();

    const handleFocusOrVisibility = () => {
      // When user returns to tab (e.g. after changing browser site settings), re-evaluate
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
  }, [recheckPermission]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission | 'unsupported'> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermissionState('UNSUPPORTED');
      setRawPermission('unsupported');
      setIsSupported(false);
      return 'unsupported';
    }

    // Set requesting state to display loader
    isRequestingRef.current = true;
    setPermissionState('REQUESTING');

    try {
      // Call standard browser Notification API
      const result = await window.Notification.requestPermission();
      setRawPermission(result);

      if (result === 'granted') {
        setPermissionState('GRANTED');
      } else if (result === 'denied') {
        setPermissionState('DENIED');
      } else {
        setPermissionState('DEFAULT');
      }
      return result;
    } catch (err) {
      console.error('[useNotificationPermission] requestPermission failed:', err);
      // Fallback check in case promise rejected or failed
      const fallback = window.Notification.permission;
      setRawPermission(fallback);
      if (fallback === 'granted') {
        setPermissionState('GRANTED');
      } else if (fallback === 'denied') {
        setPermissionState('DENIED');
      } else {
        setPermissionState('DEFAULT');
      }
      return fallback;
    } finally {
      isRequestingRef.current = false;
    }
  }, []);

  return {
    permissionState,
    rawPermission,
    isSupported,
    requestPermission,
    recheckPermission,
  };
}

