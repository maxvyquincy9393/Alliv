import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface SocketMessage {
  _id: string;
  matchId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  online: boolean;
  messages: SocketMessage[];
  typing: boolean;
  sendMessage: (content: string) => void;
  sendTyping: (isTyping: boolean) => void;
  markAsRead: (messageId: string) => void;
  error: string | null;
}

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

type TimeoutHandle = ReturnType<typeof setTimeout> | null;

export const useSocket = (matchId: string | null): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<SocketMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typingTimeoutRef = useRef<TimeoutHandle>(null);

  useEffect(() => {
    setMessages([]);
    setOnline(false);
    setTyping(false);

    if (!matchId) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.info('[socket] connected', newSocket.id);
      setConnected(true);
      setError(null);
      newSocket.emit('join_match', { match_id: matchId });
    });

    newSocket.on('disconnect', (reason) => {
      console.info('[socket] disconnected', reason);
      setConnected(false);
      setOnline(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[socket] connection error:', err.message);
      setError(`Connection error: ${err.message}`);
      setConnected(false);
    });

    newSocket.on('new_message', (data: SocketMessage) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg._id === data._id)) {
          return prev;
        }
        return [...prev, data];
      });
    });

    newSocket.on('user_typing', () => {
      setTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    });

    newSocket.on('typing_stopped', () => {
      setTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    });

    newSocket.on('user_online_status', (data) => {
      if (data.match_id === matchId) {
        setOnline(Boolean(data.online));
      }
    });

    newSocket.on('user_joined', (data) => {
      if (data.match_id === matchId) {
        setOnline(true);
      }
    });

    newSocket.on('message_read', (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.message_id ? { ...msg, readAt: data.read_at } : msg
        )
      );
    });

    newSocket.on('error', (data) => {
      setError(data.message || 'Unexpected Socket.IO error');
    });

    setSocket(newSocket);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      newSocket.disconnect();
    };
  }, [matchId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !connected || !matchId) {
        setError('Not connected to chat');
        return;
      }

      const trimmed = content.trim();
      if (!trimmed) {
        return;
      }

      if (trimmed.length > 1000) {
        setError('Message too long (max 1000 characters)');
        return;
      }

      socket.emit('send_message', {
        match_id: matchId,
        content: trimmed,
      });
    },
    [socket, connected, matchId]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !connected || !matchId) {
        return;
      }

      socket.emit('typing', {
        match_id: matchId,
        is_typing: isTyping,
      });
    },
    [socket, connected, matchId]
  );

  const markAsRead = useCallback(
    (messageId: string) => {
      if (!socket || !connected || !matchId) {
        return;
      }

      socket.emit('read_message', {
        message_id: messageId,
        match_id: matchId,
      });
    },
    [socket, connected, matchId]
  );

  return {
    socket,
    connected,
    online,
    messages,
    typing,
    sendMessage,
    sendTyping,
    markAsRead,
    error,
  };
};
