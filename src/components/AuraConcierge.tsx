import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, User, ShieldCheck, Landmark, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatWithAura } from '../lib/gemini';
import { Message } from '../types';

export default function AuraConcierge({ tier }: { tier: 'basic' | 'elite' }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Welcome to **Nomad Elite**, Mr. Traveler. I am **Aura**, your dedicated concierge. 
      ${tier === 'elite' ? "As an **Elite** member, you have unrestricted access to our global private network. How may I assist your journey today?" : "How may I help you plan your next adventure?"}`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await chatWithAura([...messages, userMsg]);
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    }]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${tier === 'elite' ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white'}`}>
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="font-serif italic text-xl font-medium tracking-tight">Aura Concierge</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-bold">
              {tier === 'elite' ? 'Private Access' : 'Digital Assistant'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth no-scrollbar"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-white/10 rounded-2xl p-4 border border-white/10 shadow-lg' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full glass-panel flex items-center justify-center shrink-0 mt-1 border-white/20!">
                    <Sparkles size={14} className="text-gold" />
                  </div>
                  <div className="markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              )}
              {msg.role === 'user' && (
                <p className="text-sm text-white leading-relaxed font-normal">{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-gold/50 ml-12 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
          </div>
        )}
      </div>

      {/* Suggested Actions (Elite Only) */}
      {tier === 'elite' && messages.length < 3 && (
        <div className="px-6 py-2 overflow-x-auto flex gap-2 no-scrollbar">
          {['Backstage Landmark Passes', 'Embassy Assistance', 'Hidden Local Secrets', 'Emergency Protocol'].map((action) => (
            <button
              key={action}
              onClick={() => setInput(action)}
              className="whitespace-nowrap px-4 py-2 rounded-full border border-gold/30 bg-gold/5 text-gold text-[10px] font-bold uppercase tracking-wider hover:bg-gold/10 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-6">
        <div className="flex gap-2 p-1 pl-5 rounded-2xl bg-white/5 border border-white/10 focus-within:border-white/20 transition-all shadow-2xl backdrop-blur-md">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Aura anything..."
            className="flex-1 bg-transparent py-4 text-sm focus:outline-none placeholder:text-white/20 font-medium"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-4 bg-white text-dark rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
