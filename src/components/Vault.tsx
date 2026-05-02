import React from 'react';
import { motion } from 'motion/react';
import { FileText, ShieldCheck, CreditCard, User, Globe, Briefcase, Settings as SettingsIcon } from 'lucide-react';
import { TravelDocument } from '../types';

const MOCK_DOCS: TravelDocument[] = [
  { id: '1', name: 'Passport (US)', type: 'passport', expiryDate: '2029-05-20' },
  { id: '2', name: 'eVisa (Japan)', type: 'visa', expiryDate: '2026-06-15' },
  { id: '3', name: 'Amex Platinum Health', type: 'insurance', expiryDate: '2027-01-01' }
];

export default function Vault({ tier, setTier }: { tier: 'basic' | 'elite', setTier: (t: 'basic' | 'elite') => void }) {
  return (
    <div className="p-6 h-full overflow-y-auto no-scrollbar py-10">
      <header className="mb-10">
        <h1 className="font-serif italic text-3xl font-bold mb-1 tracking-tight">Global Vault</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Secure Identity & Digital Assets</p>
      </header>

      {/* Membership Card */}
      <div className={`p-8 rounded-[32px] mb-12 relative overflow-hidden transition-all duration-700 shadow-2xl ${tier === 'elite' ? 'elite-glow bg-gradient-to-br from-gold/20 via-white/5 to-transparent' : 'glass-panel border-white/5!'}`}>
        <div className="flex justify-between items-start mb-16 relative z-10">
          <div className="p-4 bg-white/5 rounded-2xl shadow-inner border border-white/5">
            <Globe size={28} className={tier === 'elite' ? 'text-gold' : 'text-white/20'} />
          </div>
          <div className="text-right">
             <div className={`pill ${tier === 'elite' ? 'pill-elite' : 'bg-white/10'}`}>
                {tier === 'elite' ? 'Elite Member' : 'Basic Member'}
             </div>
          </div>
        </div>

        <div className="space-y-1 relative z-10">
          <p className="text-2xl font-serif italic font-bold tracking-tight">Karl Glimmary</p>
          <p className="text-[10px] text-white/30 font-mono tracking-[0.2em] uppercase font-bold">#NE-8872-9901</p>
        </div>

        {/* Ambient Glows */}
        {tier === 'elite' && (
          <>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/20 blur-[50px]" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gold/10 blur-[50px]" />
          </>
        )}

        <button 
          onClick={() => setTier(tier === 'elite' ? 'basic' : 'elite')}
          className="relative z-10 mt-8 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-[0.98]"
        >
          {tier === 'elite' ? 'Switch to Basic' : 'Upgrade to Elite'}
        </button>
      </div>

      {/* Docs */}
      <div className="space-y-5">
        <div className="flex justify-between items-end mb-4 px-1">
           <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Intelligence Assets</h3>
           <button className="text-[10px] text-gold font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">Add Asset</button>
        </div>
        {MOCK_DOCS.map((doc) => (
          <div key={doc.id} className="glass-card p-5 mt-3 flex items-center justify-between group hover:border-white/20 transition-all cursor-pointer shadow-md">
            <div className="flex items-center gap-5">
              <div className="p-3 bg-white/5 rounded-xl text-white/20 group-hover:text-gold transition-colors shadow-inner">
                <FileText size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold tracking-tight">{doc.name}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">Expires {doc.expiryDate}</p>
              </div>
            </div>
            <ShieldCheck size={18} className="text-green-500/30 group-hover:text-green-400 transition-colors" />
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-3">
         <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6 px-1">Global Preferences</h3>
         {['Visa Intelligence', 'Carbon-Neutral Protocol', 'Family Alert Sync', 'System Security'].map((item) => (
           <button key={item} className="w-full flex items-center justify-between p-5 glass-card border-white/5! hover:bg-white/5 transition-all text-left">
             <span className="text-sm font-medium tracking-tight opacity-70">{item}</span>
             <SettingsIcon size={14} className="opacity-20" />
           </button>
         ))}
      </div>
    </div>
  );
}
