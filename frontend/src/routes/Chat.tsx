import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Paperclip, Send, AlertCircle, Plus, Phone, Video, MoreHorizontal, ArrowLeft, Users, MessageCircle } from 'lucide-react';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { ChatBubble } from '../components/ChatBubble';
import { TypingIndicator } from '../components/TypingIndicator';
import { useAuth } from '../hooks/useAuth';
import { useSocket, SocketMessage } from '../hooks/useSocket';
import { sanitizeText } from '../lib/sanitize';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';
import type { Message } from '../types/message';

const mapSocketMessage = (message: SocketMessage): Message => ({
  id: message._id,
  senderId: message.senderId,
  receiverId: message.matchId,
  content: message.content,
  timestamp: new Date(message.createdAt),
  read: Boolean(message.readAt),
});

const getActiveConversation = (matchId: string | undefined, connected: boolean) => {
  if (!matchId) {
    return {
      id: 'alivv-fallback',
      name: 'Belum ada chat',
      status: 'Mulai cari teman dulu',
      description: 'Daftar chat kamu masih kosong. Cari koneksi baru buat mulai vibe Alivv.',
      avatar: '/logo/logo_alivv.png',
    };
  }

  return {
    id: matchId,
    name: `Room ${matchId.substring(0, 6)}...`,
    status: connected ? 'Connected' : 'Waiting',
    description: connected ? 'Percakapan sedang aktif' : 'Nunggu koneksi partner',
    avatar: '/logo/logo_alivv.png',
  };
};

