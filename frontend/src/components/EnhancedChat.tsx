import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Image, 
  Video, 
  Phone, 
  MoreVertical,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  read: boolean;
  encrypted: boolean;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface EnhancedChatProps {
  messages: Message[];
  onSendMessage: (content: string, type?: string) => void;
  onTyping: (isTyping: boolean) => void;
  isTyping: boolean;
  recipientName: string;
  recipientAvatar?: string;
  isOnline: boolean;
  isEncrypted?: boolean;
}

export const EnhancedChat: React.FC<EnhancedChatProps> = ({
  messages,
  onSendMessage,
  onTyping,
  isTyping,
  recipientName,
  recipientAvatar,
  isOnline,
  isEncrypted = true
}) => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachmentMenu, setAttachmentMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Handle typing indicator
    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      onTyping(false);
    }, 1000);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message, 'text');
      setMessage('');
      onTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload with encryption
      const reader = new FileReader();
      reader.onload = () => {
        onSendMessage(reader.result as string, file.type.startsWith('image/') ? 'image' : 'file');
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    // Implement voice recording logic
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        // Handle audio recording
        setTimeout(() => {
          setIsRecording(false);
          // Send audio message
        }, 3000);
      })
      .catch(err => console.error('Audio recording failed:', err));
  };

  const MessageStatus = ({ status }: { status: string }) => {
    switch (status) {
      case 'sending':
        return <div className="animate-pulse w-3 h-3 rounded-full bg-white/30" />;
      case 'sent':
        return <CheckCircle size={12} className="text-white/50" />;
      case 'delivered':
        return (
          <div className="flex -space-x-1">
            <CheckCircle size={12} className="text-white/50" />
            <CheckCircle size={12} className="text-white/50" />
          </div>
        );
      case 'read':
        return (
          <div className="flex -space-x-1">
            <CheckCircle size={12} className="text-blue-400" />
            <CheckCircle size={12} className="text-blue-400" />
          </div>
        );
      case 'failed':
        return <AlertCircle size={12} className="text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0A0F1C] to-[#0D1117]">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={recipientAvatar || '/default-avatar.png'}
              alt={recipientName}
              className="w-10 h-10 rounded-full object-cover"
            />
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A0F1C]" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              {recipientName}
              {isEncrypted && (
                <Lock size={14} className="text-green-400" />
              )}
            </h3>
            <p className="text-xs text-white/60">
              {isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Phone size={18} className="text-white/70" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Video size={18} className="text-white/70" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <MoreVertical size={18} className="text-white/70" />
          </motion.button>
        </div>
      </div>

      {/* Security Notice */}
      {isEncrypted && (
        <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20">
          <div className="flex items-center gap-2 text-xs text-green-400">
            <Shield size={14} />
            <span>Messages are end-to-end encrypted</span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isOwn = msg.senderId === 'current-user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {msg.type === 'text' && <p className="text-sm">{msg.content}</p>}
                    {msg.type === 'image' && (
                      <img src={msg.content} alt="Shared" className="rounded-lg max-w-full" />
                    )}
                    {msg.type === 'video' && (
                      <video src={msg.content} controls className="rounded-lg max-w-full" />
                    )}
                    {msg.type === 'audio' && (
                      <audio src={msg.content} controls className="max-w-full" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-2">
                    <span className="text-[10px] text-white/40">
                      {new Date(msg.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {isOwn && <MessageStatus status={msg.status} />}
                    {msg.encrypted && (
                      <Lock size={10} className="text-green-400" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-white/60"
            >
              <div className="flex gap-1">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-white/40"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                  className="w-2 h-2 rounded-full bg-white/40"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-white/40"
                />
              </div>
              <span className="text-xs">typing...</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-xl">
        {/* Attachment Menu */}
        <AnimatePresence>
          {attachmentMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 left-4 bg-[#1A1F3A] rounded-xl p-2 shadow-xl border border-white/10"
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors w-full"
              >
                <Image size={18} className="text-blue-400" />
                <span className="text-sm text-white">Photo</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors w-full">
                <Video size={18} className="text-purple-400" />
                <span className="text-sm text-white">Video</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors w-full">
                <Paperclip size={18} className="text-green-400" />
                <span className="text-sm text-white">File</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji Picker Placeholder */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-20 right-4 bg-[#1A1F3A] rounded-xl p-4 shadow-xl border border-white/10"
            >
              <div className="grid grid-cols-6 gap-2">
                {['😀', '😍', '🎉', '👍', '❤️', '🔥', '😎', '🤝', '💪', '✨', '🚀', '💯'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setMessage(prev => prev + emoji);
                      setShowEmoji(false);
                    }}
                    className="text-2xl hover:bg-white/10 p-2 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAttachmentMenu(!attachmentMenu)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Paperclip size={20} className="text-white/70" />
          </motion.button>
          
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 bg-white/5 rounded-xl text-white placeholder:text-white/40 border border-white/10 focus:border-[#35F5FF]/50 focus:outline-none resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEmoji(!showEmoji)}
              className="absolute right-2 bottom-2 p-1"
            >
              <Smile size={20} className="text-white/70" />
            </motion.button>
          </div>

          {message.trim() ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              className="p-2 rounded-lg bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black"
            >
              <Send size={20} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startVoiceRecording}
              className={`p-2 rounded-lg ${
                isRecording 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-white/5 hover:bg-white/10'
              } transition-colors`}
            >
              <Mic size={20} className={isRecording ? 'text-white' : 'text-white/70'} />
            </motion.button>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
};
