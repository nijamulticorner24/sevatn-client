'use client';

import { useEffect, useState, useRef } from 'react';
import { getSocket } from './socket';

export function useSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id || null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setSocketId(null);
    };

    if (socket.connected) {
      setIsConnected(true);
      setSocketId(socket.id || null);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { isConnected, socketId };
}

export function useLiveEvent<T = any>(
  eventName: string,
  callback: (data: T) => void,
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !eventName) return;

    const eventHandler = (data: T) => {
      if (savedCallback.current) {
        savedCallback.current(data);
      }
    };

    socket.on(eventName, eventHandler);

    return () => {
      socket.off(eventName, eventHandler);
    };
  }, [eventName]);
}
