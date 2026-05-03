import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, Home, Activity, CheckCircle2, ChevronRight, Sparkles, Clock, MapPin, Banknote, DollarSign } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { chatWithAura } from '../lib/gemini';

interface OnboardingProps {
  user: any;
  initialData?: any;
  onComplete: (tripData?: any) => void;
  onCancel: () => void;
}

export default function NewTripOnboarding({ user, initialData, onComplete, onCancel }: OnboardingProps) {
  const [step, setStep] = useState(initialData ? 5 : 1);
  const [data, setData] = useState({
    destination: initialData?.destination || '',
    accommodation: initialData?.title || '',
    activity: initialData?.vibe || '',
    dates: 'Aura Premium Window',
    budget: 3
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else handleSubmit();
  };

  const statuses = [
    "Scanning global flight corridors...",
    "Verifying private villa availability...",
    "Checking diplomatic clearance for landmarks...",
    "Securing biometric vault signatures...",
    "Optimizing for carbon-neutral transport..."
  ];

  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);
    
    let i = 0;
    const statusInterval = setInterval(() => {
      setLoadingStatus(statuses[i % statuses.length]);
      i++;
    }, 1200);

    try {
      const budgetLabel = ["Budget-Conscious", "Comfort", "Premium", "Luxury", "Ultra-High-Net-Worth"][data.budget - 1];
      
      // Use Aura to synthesize the "Intelligence Report"
      const prompt = `Act as Aura, the elite concierge. Plan a luxury travel briefing for a user going to ${data.destination} (${data.dates}).
      Budget Tier: ${budgetLabel} (${data.budget}/5).
      Preferred Accommodation: ${data.accommodation}. 
      Interested in: ${data.activity}. 
      
      Provide your response in JSON format (wrapped in markdown code block) with the following structure:
      {
        "briefing": "Concise welcome message",
        "destinationImage": "2-3 simple descriptive tags (e.g., 'tokyo,skyline' or 'amalfi,coast')",
        "flights": [
          { "option": "Flight Number/Details", "price": "Price", "confidence": "High/Med", "carrier": "Airline" }
        ],
        "hotels": [
          { "name": "Hotel Name", "details": "Phone/Contact", "price": "per night", "reason": "Why Aura picked this", "imageKeyword": "2-3 tags for hotel look (e.g., 'villa,pool' or 'modern,suite')" }
        ],
        "tours": [
          { "name": "Experience Name", "contact": "Phone/Link", "access": "Elite/Public", "cost": "Cost", "imageKeyword": "2-3 tags for the activity (e.g., 'yacht,ocean' or 'helicopter,mountain')" }
        ],
        "schedule": [
          { "time": "09:00", "activity": "Morning Coffee at Secret Terrace", "status": "booked", "type": "dining" },
          { "time": "11:30", "activity": "Private Museum After-Hours", "status": "proposed", "type": "tour" },
          { "time": "14:00", "activity": "Helicopter Transfer to Coast", "status": "booked", "type": "flight" }
        ],
        "localSecret": "One high-end local hidden gem"
      }
      Provide 3 options for each categories (flights, hotels, tours). For the schedule, provide a 2-day sample timeline with at least 4-5 items per day. Keep image tags simple and comma-separated to ensure high-quality matching.`;
      
      const messages = [{ role: 'user' as const, content: prompt, timestamp: Date.now() }];
      const intelligenceReport = await chatWithAura(messages);

      const tripData = {
        userId: user.uid,
        destination: data.destination,
        accommodation: data.accommodation,
        activities: [data.activity],
        dates: data.dates,
        budget: data.budget,
        intelligenceReport, // Simulated agent results
        status: 'active',
        createdAt: new Date().toISOString() // Fallback string for demo
      };
      
      // Only attempt Firestore if we have a real Firebase session
      if (auth.currentUser) {
        await addDoc(collection(db, 'trips'), { 
          ...tripData, 
          createdAt: serverTimestamp() 
        });
      } else {
        // Mock delay for demo users to show the status messages
        await new Promise(resolve => setTimeout(resolve, 3000));
        // We pass the tripData back to App to update local state if needed
      }

      clearInterval(statusInterval);
      onComplete(tripData);
    } catch (error) {
      clearInterval(statusInterval);
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.CREATE, 'trips');
      } else {
        console.error("Demo submission failed:", error);
        onComplete(); // Still complete even if Gemini fails in demo
      }
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { title: "Where to?", icon: Plane, key: 'destination', placeholder: 'Tokyo, Paris, Mars...', type: 'text' },
    { title: "Spend Level", icon: Banknote, key: 'budget', type: 'budget' },
    { title: "When to travel?", icon: Clock, key: 'dates', placeholder: 'Summer 2026, Dec 12-20...', type: 'text' },
    { title: "Where to stay?", icon: Home, key: 'accommodation', placeholder: 'Boutique Hotel, Aman, Private Villa...', type: 'text' },
    { title: "What to do?", icon: Activity, key: 'activity', placeholder: 'Architecture tour, Hidden dining...', type: 'text' },
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
          {[1, 2, 3, 4, 5].map(i => (
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
              {current.type === 'budget' ? (
                <div className="flex flex-col items-center gap-8">
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        onClick={() => setData({ ...data, budget: val })}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                          data.budget === val 
                            ? 'bg-gold/20 border-gold shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-110' 
                            : 'bg-white/5 border-white/10 hover:border-white/30 text-white/40'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex gap-0.5">
                            {Array.from({ length: val }).map((_, idx) => (
                              <DollarSign key={idx} size={val > 3 ? 10 : 12} className={data.budget === val ? 'text-gold' : 'text-white/20'} />
                            ))}
                          </div>
                          <span className={`text-[8px] uppercase font-black tracking-tighter ${data.budget === val ? 'text-gold' : 'text-white/10'}`}>
                            {['Basic', 'Comfort', 'Elite', 'Luxury', 'Veblen'][val - 1]}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/40 italic font-medium uppercase tracking-widest">
                    Strategy: {["Economic Efficiency", "Standard Luxury", "Premium Selection", "Top-Tier Opulence", "Cost-No-Object"][data.budget - 1]}
                  </p>
                </div>
              ) : (
                <input 
                  autoFocus
                  value={(data as any)[current.key]}
                  onChange={(e) => setData({ ...data, [current.key]: e.target.value })}
                  placeholder={current.placeholder}
                  className="w-full bg-transparent border-b-2 border-white/10 py-4 text-2xl font-light text-center focus:border-gold outline-none transition-colors placeholder:text-white/10"
                />
              )}

              <button
                onClick={handleNext}
                disabled={(!(data as any)[current.key] && current.type !== 'budget') || isLoading}
                className="w-full py-5 bg-white text-dark rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-20"
              >
                {isLoading ? 'Booking Intelligence...' : step === 5 ? 'Finalize Itinerary' : 'Next Protocol'}
                {!isLoading && <ChevronRight size={16} />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="p-8 text-center relative z-10">
        <div className="flex flex-col items-center justify-center gap-3">
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-gold font-mono text-[9px] uppercase tracking-widest bg-gold/10 px-4 py-2 rounded-full border border-gold/20"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-ping" />
              {loadingStatus || 'Aura is calculating your optimal route...'}
            </motion.div>
          )}
          <div className="flex items-center gap-2 text-white/30">
            <Sparkles size={12} />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em]">{isLoading ? 'Synthesizing Expedition' : 'Aura AI Intelligence Ready'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