export const Chat = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();

  const { messages, typing, online, connected, sendMessage, sendTyping, error } = useSocket(
    matchId || null
  );

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formattedMessages = useMemo(() => messages.map(mapSocketMessage), [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    sendTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleSend = () => {
    const cleaned = sanitizeText(messageInput).trim();
    if (!cleaned) return;
    sendMessage(cleaned);
    setMessageInput('');
    sendTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    sendMessage(`Shared a file: ${file.name}`);
  };

  const noConnection = !matchId || !connected;
  const activeConversation = getActiveConversation(matchId ?? undefined, connected);
  const hasActiveChat = Boolean(matchId);

  return (
    <FullScreenLayout>
      <div className="flex flex-col h-full w-full">
        {/* Chat Header */}
        <div className="flex-shrink-0 bg-gradient-to-b from-[#0A0F1C]/95 to-transparent backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/discover')}
                className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Chat</h1>
                <p className="text-xs md:text-sm text-white/60">
                  {matchId ? `Active room: ${matchId.substring(0, 8)}...` : 'Select a conversation'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/discover')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
              style={{ boxShadow: `0 10px 30px ${theme.colors.primary.blue}40` }}
            >
              <Users size={16} />
              <span className="hidden md:inline">Find Friends</span>
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 md:mx-8 mt-2 flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-100"
            style={{ boxShadow: theme.shadows.lg }}
          >
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Main Chat Container */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 md:p-6 overflow-hidden">
          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="hidden md:block w-full md:max-w-[320px] rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 p-5"
          >
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#35F5FF] to-[#7F6CFF] shadow-lg">
                  <img src="/logo/logo_alivv.png" alt="Alivv" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/40">Conversations</p>
                  <p className="text-lg font-semibold text-white">Chat Hub</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {hasActiveChat ? (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-white/80">Active conversation</p>
                    <p className="text-xs text-white/50 mt-1">All notifications are synced automatically</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                      <MessageCircle size={24} className="text-white/50" />
                    </div>
                    <p className="text-sm text-white/70">No active chats</p>
                    <p className="text-xs text-white/50 mt-1">Start a new conversation</p>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => navigate('/discover')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
                style={{ boxShadow: `0 10px 30px ${theme.colors.primary.blue}40` }}
              >
                <Plus className="inline mr-2 h-4 w-4" />
                Find New Friends
              </button>
              
              {!hasActiveChat && (
                <div className="rounded-xl bg-gradient-to-br from-[#35F5FF]/10 via-[#7F6CFF]/10 to-[#FFEC3D]/10 p-4 border border-white/10">
                  <p className="text-sm font-semibold text-white">Need inspiration?</p>
                  <p className="text-xs text-white/60 mt-1">
                    Visit Discover to find creators, events, or start a conversation
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
          {/* Main Chat Area */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-1 flex flex-col rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 overflow-hidden"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={activeConversation?.avatar}
                    alt={activeConversation?.name}
                    className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/5 object-cover p-1"
                  />
                  {online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A0F1C]" />
                  )}
                </div>
                <div>
                  <p className="text-base md:text-lg font-semibold text-white">{activeConversation?.name}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <StatusPill active={connected} label={connected ? 'Connected' : 'Reconnect'} />
                    <StatusPill active={online} label={online ? 'Online' : 'Offline'} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IconButton icon={Phone} ariaLabel="Call" />
                <IconButton icon={Video} ariaLabel="Video call" />
                <IconButton icon={MoreHorizontal} ariaLabel="More options" />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {noConnection ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full flex-col items-center justify-center gap-4 text-center min-h-[400px]"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] rounded-3xl blur-2xl opacity-20" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl">
                      <MessageCircle size={40} className="text-white/70" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-white">No Active Room</p>
                    <p className="text-sm text-white/60 max-w-xs">
                      Select a chat or find new friends to start a conversation
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/discover')}
                    className="mt-4 px-6 py-3 rounded-full bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
                    style={{ boxShadow: `0 10px 30px ${theme.colors.primary.blue}40` }}
                  >
                    <Users className="inline mr-2 h-4 w-4" />
                    Find Friends
                  </button>
                </motion.div>
              ) : formattedMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center min-h-[400px]">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-2">
                    <MessageCircle size={24} className="text-white/50" />
                  </div>
                  <p className="text-white">No messages yet</p>
                  <p className="text-sm text-white/60">Send a message to start the conversation</p>
                </div>
              ) : (
                formattedMessages.map((message) => (
                  <ChatBubble key={message.id} message={message} isOwn={message.senderId === user?.id} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 md:px-6 py-4 border-t border-white/10 bg-white/[0.02]">
              {typing && !noConnection && <TypingIndicator />}
              <div className="flex items-end gap-3">
                <IconButton 
                  icon={Paperclip} 
                  ariaLabel="Attach file" 
                  onClick={() => fileInputRef.current?.click()} 
                />
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder={noConnection ? 'Select a chat to start messaging...' : 'Type a message...'}
                    className={`w-full min-h-[48px] max-h-[120px] resize-none rounded-xl bg-white/5 px-4 py-3 text-white placeholder:text-white/40 border border-white/10 focus:outline-none focus:border-[#35F5FF]/50 transition-all ${
                      noConnection ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    disabled={noConnection}
                    rows={1}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: noConnection ? 1 : 1.05 }}
                  whileTap={{ scale: noConnection ? 1 : 0.95 }}
                  onClick={handleSend}
                  disabled={noConnection || !messageInput.trim()}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  style={{ boxShadow: `0 10px 30px ${theme.colors.primary.blue}40` }}
                >
                  <Send size={20} />
                </motion.button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </FullScreenLayout>
  );
};

const StatusPill = ({ label, active }: { label: string; active: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
      active 
        ? 'bg-gradient-to-r from-green-500/20 to-green-500/10 text-green-400 border border-green-500/20' 
        : 'bg-white/5 text-white/40 border border-white/10'
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-400' : 'bg-white/20'}`} />
    {label}
  </span>
);

const IconButton = ({
  icon: Icon,
  ariaLabel,
  onClick,
}: {
  icon: typeof Paperclip;
  ariaLabel: string;
  onClick?: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 transition-all hover:border-white/20"
    aria-label={ariaLabel}
  >
    <Icon size={18} />
  </motion.button>
);
