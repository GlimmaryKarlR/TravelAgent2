import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Clock, MapPin, Sparkles, CheckCircle2, Circle, AlertCircle, ChevronRight, Utensils, Plane, Landmark, Play, ShieldCheck } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import AudioTourAgent from './AudioTourAgent';
import PaymentModal from './PaymentModal';

interface ScheduleItem {
  time: string;
  activity: string;
  status: 'booked' | 'proposed' | 'alert';
  type: 'flight' | 'tour' | 'dining' | 'hotel' | 'other' | 'activity' | 'accommodation';
  location?: string;
  day?: number;
}

export default function ScheduleView({ demoTrips = [] }: { demoTrips?: any[] }) {
  const [trips, setTrips] = useState<any[]>(demoTrips);
  const [loading, setLoading] = useState(!demoTrips.length);
  const [selectedDay, setSelectedDay] = useState(1);
  const [activeTour, setActiveTour] = useState<{ location: string, activity: string } | null>(null);
  const [bookingItem, setBookingItem] = useState<any | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setTrips(demoTrips);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'trips'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrips(tripData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trips');
    });

    return () => unsubscribe();
  }, []);

  const latestTrip = trips[0];
  
  const parseIntelligence = (report: string) => {
    try {
      const jsonMatch = report.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse report", e);
    }
    return null;
  };

  const intelligence = latestTrip?.intelligenceReport ? parseIntelligence(latestTrip.intelligenceReport) : null;
  const confirmedSchedule = latestTrip?.confirmedSchedule;

  const getSourceSchedule = () => {
    if (confirmedSchedule && confirmedSchedule[selectedDay - 1]) {
      return confirmedSchedule[selectedDay - 1].items;
    }
    if (intelligence?.schedule && intelligence.schedule[selectedDay - 1]) {
      return intelligence.schedule[selectedDay - 1].items;
    }
    return null;
  };

  const dayItems = getSourceSchedule();
  const schedule: ScheduleItem[] = dayItems || [
    { time: "08:00", activity: "VIP Landing Protocol", status: "booked", type: "flight", location: "General Aviation Terminal" },
    { time: "10:30", activity: "Expedition Check-in", status: "booked", type: "hotel", location: latestTrip?.destination },
    { time: "13:00", activity: "Elite Welcome Lunch", status: "proposed", type: "dining", location: "The Crystal Terrace" },
    { time: "15:30", activity: "Vantage Point Tour", status: "proposed", type: "tour", location: "Global Heights" },
    { time: "20:00", activity: "Chef's Table Experience", status: "booked", type: "dining", location: "Nebula Room" }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane size={14} />;
      case 'dining': return <Utensils size={14} />;
      case 'tour': return <Landmark size={14} />;
      case 'hotel':
      case 'accommodation': return <MapPin size={14} />;
      default: return <Sparkles size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Clock className="text-gold animate-pulse" size={32} />
        <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Calibrating Timeline...</span>
      </div>
    );
  }

  if (!latestTrip) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
        <CalendarDays size={48} className="text-white/10" />
        <div className="space-y-2">
          <h2 className="text-xl font-serif italic">Timeline Silent.</h2>
          <p className="text-xs text-white/30">Generate an expedition to initialize OdyAi's scheduler.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-dark overflow-hidden">
      <AnimatePresence>
        {activeTour && (
          <AudioTourAgent 
            location={activeTour.location} 
            activity={activeTour.activity} 
            onClose={() => setActiveTour(null)} 
          />
        )}
        {bookingItem && (
          <PaymentModal 
            tripId={latestTrip.id}
            item={{...bookingItem, day: selectedDay}}
            onClose={() => setBookingItem(null)}
            onSuccess={() => setBookingItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Day Selector */}
      <div className="px-8 pt-8 pb-6 border-b border-white/5 flex gap-4 overflow-x-auto no-scrollbar">
        {(confirmedSchedule || intelligence?.schedule || [1, 2, 3]).map((_, idx) => {
          const day = idx + 1;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-6 py-2 rounded-full text-[10px] uppercase font-black tracking-widest transition-all shrink-0 ${
                selectedDay === day ? 'bg-gold text-dark shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white/40 border border-white/10'
              }`}
            >
              Day {day}
            </button>
          );
        })}
      </div>

      {/* Timeline Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-10 pb-32">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[39px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-gold/5 via-gold/40 to-transparent" />

          {/* Timeline Items */}
          <div className="space-y-12 relative z-10">
            {schedule.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-8 group"
              >
                {/* Time Column */}
                <div className="w-10 pt-1 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-white/30 tracking-tight">{item.time}</span>
                </div>

                {/* Node & Content */}
                <div className="flex-1 flex gap-6">
                  {/* Node */}
                  <div className={`mt-1.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 ${
                    item.status === 'booked' ? 'bg-gold border-gold' : 'border-white/20 bg-dark'
                  }`}>
                    {item.status === 'booked' ? (
                      <CheckCircle2 size={10} className="text-dark" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    )}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 glass-panel p-5 border-white/10! hover:bg-white/[0.04] transition-all group-hover:translate-x-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] uppercase font-black tracking-tighter text-white/60">
                        {getIcon(item.type)}
                        <span>{item.type}</span>
                      </div>
                      <span className={`text-[8px] uppercase font-black tracking-widest ${
                        item.status === 'booked' ? 'text-gold' : 'text-white/20'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold tracking-tight mb-1 text-white/90">{item.activity}</h4>
                    
                    <div className="flex items-center justify-between mt-4">
                      {item.location && (
                        <div className="flex items-center gap-1 text-[10px] text-white/30 font-medium italic">
                          <MapPin size={10} />
                          <span>{item.location}</span>
                        </div>
                      )}

                      {(item.type === 'tour' || item.type === 'activity') && (
                        <button 
                          onClick={() => setActiveTour({ location: item.location || latestTrip.destination, activity: item.activity })}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                          <Play size={10} fill="currentColor" />
                          Start Audio Tour
                        </button>
                      )}

                      {item.status === 'proposed' && (
                        <button 
                          onClick={() => setBookingItem(item)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold text-dark text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                        >
                          <ShieldCheck size={10} />
                          Book Securely
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* End Node */}
          <div className="mt-12 ml-[31px] flex items-center gap-4">
             <div className="w-4 h-4 rounded-full border-2 border-white/5" />
             <span className="text-[9px] uppercase font-black tracking-[0.3em] text-white/10">End of Day Briefing</span>
          </div>
        </div>
      </div>

      {/* Floating Insight */}
      <div className="absolute bottom-32 left-8 right-8 z-20">
        <div className="p-4 glass-panel border-gold/40! bg-gold/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-gold">OdyAi Resident Intelligence</h5>
            <p className="text-[11px] text-white/70 leading-snug">Atmospheric optimization suggests rooftop dining at 20:30.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
