import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, Home, Activity, CheckCircle2, ChevronRight, Sparkles, Clock, MapPin, Banknote, DollarSign, Globe as GlobeIcon } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { chatWithOdyAi } from '../lib/gemini';
import Globe from './Globe';
import LuxuryCalendar from './Calendar';

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
    dates: '',
    budget: 3
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else handleSubmit();
  };

  const statuses = [
    "Plotting global expedition corridors...",
    "Verifying residential enclave availability...",
    "Authenticating diplomatic clearance protocols...",
    "Securing sovereign vault signatures...",
    "Optimizing architectural transit routes..."
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
      const budgetLabel = ["Budget-Conscious", "Comfort", "Premium", "Luxury", "Odyssey Tier"][data.budget - 1];
      
      // Calculate duration from dates string if possible
      let dayCount = 4; // Default
      if (data.dates && data.dates.includes('-')) {
        try {
          const parts = data.dates.split(' - ');
          if (parts.length === 2) {
            const yearMatch = parts[1].match(/\d{4}/);
            const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
            const start = new Date(`${parts[0]}, ${year}`);
            const end = new Date(parts[1]);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            if (!isNaN(diffDays) && diffDays > 0) dayCount = diffDays;
          }
        } catch (e) {
          console.log("Could not parse dates for precise day count, falling back to flexible estimation.");
        }
      }

      const prompt = `Act as OdyAi, the elite expedition architect. Design a sophisticated expedition briefing for a traveler going to ${data.destination} (${data.dates || 'Flexible Dates'}).
      Budget Strategy: ${budgetLabel} (${data.budget}/5).
      Architectural Focus: ${data.accommodation}. 
      Expedition Goals: ${data.activity}. 
      
      CRITICAL: Use your integrated Google Search tool to find REAL current flight options and hotel availability for ${data.destination} during ${data.dates}.
      
      IMPORTANT: You MUST generate a daily itinerary for EXACTLY ${dayCount} days. 
      The expedition duration is ${dayCount} days based on the resident's selection: ${data.dates || 'Flexible Window'}.
      Each day should be a separate entry in the "schedule" array.
      Each item in the schedule MUST include geographic coordinates (latitude and longitude) for the ${data.destination} area.
      
      ARCHITECTURAL REQUIREMENTS:
      1. Spatial-Temporal Optimization: Group activities geographically to minimize transit. 
      2. Flow Balance: Evenly distribute experiences across all ${dayCount} days.
      3. Atmospheric Intelligence: Schedule events based on "Golden Hour" logic.
      4. Logistics Precision: Explicitly calculate travel time between every venue. 
      5. Specialized Bundles: Propose 2-3 "Expedition Protocols" (Experience bundles).
      6. Residential Advice: Add specific notes for the resident.

      Provide your response in JSON format (wrapped in markdown code block) with the following structure:
      {
        "briefing": "Concise architectural overture explaining the logic of the selected route",
        "destinationImage": "2-3 extremely BROAD high-quality tags separated by commas (e.g., 'tokyo,skyline' or 'island,resort').",
        "packages": [
          { "id": "p1", "name": "Protocol Name", "description": "Logic summary", "highlights": ["Point 1", "Point 2"] }
        ],
        "flights": [
          { 
            "option": "Flight Number (e.g. AF275)", 
            "price": "Price", 
            "confidence": "High/Med", 
            "carrier": "Carrier Name",
            "departureAirport": "Airport Name (CODE)",
            "arrivalAirport": "Airport Name (CODE)",
            "departureTime": "HH:MM",
            "date": "YYYY-MM-DD"
          }
        ],
        "hotels": [
          { "name": "Enclave Name", "details": "Contact details", "price": "per evening", "reason": "Architectural logic for selection", "imageKeyword": "2 simple tags (e.g., 'villa,pool')." }
        ],
        "tours": [
          { "name": "Protocol Experience", "contact": "Official Link", "access": "Elite/Restricted", "cost": "Investment", "reason": "Strategic logic", "imageKeyword": "2 tags (e.g., 'yacht,exclusive')." }
        ],
        "schedule": [
          { 
            "day": 1,
            "date": "Full date",
            "items": [
              { 
                "time": "09:00", 
                "activity": "Experience Name", 
                "status": "proposed/confirmed", 
                "type": "residential/expedition/transit", 
                "location": "Venue", 
                "lat": 0.0, 
                "lng": 0.0,
                "transitSummary": "Transit protocol",
                "personalizedNote": "OdyAi intelligence note",
                "selectionReason": "Strategic placement logic"
              }
            ]
          }
        ],
        "localSecret": "One high-end local hidden intelligence point"
      }
      Provide 3 options for each category. Use REAL data from search results.`;
      
      const messages = [{ role: 'user' as const, content: prompt, timestamp: Date.now() }];
      const intelligenceReport = await chatWithOdyAi(messages);

      const tripData = {
        userId: user.uid,
        destination: data.destination,
        accommodation: data.accommodation,
        activities: [data.activity],
        dates: data.dates || 'Flexible Window',
        budget: data.budget,
        intelligenceReport, 
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      if (auth.currentUser) {
        await addDoc(collection(db, 'trips'), { 
          ...tripData, 
          createdAt: serverTimestamp() 
        });
      }

      clearInterval(statusInterval);
      onComplete(tripData);
    } catch (error) {
      clearInterval(statusInterval);
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.CREATE, 'trips');
      } else {
        console.error("Submission failed:", error);
        onComplete();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { title: "Where to?", icon: GlobeIcon, key: 'destination', placeholder: 'Select via globe or type...', type: 'destination' },
    { title: "Spend Level", icon: Banknote, key: 'budget', type: 'budget' },
    { title: "When to travel?", icon: Clock, key: 'dates', type: 'dates' },
    { title: "Where to stay?", icon: Home, key: 'accommodation', placeholder: 'Elite Boutique, Aman, Private Villa...', type: 'text' },
    { title: "What to do?", icon: Activity, key: 'activity', placeholder: 'Artisan exploration, Hidden gastronomy...', type: 'text' },
  ];

  const current = steps[step - 1];

  const handleGlobeSelect = (location: string) => {
    setData(prev => ({ ...prev, destination: location }));
  };

  const handleCalendarSelect = (dates: string) => {
    setData(prev => ({ ...prev, dates }));
    handleNext();
  };

  const handleOpenDates = () => {
    setData(prev => ({ ...prev, dates: 'Aura Flexible Strategy' }));
    handleNext();
  };

  return (
    <div className="flex flex-col h-full bg-dark text-white relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-30">
         <div className="accent-sphere sphere-1" />
         <div className="accent-sphere sphere-2" />
      </div>

      <header className="p-8 flex justify-between items-center relative z-20">
        <button onClick={onCancel} className="text-[10px] uppercase font-bold text-white/40 tracking-widest hover:text-white transition-colors">Cancel</button>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1 w-6 rounded-full transition-all duration-500 ${i <= step ? 'bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'bg-white/10'}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 overflow-y-auto no-scrollbar py-12">
        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            className="w-full max-w-xl space-y-10"
          >
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 glass-panel mx-auto flex items-center justify-center rounded-2xl text-gold border-white/20! shadow-inner">
                <current.icon size={30} />
              </div>
              <h2 className="text-4xl font-serif italic font-bold tracking-tight">{current.title}</h2>
            </div>

            <div className="space-y-8">
              {current.type === 'destination' ? (
                <div className="space-y-10 flex flex-col items-center min-h-[440px]">
                  <Globe onSelect={handleGlobeSelect} />
                  <div className="w-full space-y-6">
                    <input 
                      autoFocus
                      value={data.destination}
                      onChange={(e) => setData({ ...data, destination: e.target.value })}
                      placeholder={current.placeholder}
                      className="w-full bg-transparent border-b-2 border-white/10 py-4 text-2xl font-light text-center focus:border-gold outline-none transition-all placeholder:text-white/5 uppercase tracking-widest"
                    />
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Tokyo', 'Paris', 'New York', 'Dubai', 'Sydney'].map(city => (
                        <button 
                          key={city}
                          onClick={() => setData({...data, destination: city})}
                          className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] uppercase font-black tracking-widest text-white/40 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : current.type === 'dates' ? (
                <div className="flex justify-center min-h-[440px]">
                  <LuxuryCalendar onSelect={handleCalendarSelect} onOpenDates={handleOpenDates} />
                </div>
              ) : current.type === 'budget' ? (
                <div className="flex flex-col items-center gap-8 min-h-[440px] justify-center">
                  <div className="flex flex-wrap justify-center gap-4">
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
                  <p className="text-[10px] text-white/40 italic font-medium uppercase tracking-widest shadow-text">
                    Strategy: {["Economic Efficiency", "Standard Luxury", "Premium Selection", "Top-Tier Opulence", "Cost-No-Object"][data.budget - 1]}
                  </p>
                </div>
              ) : (
                <div className="min-h-[440px] flex items-center">
                  <input 
                    autoFocus
                    value={(data as any)[current.key]}
                    onChange={(e) => setData({ ...data, [current.key]: e.target.value })}
                    placeholder={current.placeholder}
                    className="w-full bg-transparent border-b-2 border-white/10 py-6 text-3xl font-light text-center focus:border-gold outline-none transition-all placeholder:text-white/5"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="w-full max-w-xl px-4 mt-8 h-20 flex items-start">
          <AnimatePresence mode="wait">
            {current.type !== 'dates' && (
              <motion.button
                key="next-button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={handleNext}
                disabled={(!(data as any)[current.key] && current.type !== 'budget') || isLoading}
                className="w-full py-5 bg-white text-dark rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 active:scale-98 hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all disabled:opacity-20 disabled:translate-y-0"
              >
                {isLoading ? 'Booking Intelligence...' : step === 5 ? 'Finalize Itinerary' : 'Next'}
                {!isLoading && <ChevronRight size={16} />}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="p-10 text-center relative z-20">
        <div className="flex flex-col items-center justify-center gap-4">
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 text-gold font-mono text-[10px] uppercase tracking-[0.3em] bg-gold/5 px-6 py-3 rounded-full border border-gold/20 shadow-lg"
            >
              <div className="w-2 h-2 rounded-full bg-gold animate-ping" />
              {loadingStatus || 'OdyAi is calculating your optimal architectural route...'}
            </motion.div>
          )}
          <div className="flex items-center gap-3 text-white/20">
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-[11px] uppercase font-black tracking-[0.4em]">{isLoading ? 'Synthesizing Expedition' : 'OdyAi Intelligence Ready'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

