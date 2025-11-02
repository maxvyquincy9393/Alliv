import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ChatBubble } from '../components/ChatBubble';
import { TypingIndicator } from '../components/TypingIndicator';
import { AIIcebreakers } from '../components/AIIcebreakers';
import { FlirtDetector } from '../components/FlirtDetector';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { fadeInUp, stagger } from '../lib/motion';

export const Chat = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { messages, sendMessage, typing: isTyping } = useChat('mock-match-id');
  const [messageInput, setMessageInput] = useState('');
  const [showIcebreakers, setShowIcebreakers] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput('');
      setShowIcebreakers(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleIcebreakerSelect = (message: string) => {
    setMessageInput(message);
    setShowIcebreakers(false);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      console.log('File selected:', file.name);
      sendMessage(`📎 Shared file: ${file.name}`);
    }
  };

  const allMessages = messages.map(m => m.content);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-24">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="https://i.pravatar.cc/150?img=1"
                    alt="Chat partner"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-accent-blue/30"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full ring-2 ring-background" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Alex Chen</h2>
                  <p className="text-xs text-white/50">Active now</p>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/profile/1')} 
                className="glass px-4 py-2 rounded-xl text-sm text-white/70 hover:text-white transition-all"
              >
                View Profile
              </button>
            </div>
          </motion.div>

          {/* Flirt Detector */}
          <FlirtDetector messages={allMessages} />

          {/* AI Icebreakers */}
          <AnimatePresence>
            {showIcebreakers && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AIIcebreakers
                  userName="Alex"
                  userField="Photography"
                  onSelect={handleIcebreakerSelect}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="glass-card rounded-2xl p-6 min-h-[500px] max-h-[600px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Start the conversation</h3>
                  <p className="text-white/40">
                    Use an AI-suggested opener or write your own message
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.senderId === 'current-user'}
                  />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-4">
            <div className="flex items-end gap-3">
              {/* File Upload */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              <button
                onClick={handleFileSelect}
                className="p-3 glass rounded-xl text-white/60 hover:text-white hover:shadow-glow-blue transition-all"
                title="Attach file (max 10MB)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 resize-none"
                  style={{ maxHeight: '120px' }}
                />
              </div>

              {/* Voice Note (UI only) */}
              <button
                className="p-3 glass rounded-xl text-white/60 hover:text-white hover:shadow-glow-blue transition-all"
                title="Voice note"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!messageInput.trim()}
                className="p-3 bg-accent-blue rounded-xl text-white hover:shadow-glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};
