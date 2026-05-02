import React from 'react';
import { motion } from 'motion/react';
import { Shield, Phone, LifeBuoy, Zap, Landmark, Pill, Map, MessageSquareCode } from 'lucide-react';

const EMERGENCY_ACTIONS = [
  {
    icon: Landmark,
    title: 'Embassy Contact',
    desc: 'Automated protocol for US Embassy assistance.',
    color: 'text-blue-400'
  },
  {
    icon: Pill,
    title: 'Medical Aid',
    desc: 'Local English-speaking doctors & 24h pharmacies.',
    color: 'text-rose-400'
  },
  {
    icon: Phone,
    title: 'Emergency SOS',
    desc: 'Live location alert to contacts & local police.',
    color: 'text-red-500'
  }
];

export default function SafetyCenter() {
  return (
    <div className="p-6 h-full overflow-y-auto no-scrollbar py-10">
      <header className="mb-10">
        <h1 className="font-serif italic text-3xl font-bold mb-1 tracking-tight">Global Safety</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Active Guard: Tokyo Environs</p>
      </header>

      {/* Safety Status */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="glass-card p-5 border-green-500/20! bg-green-500/5 shadow-lg">
          <Shield size={20} className="text-green-500 mb-3" />
          <p className="text-[9px] uppercase text-green-500/60 font-bold mb-1 tracking-wider">Local Status</p>
          <p className="text-base font-bold tracking-tight">Level 1: Low Risk</p>
        </div>
        <div className="glass-card p-5 border-white/10 shadow-lg">
          <Zap size={20} className="text-gold mb-3" />
          <p className="text-[9px] uppercase text-white/30 font-bold mb-1 tracking-wider">Safety Package</p>
          <p className="text-base font-bold tracking-tight">Offline Sync</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 border-b border-white/10 pb-3">Emergency Protocols</h3>
        {EMERGENCY_ACTIONS.map((action) => (
          <motion.button
            key={action.title}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full glass-card p-5 flex items-center gap-5 text-left group border-white/5! hover:border-white/10 transition-all shadow-md"
          >
            <div className={`p-3.5 rounded-2xl bg-white/5 ${action.color} group-hover:bg-white/10 transition-colors shadow-inner`}>
              <action.icon size={22} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold tracking-tight mb-0.5">{action.title}</h4>
              <p className="text-[10px] text-white/40 font-medium leading-relaxed">{action.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mt-12 space-y-5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Local Toolbox</h3>
        <div className="grid grid-cols-2 gap-4">
          <button className="glass-card p-5 flex flex-col items-center gap-3 text-center border-white/5! hover:bg-white/5 transition-colors">
            <div className="p-2 rounded-lg bg-gold/10 text-gold">
              <MessageSquareCode size={18} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest">Translation</span>
          </button>
          <button className="glass-card p-5 flex flex-col items-center gap-3 text-center border-white/5! hover:bg-white/5 transition-colors">
            <div className="p-2 rounded-lg bg-gold/10 text-gold">
              <Map size={18} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest">Offline Maps</span>
          </button>
        </div>
      </div>

      <div className="mt-12 p-8 rounded-[32px] bg-red-500/10 border border-red-500/20 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent" />
        <button className="relative w-full py-5 bg-red-500 text-white font-black rounded-2xl active:scale-95 transition-all shadow-xl text-xs uppercase tracking-[0.2em]">
          Trigger SOS Protocol
        </button>
        <p className="relative text-[9px] text-red-400 font-bold mt-4 uppercase tracking-[0.15em] opacity-60">Hold for 3 seconds to alert local authorities</p>
      </div>
    </div>
  );
}
