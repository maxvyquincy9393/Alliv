import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

// Disable WebSocket for now - backend not configured yet
const ENABLE_WEBSOCKET = false;

class SocketService {
  private socket: Socket | null = null;

  connect(userId: string) {
    // Skip connection if WebSocket disabled
    if (!ENABLE_WEBSOCKET) {
      console.log('WebSocket disabled - backend not configured');
      return null;
    }

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        query: { userId },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  emit(event: string, data: unknown) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();
