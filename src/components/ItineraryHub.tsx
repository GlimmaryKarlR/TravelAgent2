import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Plane, MapPin, Clock, Info, AlertTriangle, ShieldCheck, CheckCircle2, Ticket, Landmark, Sparkles, Calendar, ChevronRight, Navigation, Map as MapIcon } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { ItineraryItem } from '../types';
import GuidedTour from './GuidedTour';
import ItineraryMap from './ItineraryMap';

export default function ItineraryHub({ 
  demoTrips = [], 
  onSyncTrip 
}: { 
  demoTrips?: any[],
  onSyncTrip?: (id: string, data: any) => void
}) {
  const [trips, setTrips] = useState<any[]>(demoTrips);
  const [loading, setLoading] = useState(!demoTrips.length);

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
  const [refiningBooking, setRefiningBooking] = useState<{ id: string, type: 'flight' | 'hotel' | 'tour', data: any } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showTour, setShowTour] = useState(false);
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // New Selection States
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<number | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);
  const [selectedExperiences, setSelectedExperiences] = useState<number[]>([]);

  // Dynamic Synthesis Logic
  const getSynthesizedSchedule = () => {
    if (!intelligence || !intelligence.schedule) return [];
    
    const schedule = JSON.parse(JSON.stringify(intelligence.schedule));
    
    // Day 1 Logic: Flight -> Hotel Priority
    if (schedule[0]) {
      let day1Items = [...schedule[0].items];
      
      // Inject flight if selected
      if (selectedFlight !== null) {
        const flight = intelligence.flights[selectedFlight];
        const flightItem = {
          time: flight.departureTime || "Arrival",
          activity: `Arrive via ${flight.carrier} ${flight.option}`,
          location: flight.arrivalAirport || "International Airport",
          status: "booked",
          type: "flight",
          personalizedNote: `Flight protocol established for ${flight.date || 'your arrival'}. Expedited immigration protocol active. Your concierge will meet you at the bridge.`,
          lat: day1Items[0]?.lat || 0,
          lng: day1Items[0]?.lng || 0
        };
        day1Items = day1Items.filter(i => i.type !== 'flight');
        day1Items.unshift(flightItem);
      }

      // Inject hotel check-in immediately after flight
      if (selectedHotel !== null) {
        const hotel = intelligence.hotels[selectedHotel];
        const hotelItem = {
          time: "Check-in",
          activity: `Elite Check-in: ${hotel.name}`,
          location: hotel.name,
          status: "booked",
          type: "accommodation",
          transitSummary: "20 min Private Chauffeur from Arrivals",
          personalizedNote: "As you are arriving early, we have secured a priority suite refresh. Rest before your first event.",
          selectionReason: "Strategy: Centralizing base at this location optimizes all subsequent museum and dining transit.",
          lat: day1Items[0]?.lat || 0,
          lng: day1Items[0]?.lng || 0
        };
        
        // Remove existing accommodation items
        day1Items = day1Items.filter(i => i.type !== 'accommodation');
        
        const landingIdx = day1Items.findIndex(i => i.type === 'flight' || i.activity.toLowerCase().includes('arrive'));
        if (landingIdx !== -1) {
          day1Items.splice(landingIdx + 1, 0, hotelItem);
        } else {
          day1Items.unshift(hotelItem);
        }
      }
      
      schedule[0].items = day1Items;
    }

    // Filter Experiences and Final Load Balancing
    const balanced = schedule.map((day: any) => ({
      ...day,
      items: day.items.filter((item: any) => {
        if (['flight', 'accommodation', 'dining', 'transit'].includes(item.type)) return true;
        const isSelectedTour = intelligence.tours?.some((t: any, idx: number) => 
          selectedExperiences.includes(idx) && 
          (t.name.toLowerCase().includes(item.activity.toLowerCase()) || item.activity.toLowerCase().includes(t.name.toLowerCase()))
        );
        if (selectedExperiences.length === 0) return true;
        return isSelectedTour;
      })
    }));

    // Post-Processing: Ensure no dead days
    return balanced.map((day: any, idx: number) => {
      if (day.items.length === 0) {
        return {
          ...day,
          items: [{
            time: "11:00",
            activity: "Curated Leisure & Local Discovery",
            location: intelligence.destination || "Vibrant District",
            status: "proposed",
            type: "activity",
            personalizedNote: "We've left this window open for spontaneous discovery. Your concierge can arrange last-minute gallery access or private shopping.",
            selectionReason: "Protocol: Rest and local integration is prioritized between exclusive events."
          }]
        };
      }
      return day;
    });
  };

  const currentSchedule = getSynthesizedSchedule();

  const startBooking = (id: string, type: 'flight' | 'hotel' | 'tour', data: any) => {
    // If trip dates are generic, ask for refinement
    if (!latestTrip.dates || latestTrip.dates.includes('OdyAi') || latestTrip.dates.includes('Active')) {
      setRefiningBooking({ id, type, data });
      return;
    }
    handleBooking(id);
  };

  const handleBooking = async (id: string, date?: string) => {
    setBookingStatus(prev => ({ ...prev, [id]: 'authorizing' }));
    setRefiningBooking(null);
    
    if (date && latestTrip && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'trips', latestTrip.id), {
          dates: date,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to update trip dates", e);
      }
    }

    if (id === 'global-reserve' && latestTrip) {
      const confirmedSchedule = getSynthesizedSchedule();
      const updatedTrip = { ...latestTrip, confirmedSchedule, status: 'Confirmed' };
      
      // Update local state immediately
      setTrips(prev => prev.map(t => (t.id === latestTrip.id || t.createdAt === latestTrip.createdAt) ? updatedTrip : t));

      if (onSyncTrip) {
        onSyncTrip(latestTrip.id || latestTrip.createdAt, { 
          confirmedSchedule,
          status: 'Confirmed'
        });
      }

      if (auth.currentUser && latestTrip.id) {
        try {
          await updateDoc(doc(db, 'trips', latestTrip.id), {
            confirmedSchedule,
            status: 'Confirmed',
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Failed to sync confirmed schedule", e);
        }
      }
    }

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
    // Clean and split keywords to ensure they are comma separated for LoremFlickr (OR behavior)
    const tags = (keyword || 'luxury,resort')
      .split(/[\s,]+/)
      .filter(t => t.length > 0)
      .map(t => t.trim().toLowerCase())
      .join(',');
    
    const seed = keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000;
    const randomOffset = typeof random === 'number' ? random : random.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
    
    return `https://loremflickr.com/${width}/${height}/${tags}?lock=${seed + randomOffset}`;
  };

  return (
    <>
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
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
                  {latestTrip.dates || 'Active Expedition'} • Status: {latestTrip.status}
                </p>
                {selectedPackage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gold/10 text-gold text-[7px] font-black uppercase tracking-widest border border-gold/20 backdrop-blur-md"
                  >
                    <Sparkles size={8} /> Spatial Optimization Active
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 space-y-10">
            {intelligence ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                {/* Proposed Packages */}
                {intelligence.packages && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white/40 border-b border-white/5 pb-2">
                      <Sparkles size={14} className="text-gold" />
                      <span className="text-[9px] uppercase font-black tracking-widest">Select Proposed Package</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {intelligence.packages.map((pkg: any) => (
                        <button 
                          key={pkg.id}
                          onClick={() => setSelectedPackage(pkg.id)}
                          className={`glass-panel p-5 text-left transition-all group relative overflow-hidden ${
                            selectedPackage === pkg.id 
                              ? 'border-gold/50 bg-gold/5 shadow-[0_0_30px_rgba(212,175,55,0.1)]' 
                              : 'border-white/10! hover:border-gold/30 hover:bg-gold/5'
                          }`}
                        >
                          <div className="relative z-10 space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className={`text-sm font-bold tracking-tight transition-colors ${selectedPackage === pkg.id ? 'text-gold' : 'text-white'}`}>{pkg.name}</h4>
                              {selectedPackage === pkg.id && (
                                <span className="text-[7px] font-black bg-gold text-dark px-1.5 py-0.5 rounded uppercase tracking-widest">Selected</span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/40 leading-relaxed italic line-clamp-2">{pkg.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {pkg.highlights?.map((h: string, i: number) => (
                                <span key={i} className="text-[7px] uppercase font-black tracking-widest px-2 py-1 rounded bg-white/5 text-white/30">
                                  {h}
                                </span>
                              ))}
                            </div>
                            <div className={`pt-2 text-[8px] uppercase font-black tracking-widest text-gold transition-opacity ${selectedPackage === pkg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              {selectedPackage === pkg.id ? 'Protocol Active' : 'Select Protocol & See Itinerary Below →'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-white/20 italic text-center px-8 leading-relaxed">
                      "Choose your preferred experience protocol. Selecting a package will refine the daily schedule below with optimized transit and personalized timing."
                    </p>
                  </div>
                )}

                {/* Flights */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white/40 border-b border-white/5 pb-2">
                    <Plane size={14} />
                    <span className="text-[9px] uppercase font-black tracking-widest">Flight Protocols</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {intelligence.flights?.map((f: any, i: number) => (
                      <div key={i} className={`glass-panel p-5 space-y-4 transition-colors ${selectedFlight === i ? 'border-gold/30 bg-gold/5' : 'border-white/10! hover:bg-white/[0.03]'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[8px] text-gold uppercase font-black tracking-tighter mb-1">{f.carrier}</p>
                            <h4 className="text-sm font-bold">{f.option}</h4>
                            <div className="flex flex-col gap-1 mt-2">
                              <div className="flex items-center gap-2 text-[10px] text-white/60">
                                <span className="font-mono">{f.departureAirport || 'Origin'}</span>
                                <ChevronRight size={10} className="text-white/20" />
                                <span className="font-mono">{f.arrivalAirport || 'Destination'}</span>
                              </div>
                              <div className="text-[9px] text-white/30 font-medium tracking-tight">
                                {f.date || 'TBD'} • {f.departureTime || 'TBD'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-xs font-mono text-white/40">{f.price}</div>
                             <div className={`text-[7px] font-black uppercase mt-1 ${f.confidence === 'High' ? 'text-green-500' : 'text-amber-500'}`}>
                               Real-Time: {f.confidence}
                             </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => setSelectedFlight(i)}
                            className={`flex-1 py-2.5 rounded-xl text-[9px] uppercase font-black tracking-[0.2em] border transition-all ${
                              selectedFlight === i 
                                ? 'bg-gold text-dark border-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                                : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20'
                            }`}
                          >
                            {selectedFlight === i ? 'Protocol Active' : 'Select Flight'}
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
                    <div key={i} className={`glass-panel overflow-hidden flex flex-col md:flex-row gap-0 items-stretch transition-all ${
                      selectedHotel === i ? 'border-gold/30 bg-gold/5' : 'border-white/10! bg-gradient-to-r from-white/[0.02] to-transparent'
                    }`}>
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
                          <h4 className={`text-xl font-serif italic transition-colors ${selectedHotel === i ? 'text-gold' : 'text-white'}`}>{h.name}</h4>
                          <span className="text-[9px] text-gold font-bold uppercase tracking-widest">{h.price}</span>
                        </div>
                        <p className="text-[10px] text-white/40 italic leading-relaxed">"{h.reason}"</p>
                        <p className="text-[9px] text-white/20 font-mono">{h.details}</p>
                        <div className="pt-4 flex gap-3">
                          <button 
                            onClick={() => setSelectedHotel(i)}
                            className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              selectedHotel === i
                                ? 'bg-gold text-dark shadow-[0_0_30px_rgba(212,175,55,0.2)]'
                                : 'bg-white text-dark hover:bg-white/90'
                            }`}
                          >
                            {selectedHotel === i ? 'Selected Protocol' : 'Select'}
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
                      <div key={i} className={`glass-panel overflow-hidden transition-all group ${
                        selectedExperiences.includes(i) ? 'border-gold/30 bg-gold/5' : 'border-white/10! bg-white/[0.02]'
                      }`}>
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
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setSelectedExperiences(prev => 
                                  prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i]
                                );
                              }}
                              className={`flex-1 py-2 text-[8px] font-bold uppercase tracking-widest rounded-lg transition-all border ${
                                selectedExperiences.includes(i)
                                  ? 'bg-gold text-dark border-gold'
                                  : 'bg-gold/5 text-gold border-gold/20 hover:bg-gold/10'
                              }`}
                            >
                              {selectedExperiences.includes(i) ? 'Added' : 'Add to Journey'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Itinerary */}
                {intelligence.schedule && (
                  <div className="space-y-8 pt-6 border-t border-white/5">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2 text-white/40">
                        <Calendar size={14} className="text-gold" />
                        <span className="text-[9px] uppercase font-black tracking-widest">Proposed Itinerary</span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 items-center w-full">
                        {currentSchedule.map((day: any, idx: number) => (
                          <button 
                            key={idx}
                            onClick={() => setActiveDayIdx(idx)}
                            className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black transition-all ${
                              activeDayIdx === idx 
                                ? 'bg-white text-dark shadow-[0_20px_40px_rgba(255,255,255,0.1)]' 
                                : 'bg-white/5 text-white/30 border border-white/10 hover:border-white/30'
                            }`}
                          >
                            Day {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="glass-panel p-2 border-white/10!">
                        <ItineraryMap items={currentSchedule[activeDayIdx]?.items || []} />
                      </div>

                      <div className="space-y-6">
                        {currentSchedule[activeDayIdx]?.items.map((item: any, i: number) => (
                          <div key={i} className="relative pl-10 group">
                            <div className="absolute left-[13px] top-6 bottom-0 w-[1px] bg-white/5 group-last:hidden" />
                            <div className={`absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-black ${
                              item.status === 'booked' 
                                ? 'bg-gold/20 border-gold/40 text-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]' 
                                : 'bg-white/5 border-white/10 text-white/20'
                            }`}>
                              {i + 1}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black font-mono text-white/30 tracking-widest">{item.time}</span>
                                <span className={`text-[7px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                  item.status === 'booked' ? 'bg-gold/10 text-gold' : 'bg-white/5 text-white/40'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold tracking-tight">{item.activity}</h4>
                              <p className="text-[9px] text-white/40 font-medium italic flex items-center gap-1">
                                <MapPin size={10} /> {item.location}
                              </p>
                              
                              {/* New Rich Details */}
                              <div className="grid grid-cols-1 gap-3 pt-2">
                                {item.transitSummary && (
                                  <div className="flex items-center gap-2 text-[8px] uppercase font-black text-white/20 tracking-widest bg-white/5 p-2 rounded-lg decoration-gold/30">
                                    <Navigation size={10} className="text-gold" />
                                    {item.transitSummary}
                                  </div>
                                )}
                                {item.personalizedNote && (
                                  <div className="text-[10px] text-gold/80 italic leading-relaxed bg-gold/5 p-3 rounded-xl border border-gold/10">
                                    <Sparkles size={10} className="inline mr-2 mb-1" />
                                    {item.personalizedNote}
                                  </div>
                                )}
                                {item.selectionReason && (
                                  <div className="text-[9px] text-white/30 font-medium leading-relaxed">
                                    <Info size={10} className="inline mr-1.5" />
                                    {item.selectionReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Reserve Button at bottom of itinerary */}
                    <div className="pt-10">
                      <button 
                        onClick={() => handleBooking('global-reserve')}
                        className="w-full py-6 bg-white text-dark rounded-[24px] font-black uppercase tracking-[0.4em] text-xs shadow-[0_20px_50px_rgba(212,175,55,0.2)] hover:shadow-[0_20px_80px_rgba(212,175,55,0.4)] hover:-translate-y-1 transition-all group flex flex-col items-center gap-2"
                      >
                        <span className="flex items-center gap-3">
                          {bookingStatus['global-reserve'] === 'confirmed' ? 'Expedition Secured' : 'Reserve & Authorize Intelligence'}
                          {bookingStatus['global-reserve'] !== 'confirmed' && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                        </span>
                        <span className="text-[8px] opacity-40 lowercase tracking-widest font-normal italic">
                          This authorizes OdyAi to utilize your stored vaulted assets for all primary bookings.
                        </span>
                      </button>
                    </div>
                  </div>
                )}

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

            {/* Default protocol if no intelligence yet */}
            {!intelligence && (
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
            ) }
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-6 p-8">
          <div className="w-16 h-16 glass-panel flex items-center justify-center rounded-2xl text-white/10 border-white/10!">
            <Plane size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-serif italic">No Active Expeditions.</h2>
            <p className="text-xs text-white/30 max-w-[200px]">OdyAi is ready to synthesize your next journey.</p>
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
    
    {/* Refinement Modal */}
    <AnimatePresence>
      {refiningBooking && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-dark/80 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel max-w-sm w-full p-8 space-y-8"
          >
            <div className="text-center space-y-2">
              <Calendar size={32} className="mx-auto text-gold" />
              <h3 className="text-xl font-serif italic">Synchronize Schedule</h3>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Select dates for your {refiningBooking.type}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-white/20 tracking-widest px-2">Proposed Dates</label>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-gold transition-colors text-white"
                />
              </div>
              <p className="text-[9px] text-white/30 italic text-center leading-relaxed px-4">
                "OdyAi will automatically scan for optimal inventory and handle all verification protocols."
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setRefiningBooking(null)}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 rounded-xl"
              >
                Abort
              </button>
              <button 
                onClick={() => handleBooking(refiningBooking.id, selectedDate)}
                disabled={!selectedDate}
                className="flex-1 py-4 bg-white text-dark text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/90 disabled:opacity-20"
              >
                Authorize
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showTour && <GuidedTour onClose={() => setShowTour(false)} />}
    </AnimatePresence>
    </>
  );
}
