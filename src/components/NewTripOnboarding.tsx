import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, Home, Activity, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

interface OnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function NewTripOnboarding({ onComplete, onCancel }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    destination: '',
    accommodation: '',
    activity: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    try {
      const tripData = {
        userId: auth.currentUser.uid,
        destination: data.destination,
        accommodation: data.accommodation,
        activities: [data.activity],
        status: 'planning',
        createdAt: serverTimestamp()
      };
      
      const path = 'trips';
      await addDoc(collection(db, path), tripData);
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trips');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { title: "Where to?", icon: Plane, key: 'destination', placeholder: 'Tokyo, Paris, Mars...' },
    { title: "Where to stay?", icon: Home, key: 'accommodation', placeholder: 'Boutique Hotel, Airbnb, Aman...' },
    { title: "What to do?", icon: Activity, key: 'activity', placeholder: 'Hidden tempels, Private dining...' },
  ];

  const current = steps[step - 1];

  return (
    <div className="flex flex-col h-full bg-dark text-white relative">
      <div className="absolute inset-0 mesh-bg opacity-30">
         <div className="accent-sphere sphere-1" />
         <div className="accent-sphere sphere-2" />
      </div>

      <header className="p-8 flex justify-between items-center relative z-10">
        <button onClick={onCancel} className="text-[10px] uppercase font-bold text-white/40 tracking-widest hover:text-white transition-colors">Cancel</button>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 w-6 rounded-full transition-all duration-500 ${i <= step ? 'bg-gold' : 'bg-white/10'}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm space-y-10"
          >
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 glass-panel mx-auto flex items-center justify-center rounded-2xl text-gold border-white/20!">
                <current.icon size={30} />
              </div>
              <h2 className="text-4xl font-serif italic font-bold tracking-tight">{current.title}</h2>
            </div>

            <div className="space-y-6">
              <input 
                autoFocus
                value={(data as any)[current.key]}
                onChange={(e) => setData({ ...data, [current.key]: e.target.value })}
                placeholder={current.placeholder}
                className="w-full bg-transparent border-b-2 border-white/10 py-4 text-2xl font-light text-center focus:border-gold outline-none transition-colors placeholder:text-white/10"
              />

              <button
                onClick={handleNext}
                disabled={!(data as any)[current.key] || isLoading}
                className="w-full py-5 bg-white text-dark rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-20"
              >
                {isLoading ? 'Booking Intelligence...' : step === 3 ? 'Finalize Itinerary' : 'Next Protocol'}
                {!isLoading && <ChevronRight size={16} />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="p-8 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 text-gold/60">
          <Sparkles size={12} />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Aura AI is calculating your optimal route</span>
        </div>
      </footer>
    </div>
  );
}
