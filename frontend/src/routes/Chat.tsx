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

const IconButton = ({ icon: Icon, ariaLabel, onClick, className = '' }: { icon: any, ariaLabel: string, onClick?: () => void, className?: string }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={`p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all ${className}`}
  >
    <Icon size={20} />
  </button>
);

const StatusPill = ({ active, label }: { active: boolean, label: string }) => (
  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
    active 
      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }`}>
    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-slate-500'}`} />
    {label}
  </div>
);

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
      <div className="flex flex-col h-full w-full pt-20 md:pt-0">
        {/* Chat Header - Mobile Only */}
        <div className="md:hidden flex-shrink-0 glass-panel border-x-0 border-t-0 rounded-none mb-4">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/discover')}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white">Chat</h1>
                <p className="text-xs text-slate-400">
                  {matchId ? `Active room: ${matchId.substring(0, 8)}...` : 'Select a conversation'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 md:mx-8 mt-2 flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-100 border border-red-500/20"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Main Chat Container */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-8 overflow-hidden h-[calc(100vh-80px)]">
          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="hidden md:flex flex-col w-full md:max-w-[320px] glass-panel p-6 h-full"
          >
            <div className="flex flex-col gap-6 h-full">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                  <img src="/logo/logo_alivv.png" alt="Alivv" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Conversations</p>
                  <p className="text-xl font-bold text-white">Chat Hub</p>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto">
                {hasActiveChat ? (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-sm font-medium text-white">Active conversation</p>
                    </div>
                    <p className="text-xs text-slate-400">All notifications are synced automatically</p>
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-700">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center">
                      <MessageCircle size={20} className="text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">No active chats</p>
                    <p className="text-xs text-slate-500 mt-1">Start a new conversation to see it here</p>
                  </div>
                )}
              </div>
              
              <div className="mt-auto space-y-4">
                <button
                  onClick={() => navigate('/discover')}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Find New Friends
                </button>
                
                {!hasActiveChat && (
                  <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4 border border-white/5">
                    <p className="text-sm font-semibold text-white mb-1">Need inspiration?</p>
                    <p className="text-xs text-slate-400">
                      Visit Discover to find creators, events, or start a conversation
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>

          {/* Main Chat Area */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-1 flex flex-col glass-panel overflow-hidden h-full"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={activeConversation?.avatar}
                    alt={activeConversation?.name}
                    className="h-12 w-12 rounded-xl bg-slate-800 object-cover p-0.5 border border-white/10"
                  />
                  {online && (
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0A0F1C]" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{activeConversation?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusPill active={connected} label={connected ? 'Connected' : 'Reconnect'} />
                    <StatusPill active={online} label={online ? 'Online' : 'Offline'} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <IconButton icon={Phone} ariaLabel="Call" />
                <IconButton icon={Video} ariaLabel="Video call" />
                <IconButton icon={MoreHorizontal} ariaLabel="More options" />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar">
              {noConnection ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full flex-col items-center justify-center gap-6 text-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-800/50 border border-white/10 backdrop-blur-xl">
                      <MessageCircle size={40} className="text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-xs mx-auto">
                    <p className="text-xl font-bold text-white">No Active Room</p>
                    <p className="text-sm text-slate-400">
                      Select a chat or find new friends to start a conversation
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/discover')}
                    className="btn-primary"
                  >
                    <Users className="inline mr-2 h-4 w-4" />
                    Find Friends
                  </button>
                </motion.div>
              ) : formattedMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5">
                    <MessageCircle size={24} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">No messages yet</p>
                    <p className="text-sm text-slate-500 mt-1">Send a message to start the conversation</p>
                  </div>
                </div>
              ) : (
                formattedMessages.map((message) => (
                  <ChatBubble key={message.id} message={message} isOwn={message.senderId === user?.id} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
              {typing && !noConnection && (
                <div className="mb-2 ml-2">
                  <TypingIndicator />
                </div>
              )}
              <div className="flex items-end gap-3">
                <IconButton 
                  icon={Paperclip} 
                  ariaLabel="Attach file" 
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-1"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900/80 transition-all resize-none min-h-[50px] max-h-[120px] custom-scrollbar"
                    rows={1}
                    disabled={noConnection}
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={!messageInput.trim() || noConnection}
                  className={`p-3 rounded-xl transition-all mb-1 ${
                    !messageInput.trim() || noConnection
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </FullScreenLayout>
  );
};
