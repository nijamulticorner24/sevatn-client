import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    return null as any;
  }

  if (!socketInstance) {
    const token = localStorage.getItem('token') || '';
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000/live';

    socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: {
        token: token ? `Bearer ${token}` : undefined,
      },
      query: {
        token,
      },
    });

    socketInstance.on('connect', () => {
      console.log('🟢 [WebSocket Live] Connected to SevaTN realtime gateway:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔴 [WebSocket Live] Disconnected:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ [WebSocket Live] Connection error:', err.message);
    });
  }

  return socketInstance;
}

export function refreshSocketAuth() {
  if (socketInstance) {
    const token = localStorage.getItem('token') || '';
    socketInstance.auth = { token: token ? `Bearer ${token}` : undefined };
    if (socketInstance.connected) {
      socketInstance.disconnect().connect();
    } else {
      socketInstance.connect();
    }
  }
}
