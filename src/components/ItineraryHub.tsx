import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Plane, MapPin, Clock, Info, AlertTriangle, ShieldCheck, CheckCircle2, Ticket, Landmark, Sparkles } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { ItineraryItem } from '../types';

export default function ItineraryHub() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'trips'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrips(tripData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trips');
    });

    return () => unsubscribe();
  }, []);

  const latestTrip = trips[0];

  return (
    <div className="p-6 space-y-8 h-full overflow-y-auto no-scrollbar py-10">
      <header>
        <h1 className="font-serif italic text-3xl font-bold mb-1 tracking-tight">Your Journey</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
          {latestTrip ? `${latestTrip.destination} • Status: ${latestTrip.status}` : 'No active trips'}
        </p>
      </header>

      {latestTrip ? (
        <>
          {/* Next Event Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 border-gold/40! shadow-2xl relative overflow-hidden bg-gradient-to-br from-gold/5"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-gold">Active Intelligence</span>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <h2 className="text-2xl font-serif font-bold italic tracking-tight">{latestTrip.destination} Bound</h2>
              <p className="text-xs text-white/50 font-medium">Staying at: {latestTrip.accommodation}</p>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-white/10">
              <div className="flex gap-6">
                <div>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-1">Activity</p>
                  <p className="text-xs font-bold">{latestTrip.activities?.[0] || 'Planning...'}</p>
                </div>
              </div>
              <button className="px-5 py-2.5 bg-white text-dark rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                Details
              </button>
            </div>
          </motion.div>

          {/* Timeline Simulation for the trip */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 border-b border-white/10 pb-3">Itinerary Stream</h3>
            <div className="relative pl-10 pb-8 group">
              <div className="absolute left-[13px] top-8 bottom-0 w-[1px] bg-white/10" />
              <div className="absolute left-0 top-0 w-7 h-7 rounded-lg flex items-center justify-center border bg-gold/20 border-gold/40 text-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                <Plane size={14} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold font-mono text-gold/60 tracking-wider">Initial Sync</span>
                <h4 className="text-sm font-bold tracking-tight">Expedition Start</h4>
                <p className="text-[11px] text-white/40 font-medium">{latestTrip.destination}</p>
              </div>
            </div>

            {latestTrip.intelligenceReport && (
              <div className="relative pl-10 pb-8 group">
                <div className="absolute left-0 top-0 w-7 h-7 rounded-lg flex items-center justify-center border bg-blue-500/10 border-blue-500/40 text-blue-400">
                  <Sparkles size={14} />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold font-mono text-blue-400 tracking-wider">Aura Briefing</span>
                  <div className="p-4 glass-panel border-white/5! text-[11px] text-white/80 leading-relaxed markdown-body">
                    <ReactMarkdown>{latestTrip.intelligenceReport}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
            
            <div className="relative pl-10 pb-8 group">
              <div className="absolute left-0 top-0 w-7 h-7 rounded-lg flex items-center justify-center border bg-white/5 border-white/10 text-white/30">
                <Landmark size={14} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold font-mono text-white/20 tracking-wider">Discovery Phase</span>
                <h4 className="text-sm font-bold tracking-tight">Vantage Exploration</h4>
                <p className="text-[11px] text-white/40 font-medium">{latestTrip.activities?.[0]}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="w-16 h-16 glass-panel flex items-center justify-center rounded-2xl text-white/10 border-white/10!">
            <Plane size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-serif italic">Your world is waiting.</h3>
            <p className="text-xs text-white/30 font-light max-w-[200px]">No active itineraries discovered. Initialize your first protocol.</p>
          </div>
          <button 
            onClick={() => (window as any).dispatchEvent(new CustomEvent('START_ONBOARDING'))}
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-white/10 transition-all"
          >
            New Expedition
          </button>
        </div>
      )}
    </div>
  );
}
