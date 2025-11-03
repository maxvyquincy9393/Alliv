/**
 * useSocket Hook - Real-time WebSocket connection for chat
 * Handles Socket.IO connection, message sending, typing indicators, online status
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
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
  messages: Message[];
  typing: boolean;
  sendMessage: (content: string) => void;
  sendTyping: (isTyping: boolean) => void;
  markAsRead: (messageId: string) => void;
  error: string | null;
}

export const useSocket = (matchId: string | null): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const typingTimeoutRef = useRef<number | null>(null);

  // Connect to Socket.IO server
  useEffect(() => {
    if (!matchId) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    // Create Socket.IO connection
    const newSocket = io('http://localhost:8000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected:', newSocket.id);
      setConnected(true);
      setError(null);
      
      // Join match room
      newSocket.emit('join_match', { match_id: matchId });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setConnected(false);
      setOnline(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket.IO connection error:', err.message);
      setError(`Connection error: ${err.message}`);
      setConnected(false);
    });

    // Room events
    newSocket.on('joined_match', (data) => {
      console.log('✅ Joined match:', data.match_id);
    });

    // Message events
    newSocket.on('new_message', (data: Message) => {
      console.log('📨 New message received:', data);
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some(msg => msg._id === data._id)) {
          return prev;
        }
        return [...prev, data];
      });
    });

    // Typing events
    newSocket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data.user_id);
      setTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Auto-clear typing indicator after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    });

    newSocket.on('typing_stopped', () => {
      console.log('⌨️ User stopped typing');
      setTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    });

    // Online status events
    newSocket.on('user_online_status', (data) => {
      if (data.match_id === matchId) {
        console.log(`🟢 User ${data.user_id} is ${data.online ? 'online' : 'offline'}`);
        setOnline(data.online);
      }
    });

    newSocket.on('user_joined', (data) => {
      console.log('👤 User joined match:', data.user_id);
      setOnline(true);
    });

    // Read receipt events
    newSocket.on('message_read', (data) => {
      console.log('✅ Message read:', data.message_id);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.message_id
            ? { ...msg, readAt: data.read_at }
            : msg
        )
      );
    });

    // Error events
    newSocket.on('error', (data) => {
      console.error('❌ Socket.IO error:', data.message);
      setError(data.message);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting Socket.IO');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      newSocket.disconnect();
    };
  }, [matchId]);

  // Send message
  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !connected || !matchId) {
        setError('Not connected to chat');
        return;
      }

      if (!content.trim()) {
        return;
      }

      if (content.length > 1000) {
        setError('Message too long (max 1000 characters)');
        return;
      }

      console.log('📤 Sending message:', content);
      socket.emit('send_message', {
        match_id: matchId,
        content: content.trim()
      });
    },
    [socket, connected, matchId]
  );

  // Send typing indicator
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !connected || !matchId) {
        return;
      }

      socket.emit('typing', {
        match_id: matchId,
        is_typing: isTyping
      });
    },
    [socket, connected, matchId]
  );

  // Mark message as read
  const markAsRead = useCallback(
    (messageId: string) => {
      if (!socket || !connected || !matchId) {
        return;
      }

      socket.emit('read_message', {
        message_id: messageId,
        match_id: matchId
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
    error
  };
};
