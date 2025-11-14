import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Paperclip, Send, AlertCircle } from 'lucide-react';
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
      <div className="shell-content space-y-8 pb-16">
        <section className="panel p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Chat</p>
              <h1 className="text-3xl font-semibold text-white">Keep the momentum going</h1>
              <p className="text-white/60 text-sm mt-2">
                {matchId
                  ? `You’re chatting inside room ${matchId}. Messages sync instantly across devices.`
                  : 'Start a conversation by matching with someone in Discover.'}
              </p>
            </div>
            <div className="flex gap-4 text-sm text-white/70">
              <StatusBadge label="Connection" active={connected} />
              <StatusBadge label="Partner online" active={online} />
            </div>
          </div>
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
          <div className="panel p-0 flex flex-col h-[70vh]">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {noConnection ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/60 space-y-2">
                  <p className="text-lg text-white">No active match yet</p>
                  <p className="text-sm">
                    Swipe or browse projects to start a conversation. We’ll drop you into chat once a match happens.
                  </p>
                  <button
                    onClick={() => navigate('/discover')}
                    className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white"
                  >
                    Go to Discover
                  </button>
                </div>
              ) : formattedMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/60">
                  <p>No messages yet.</p>
                  <p className="text-sm">Break the ice with a quick hello.</p>
                </div>
              ) : (
                formattedMessages.map((message) => (
                  <ChatBubble key={message.id} message={message} isOwn={message.senderId === user?.id} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-white/5 px-6 py-4 space-y-3">
              {typing && !noConnection && <TypingIndicator />}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 w-11 rounded-xl border border-white/10 text-white/70 hover:text-white flex items-center justify-center"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <textarea
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder={noConnection ? 'Connect with someone to start typing...' : 'Type a message...'}
                  className={`flex-1 min-h-[44px] max-h-36 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none ${
                    noConnection ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  disabled={noConnection}
                />
                <button
                  onClick={handleSend}
                  disabled={noConnection}
                  className="h-11 px-4 rounded-2xl bg-white text-black font-semibold hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
          <aside className="panel p-6 space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Pro tips</p>
            <ul className="space-y-2 text-sm text-white/70">
              <li>- Share calendar links directly to plan a sync.</li>
              <li>- Add context or links so your collaborator knows where to jump in.</li>
              <li>- Attach moodboards or prototypes if you’ve already started.</li>
            </ul>
            {noConnection && (
              <div className="rounded-2xl border border-white/10 p-4 text-sm text-white/70">
                You’re not connected to anyone yet. Head over to Discover, Projects, or Events to start a new chat.
              </div>
            )}
          </aside>
        </div>
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
    <span
      className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-white/30'}`}
    />
    {label}
  </span>
);
