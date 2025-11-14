import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Paperclip, Send, AlertCircle, Plus } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ChatBubble } from '../components/ChatBubble';
import { TypingIndicator } from '../components/TypingIndicator';
import { useAuth } from '../hooks/useAuth';
import { useSocket, SocketMessage } from '../hooks/useSocket';
import type { Message } from '../types/message';

const mapSocketMessage = (message: SocketMessage): Message => ({
  id: message._id,
  senderId: message.senderId,
  receiverId: message.matchId,
  content: message.content,
  timestamp: new Date(message.createdAt),
  read: Boolean(message.readAt),
});

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
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
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

  return (
    <Layout>
      <div className="shell-content space-y-5 pb-12">
        <section className="panel space-y-3 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Chat</p>
              <h1 className="text-3xl font-semibold text-white">Stay close to your matches</h1>
              <p className="text-sm text-white/60">
                {matchId
                  ? `Room ${matchId} is live. Messages sync instantly dan tampil simpel.`
                  : 'Belum ada chat. Mulai dengan cari teman dulu.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/discover')}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Cari teman
            </button>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-white/80">
            <StatusBadge label="Connection" active={connected} />
            <StatusBadge label="Partner online" active={online} />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </section>

        <section className="panel flex h-[60vh] flex-col p-0">
          <div className="flex-1 overflow-y-auto bg-black/20 px-5 py-5">
            {noConnection ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-white/60">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5">
                  <img src="/logo/alivvlogo.png" alt="Alivv logo" className="h-10 w-10 object-contain" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg text-white">Belum ada chat</p>
                  <p className="text-sm">Tap tombol cari teman buat mulai ngobrol.</p>
                </div>
                <button
                  onClick={() => navigate('/discover')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                  Cari teman
                </button>
              </div>
            ) : formattedMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-white/60">
                <p className="text-white">Belum ada pesan</p>
                <p className="text-sm">Kirim sapaan singkat biar percakapan jalan.</p>
              </div>
            ) : (
              formattedMessages.map((message) => (
                <ChatBubble key={message.id} message={message} isOwn={message.senderId === user?.id} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="space-y-3 border-t border-white/5 px-5 py-4">
            {typing && !noConnection && <TypingIndicator />}
            <div className="flex items-start gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/70 hover:text-white"
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                value={messageInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder={noConnection ? 'Cari teman dulu buat mulai chatting...' : 'Tulis pesan...'}
                className={`flex-1 min-h-[44px] max-h-36 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none ${
                  noConnection ? 'cursor-not-allowed opacity-60' : ''
                }`}
                disabled={noConnection}
              />
              <button
                onClick={handleSend}
                disabled={noConnection}
                className="h-11 rounded-2xl bg-white px-4 text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

const StatusBadge = ({ label, active }: { label: string; active: boolean }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs ${
      active ? 'bg-white text-black' : 'bg-white/10 text-white/60'
    }`}
  >
    <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-white/30'}`} />
    {label}
  </span>
);
