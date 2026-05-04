import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CreditCard, Loader2, CheckCircle2, X, Lock, Globe, Landmark } from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface PaymentModalProps {
  item: {
    activity: string;
    location: string;
    type: string;
    time: string;
    price?: number;
    day: number;
  };
  tripId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ item, tripId, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [loading, setLoading] = useState(false);

  const price = item.price || Math.floor(Math.random() * 500) + 150; // Simulation logic

  const handleProcessPayment = async () => {
    setLoading(true);
    setStep('processing');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      if (!auth.currentUser) throw new Error("Not authenticated");

      // 1. Create a Booking record
      await addDoc(collection(db, 'bookings'), {
        userId: auth.currentUser.uid,
        tripId: tripId,
        type: item.type,
        title: item.activity,
        date: `Day ${item.day} - ${item.time}`,
        status: 'Confirmed',
        code: `NE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        price: price,
        createdAt: new Date().toISOString()
      });

      // 2. Add as a global booking if needed, but the listener in BookingHub will catch this.
      
      setStep('success');
      setLoading(false);
      
      // Notify parent after a short delay
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error("Simulation failed:", error);
      setLoading(false);
      setStep('details');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-0">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-dark/80 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md glass-panel overflow-hidden border-white/10! bg-gradient-to-br from-white/10 to-transparent shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gold">
                  <Shield size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Reservation</span>
                </div>
                <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-serif italic font-bold">{item.activity}</h3>
                  <p className="text-white/40 text-[11px] flex items-center gap-1">
                    <Globe size={10} /> {item.location}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center font-mono">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">Protocol Fee</span>
                  <span className="text-xl text-gold font-bold">${price.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                    <CreditCard size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5">NOMAD ELITE CARD</p>
                    <p className="text-[9px] text-white/20 font-mono italic">Simulated Dev Environment Active</p>
                  </div>
                  <div className="text-[8px] font-black text-gold px-2 py-1 rounded bg-gold/10 border border-gold/20 tracking-widest uppercase">
                    Stored
                  </div>
                </div>

                <button 
                  onClick={handleProcessPayment}
                  disabled={loading}
                  className="w-full py-4 bg-gold text-dark rounded-xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Authorize Transaction'}
                </button>
                
                <div className="flex items-center justify-center gap-2 text-[8px] text-white/20 uppercase font-bold tracking-widest">
                  <Lock size={8} /> 256-BIT ENCRYPTION SECURED BY AURA
                </div>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="p-12 flex flex-col items-center text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gold/20 rounded-full animate-ping" />
                <div className="w-24 h-24 rounded-full border-2 border-gold/20 flex items-center justify-center text-gold relative bg-dark">
                  <Loader2 size={40} className="animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-gold animate-pulse">Syncing with Concierge...</h3>
                <p className="text-[10px] text-white/40 font-mono">Securing assets across global networks</p>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 flex flex-col items-center text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <CheckCircle2 size={48} />
                </motion.div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif italic font-bold">Transaction Secured.</h3>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Your assets are now in the Vault.</p>
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-4"
              >
                <div className="text-[9px] font-mono text-white/20 select-none">
                  #CONFIRMATION-{Math.random().toString(36).substring(2, 10).toUpperCase()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
