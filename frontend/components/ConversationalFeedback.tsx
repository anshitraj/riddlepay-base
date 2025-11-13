'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Sparkles, ThumbsUp, Eye } from 'lucide-react';

interface FeedbackMessage {
  id: string;
  text: string;
  icon: React.ReactNode;
  type: 'info' | 'success' | 'loading' | 'suggestion';
}

interface ConversationalFeedbackProps {
  action?: 'sending' | 'sent' | 'suggest';
  onDismiss?: () => void;
}

export default function ConversationalFeedback({ action, onDismiss }: ConversationalFeedbackProps) {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    if (action) {
      const timer = setTimeout(() => {
        setMessages([]);
        if (onDismiss) onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [action, onDismiss]);

  useEffect(() => {
    if (action === 'sending') {
      setMessages([
        {
          id: '1',
          text: '⏳ Sending...',
          icon: <Clock className="w-4 h-4 animate-spin" />,
          type: 'loading',
        },
        {
          id: '2',
          text: '🔵 Sponsored by Base',
          icon: <Sparkles className="w-4 h-4" />,
          type: 'info',
        },
      ]);
    } else if (action === 'sent') {
      setMessages([
        {
          id: '1',
          text: '🎉 Airdrop Created!',
          icon: <CheckCircle className="w-4 h-4" />,
          type: 'success',
        },
        {
          id: '2',
          text: 'Want to send another?',
          icon: <ThumbsUp className="w-4 h-4" />,
          type: 'suggestion',
        },
      ]);
    } else if (action === 'suggest') {
      setMessages([
        {
          id: '1',
          text: '👀 Great! Ready to create your airdrop?',
          icon: <Eye className="w-4 h-4" />,
          type: 'suggestion',
        },
      ]);
    }
  }, [action]);

  if (!action || messages.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-20 sm:bottom-24 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-sm">
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.1 }}
            className={`mb-2 p-3 rounded-xl shadow-lg backdrop-blur-xl border ${
              msg.type === 'success'
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : msg.type === 'loading'
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : msg.type === 'info'
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-gray-500/20 border-gray-500/50 text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {msg.icon}
              <span className="text-sm font-medium">{msg.text}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}

