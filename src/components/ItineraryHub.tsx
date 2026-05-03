import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Plane, MapPin, Clock, Info, AlertTriangle, ShieldCheck, CheckCircle2, Ticket, Landmark, Sparkles } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { ItineraryItem } from '../types';

export default function ItineraryHub({ demoTrips = [] }: { demoTrips?: any[] }) {
  const [trips, setTrips] = useState<any[]>(demoTrips);
  const [loading, setLoading] = useState(!demoTrips.length);

  useEffect(() => {
    if (demoTrips.length > 0) {
      setTrips(prev => {
        const ids = new Set(prev.map(t => t.id || t.createdAt));
        const newDemo = demoTrips.filter(t => !ids.has(t.id || t.createdAt));
        return [...newDemo, ...prev];
      });
    }

    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

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
  }, [demoTrips]);

  const latestTrip = trips[0];

  const parseIntelligence = (report: string) => {
    try {
      const jsonMatch = report.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse report", e);
    }
    return null;
  };

  const intelligence = latestTrip?.intelligenceReport ? parseIntelligence(latestTrip.intelligenceReport) : null;
  const [bookingStatus, setBookingStatus] = useState<Record<string, string>>({});

  const handleBooking = (id: string) => {
    setBookingStatus(prev => ({ ...prev, [id]: 'authorizing' }));
    setTimeout(() => {
      setBookingStatus(prev => ({ ...prev, [id]: 'confirmed' }));
    }, 2000);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Sparkles className="text-gold animate-pulse" size={24} />
      </div>
    );
  }

  const getImageUrl = (keyword: string, width = 800, height = 800, random: string | number = 0) => {
    // Priority: Specific tags first, then luxury/travel context
    const tags = (keyword || 'luxury,resort').replace(/\s+/g, ',').toLowerCase();
    // Use a unique random seed to prevent caching the same image
    return `https://loremflickr.com/${width}/${height}/${tags}?random=${random}&lock=${Math.floor(Math.random() * 10000)}`;
  };

  return (
    <div className="p-0 h-full overflow-y-auto no-scrollbar pb-32">
      {latestTrip ? (
        <>
          <div className="relative h-64 md:h-80 w-full mb-8">
            <img 
              src={getImageUrl(intelligence?.destinationImage || latestTrip.destination || 'resort', 1600, 900, 'hero')}
              className="w-full h-full object-cover"
              alt={latestTrip.destination}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8">
              <h1 className="font-serif italic text-4xl font-bold mb-1 tracking-tight text-white">{latestTrip.destination}</h1>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
                {latestTrip.dates || 'Active Expedition'} • Status: {latestTrip.status}
              </p>
            </div>
          </div>

          <div className="px-6 space-y-10">
            {intelligence ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                {/* Flights */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white/40 border-b border-white/5 pb-2">
                    <Plane size={14} />
                    <span className="text-[9px] uppercase font-black tracking-widest">Flight Protocols</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {intelligence.flights?.map((f: any, i: number) => (
                      <div key={i} className="glass-panel p-5 border-white/10! space-y-4 hover:bg-white/[0.03] transition-colors">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-[8px] text-gold uppercase font-black tracking-tighter mb-1">{f.carrier}</p>
                            <h4 className="text-xs font-bold">{f.option}</h4>
                          </div>
                          <span className="text-xs font-mono text-white/40">{f.price}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleBooking(`flight-${i}`)}
                            className="flex-1 py-2 rounded-lg bg-gold/10 text-gold text-[9px] uppercase font-bold tracking-widest border border-gold/20 hover:bg-gold/20"
                          >
                            {bookingStatus[`flight-${i}`] === 'confirmed' ? 'Secured' : bookingStatus[`flight-${i}`] === 'authorizing' ? 'Verifying...' : 'Authorize AI'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hotels */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white/40 border-b border-white/5 pb-2">
                    <MapPin size={14} />
                    <span className="text-[9px] uppercase font-black tracking-widest">Select Accommodation</span>
                  </div>
                  {intelligence.hotels?.map((h: any, i: number) => (
                    <div key={i} className="glass-panel overflow-hidden border-white/10! flex flex-col md:flex-row gap-0 items-stretch bg-gradient-to-r from-white/[0.02] to-transparent">
                      <div className="w-full md:w-1/3 h-48 md:h-auto relative">
                        <img 
                          src={getImageUrl(h.imageKeyword || 'luxury hotel', 800, 800, i)}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                          alt={h.name}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-dark/80 via-transparent to-transparent" />
                      </div>
                      <div className="flex-1 p-6 space-y-2">
                        <div className="flex items-baseline gap-3">
                          <h4 className="text-xl font-serif italic">{h.name}</h4>
                          <span className="text-[9px] text-gold font-bold uppercase tracking-widest">{h.price}</span>
                        </div>
                        <p className="text-[10px] text-white/40 italic leading-relaxed">"{h.reason}"</p>
                        <p className="text-[9px] text-white/20 font-mono">{h.details}</p>
                        <div className="pt-4 flex gap-3">
                          <button 
                            onClick={() => handleBooking(`hotel-${i}`)}
                            className="flex-1 md:flex-none px-6 py-3 bg-white text-dark rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            {bookingStatus[`hotel-${i}`] === 'confirmed' ? 'Reservation Active' : 'AI Direct Booking'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tours */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white/40 border-b border-white/5 pb-2">
                    <Landmark size={14} />
                    <span className="text-[9px] uppercase font-black tracking-widest">Exclusive Experiences</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {intelligence.tours?.map((t: any, i: number) => (
                      <div key={i} className="glass-panel overflow-hidden border-white/10! space-y-0 group bg-white/[0.02]">
                        <div className="h-40 overflow-hidden relative">
                          <img 
                            src={getImageUrl(t.imageKeyword || 'exclusive tour', 600, 400, i + 10)}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            alt={t.name}
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-dark/60 pointer-events-none" />
                        </div>
                        <div className="p-4 space-y-3">
                          <h4 className="text-xs font-bold leading-tight line-clamp-1">{t.name}</h4>
                          <p className="text-[9px] text-white/40">{t.contact}</p>
                          <button 
                            onClick={() => handleBooking(`tour-${i}`)}
                            className="w-full py-2 bg-gold/5 border border-gold/20 text-gold text-[8px] font-bold uppercase tracking-widest rounded-lg transition-colors hover:bg-gold/10"
                          >
                            {bookingStatus[`tour-${i}`] === 'confirmed' ? 'Requested' : 'Reserve Access'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {intelligence.localSecret && (
                  <div className="p-6 glass-panel border-gold/40! bg-gold/5 relative overflow-hidden">
                    <Sparkles size={40} className="absolute -right-4 -top-4 text-gold/10 rotate-12" />
                    <div className="space-y-2 relative z-10">
                      <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-gold">Elite Secret Unlocked</h5>
                      <p className="text-xs text-white/80 italic leading-relaxed">{intelligence.localSecret}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                 {latestTrip.intelligenceReport && (
                  <div className="glass-panel p-6 border-white/10! text-[11px] leading-relaxed text-white/60 markdown-body">
                    <ReactMarkdown>{latestTrip.intelligenceReport}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* Timeline Simulation */}
            <div className="space-y-6 pt-10 border-t border-white/5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Journey Protocol</h3>
              <div className="relative pl-10 pb-8 group">
                <div className="absolute left-[13px] top-8 bottom-0 w-[1px] bg-white/10" />
                <div className="absolute left-0 top-0 w-7 h-7 rounded-lg flex items-center justify-center border bg-gold/20 border-gold/40 text-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                  <Plane size={14} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold font-mono text-gold/60 tracking-wider">T-Minus Zero</span>
                  <h4 className="text-sm font-bold tracking-tight">Expedition Initialized</h4>
                  <p className="text-[11px] text-white/40 font-medium">{latestTrip.destination}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-6 p-8">
          <div className="w-16 h-16 glass-panel flex items-center justify-center rounded-2xl text-white/10 border-white/10!">
            <Plane size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-serif italic">No Active Expeditions.</h2>
            <p className="text-xs text-white/30 max-w-[200px]">Aura is ready to synthesize your next journey.</p>
          </div>
          <button 
            onClick={() => (window as any).dispatchEvent(new CustomEvent('START_ONBOARDING'))}
            className="px-8 py-3 bg-white text-dark rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl"
          >
            Formulate Journey
          </button>
        </div>
      )}
    </div>
  );
}
