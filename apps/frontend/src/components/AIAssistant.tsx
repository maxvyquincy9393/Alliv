import { motion } from 'framer-motion';
import { useState } from 'react';
import { Send, Sparkles, Mic, MicOff } from 'lucide-react';

interface AIAssistantProps {
  context?: 'chat' | 'project' | 'profile' | 'discovery';
}

export const AIAssistant = ({ context = 'chat' }: AIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);

  const suggestions = {
    chat: [
      'Help me start a conversation',
      'Suggest icebreaker questions',
      'What should I share about my project?',
    ],
    project: [
      'Generate project description',
      'Suggest team roles needed',
      'Create milestone timeline',
    ],
    profile: [
      'Improve my bio',
      'Suggest skills to highlight',
      'Optimize profile for matches',
    ],
    discovery: [
      'Find best matches for me',
      'Suggest collaboration opportunities',
      'Analyze compatibility',
    ],
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = `Here's my suggestion based on "${userMessage}": I recommend focusing on highlighting your unique strengths and being specific about your collaboration goals.`;
      setConversation(prev => [...prev, { role: 'ai', content: aiResponse }]);
    }, 1000);
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // In a real implementation, this would use Web Speech API
  };

  return (
    <>
      {/* Floating AI Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-50 w-16 h-16 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full shadow-2xl flex items-center justify-center"
        style={{
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)',
        }}
      >
        <Sparkles className="text-white" size={28} />
      </motion.button>

      {/* AI Assistant Panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-44 right-6 z-50 w-96 h-[500px] bg-dark-surface rounded-2xl shadow-2xl border border-neon-purple/30 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-neon-purple to-neon-pink">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold">AI Assistant</h3>
                <p className="text-white/80 text-xs">Powered by advanced ML</p>
              </div>
            </div>
          </div>

          {/* Quick Suggestions */}
          {conversation.length === 0 && (
            <div className="p-4 space-y-2">
              <p className="text-dark-text-secondary text-sm mb-3">Quick suggestions:</p>
              {suggestions[context].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessage(suggestion)}
                  className="w-full text-left p-3 bg-dark-card hover:bg-dark-border rounded-lg text-sm text-white transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Conversation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {conversation.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-neon-purple text-white'
                      : 'bg-dark-card text-white'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-dark-border">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="w-full px-4 py-3 bg-dark-card text-white rounded-xl border border-dark-border focus:border-neon-purple focus:outline-none"
                />
              </div>
              <button
                onClick={handleVoiceInput}
                className={`p-3 rounded-xl transition-all ${
                  isListening
                    ? 'bg-tinder-primary text-white animate-pulse'
                    : 'bg-dark-card text-white hover:bg-dark-border'
                }`}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="px-4 py-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-xl hover:shadow-lg hover:shadow-neon-purple/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};
