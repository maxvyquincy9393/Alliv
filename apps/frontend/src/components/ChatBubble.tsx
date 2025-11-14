import { motion } from 'framer-motion';
import { Message } from '../types/message';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const ChatBubble = ({ message, isOwn }: ChatBubbleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[70%] px-4 py-3 rounded-2xl ${
          isOwn
            ? 'bg-gradient-to-r from-accent-orange to-accent-peach text-white rounded-br-sm'
            : 'bg-dark-card text-gray-200 rounded-bl-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isOwn ? 'text-white/70' : 'text-gray-500'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
};
