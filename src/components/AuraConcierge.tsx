import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, User, ShieldCheck, Landmark, MapPin, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatWithAura } from '../lib/gemini';
import { Message } from '../types';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

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
  const [latestTrip, setLatestTrip] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'trips'), 
      where('userId', '==', auth.currentUser.uid), 
      orderBy('createdAt', 'desc'), 
      limit(1)
    );
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLatestTrip({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
    });
  }, []);

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

    try {
      const tripContext = latestTrip ? `
        ACTIVE TRIP DETAILS:
        - Destination: ${latestTrip.destination}
        - Dates: ${latestTrip.dates}
        - Current Intelligence (JSON): ${latestTrip.intelligenceReport}
      ` : "No active trip found.";

      const systemPrompt = {
        role: 'user' as const,
        content: `System Instructions: You are Aura, the elite AI travel concierge. 
        ${tripContext}
        
        Modification Protocol:
        If the user requests a change to their trip (booking a hotel, changing dates, adding an activity, etc.), respond naturally and THEN include a specific update block at the end of your message.
        
        Update Block Format (STRICT):
        [TRIP_UPDATE]
        {
          "updates": {
            "destination": "new destination if changed",
            "dates": "new dates if changed",
            "intelligenceReport": "A FULLY UPDATED JSON string that incorporates the changes into the existing report structure."
          }
        }
        [/TRIP_UPDATE]
        
        Your tone is hyper-competent and refined.`,
        timestamp: Date.now()
      };

      const response = await chatWithAura([systemPrompt, ...messages, userMsg]);
      
      let finalContent = response;
      const updateMatch = response.match(/\[TRIP_UPDATE\]([\s\S]*?)\[\/TRIP_UPDATE\]/);
      
      if (updateMatch && latestTrip && auth.currentUser) {
        try {
          const updateData = JSON.parse(updateMatch[1]).updates;
          const cleanUpdate: any = { updatedAt: serverTimestamp() };
          if (updateData.destination) cleanUpdate.destination = updateData.destination;
          if (updateData.dates) cleanUpdate.dates = updateData.dates;
          if (updateData.intelligenceReport) cleanUpdate.intelligenceReport = updateData.intelligenceReport;
          
          await updateDoc(doc(db, 'trips', latestTrip.id), cleanUpdate);
          
          // Hide the raw JSON from the user and replace with a clean confirmation
          finalContent = response.replace(/\[TRIP_UPDATE\][\s\S]*?\[\/TRIP_UPDATE\]/, "\n\n*Protocol Updated: Itinerary Synchronized.*");
        } catch (e) {
          console.error("Failed to parse or apply Aura update", e);
        }
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: finalContent,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
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
