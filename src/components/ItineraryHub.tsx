import React from 'react';
import { motion } from 'motion/react';
import { Plane, MapPin, Clock, Info, AlertTriangle, ShieldCheck, CheckCircle2, Ticket, Landmark } from 'lucide-react';
import { ItineraryItem } from '../types';

const MOCK_ITINERARY: ItineraryItem[] = [
  {
    id: '1',
    time: '09:00 AM',
    activity: 'Flight AF274 to Tokyo (HND)',
    location: 'Paris Charles de Gaulle (CDG)',
    type: 'flight',
    status: 'confirmed',
    details: 'Terminal 2E, Gate L45. Elite Lounge Access included.'
  },
  {
    id: '2',
    time: '11:30 PM',
    activity: 'Private Transfer to Aman Tokyo',
    location: 'Haneda Airport',
    type: 'transport',
    status: 'confirmed',
    details: 'Driver: Takeshi-san. Mercedes S-Class [Plate: TK-778].'
  },
  {
    id: '3',
    time: 'Tomorrow, 02:00 PM',
    activity: 'Exclusive Access: Imperial Palace Hidden Chambers',
    location: 'Tokyo Imperial Palace',
    type: 'landmark',
    status: 'pending',
    exclusiveAccess: true,
    details: 'Nomad Elite exclusive. Guide will meet you at the Ote-mon Gate.'
  }
];

export default function ItineraryHub() {
  return (
    <div className="p-6 space-y-8 h-full overflow-y-auto no-scrollbar py-10">
      <header>
        <h1 className="font-serif italic text-3xl font-bold mb-1 tracking-tight">Your Journey</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Tokyo, Higashiyama-ku • May 2026</p>
      </header>

      {/* Next Event Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 border-gold/40! shadow-2xl relative overflow-hidden bg-gradient-to-br from-gold/5 next-event-glow"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-gold">Arriving Next</span>
          </div>
          <div className="p-2 bg-white/5 rounded-lg">
            <Ticket size={16} className="text-white/40" />
          </div>
        </div>

        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-serif font-bold italic tracking-tight">Haneda Arrival</h2>
          <p className="text-xs text-white/50 font-medium">International Terminal 3 • HND</p>
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-white/10">
          <div className="flex gap-6">
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-1">Status</p>
              <div className="pill pill-safe text-[9px]">
                On Time
              </div>
            </div>
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-1">Gate</p>
              <p className="text-xs font-bold tracking-widest">108A</p>
            </div>
          </div>
          <button className="px-5 py-2.5 bg-white text-dark rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
            View Ticket
          </button>
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 border-b border-white/10 pb-3">Itinerary Sync</h3>
        {MOCK_ITINERARY.map((item, i) => (
          <div key={item.id} className="relative pl-10 pb-8 group last:pb-0">
            {/* Timeline Line */}
            {i !== MOCK_ITINERARY.length - 1 && (
              <div className="absolute left-[13px] top-8 bottom-0 w-[1px] bg-white/10 group-hover:bg-gold/40 transition-colors" />
            )}
            
            {/* Timeline Icon */}
            <div className={`absolute left-0 top-0 w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${item.exclusiveAccess ? 'bg-gold/20 border-gold/40 text-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'bg-white/5 border-white/10 text-white/30'} group-hover:scale-110`}>
               {item.type === 'flight' && <Plane size={14} />}
               {item.type === 'transport' && <MapPin size={14} />}
               {item.type === 'landmark' && <Landmark size={14} />}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold font-mono text-gold/60 tracking-wider">{item.time}</span>
                {item.exclusiveAccess && (
                  <span className="pill pill-elite scale-75 origin-left tracking-tighter">Elite Access</span>
                )}
              </div>
              <h4 className="text-sm font-bold tracking-tight">{item.activity}</h4>
              <p className="text-[11px] text-white/40 font-medium">{item.location}</p>
              {item.details && (
                <div className="mt-4 p-4 glass-card border-white/5! text-[11px] text-white/60 leading-relaxed font-light">
                  <Info size={12} className="inline mr-2 opacity-40 mb-0.5" />
                  {item.details}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
