import { motion } from 'framer-motion';
import { Message } from '../types/message';
import { sanitizeText } from '../lib/sanitize';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const ChatBubble = ({ message, isOwn }: ChatBubbleProps) => {
  const safeContent = sanitizeText(message.content);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[70%] rounded-3xl px-4 py-3 text-sm shadow-[0_12px_30px_rgba(0,0,0,0.35)] ${
          isOwn
            ? 'rounded-br-md bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-[#050b18]'
            : 'rounded-bl-md bg-white/5 text-white/90'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{safeContent}</p>
        <p className={`mt-2 text-[10px] uppercase tracking-wide ${isOwn ? 'text-black/60' : 'text-white/40'}`}>
          {new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
};
