import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types/message';
import { api } from '../lib/api';
import { socketService } from '../lib/socket';

export const useChat = (matchId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const data = await api.getMessages(matchId);
        setMessages(data);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Socket listeners
    const handleNewMessage = (message: Message) => {
      if (message.senderId === matchId || message.receiverId === matchId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTyping = (data: { userId: string; typing: boolean }) => {
      if (data.userId === matchId) {
        setTyping(data.typing);
      }
    };

    const socket = socketService.getSocket();
    if (socket) {
      socket.on('new_message', handleNewMessage);
      socket.on('typing', handleTyping);
    }

    return () => {
      if (socket) {
        socket.off('new_message', handleNewMessage);
        socket.off('typing', handleTyping);
      }
    };
  }, [matchId]);

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        const message = await api.sendMessage(matchId, content);
        setMessages((prev) => [...prev, message]);
        
        // Emit via socket
        socketService.emit('send_message', message);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [matchId]
  );

  const startTyping = useCallback(() => {
    socketService.emit('typing', { matchId, typing: true });
  }, [matchId]);

  const stopTyping = useCallback(() => {
    socketService.emit('typing', { matchId, typing: false });
  }, [matchId]);

  return {
    messages,
    loading,
    typing,
    sendMessage,
    startTyping,
    stopTyping,
  };
};
