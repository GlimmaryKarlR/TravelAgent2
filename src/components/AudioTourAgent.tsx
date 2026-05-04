import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipForward, SkipBack, Globe, 
  MapPin, Clock, History, X, Volume2, Shield
} from 'lucide-react';
import { TourContent, generateTourContent } from '../services/tourService';

interface AudioTourAgentProps {
  location: string;
  activity: string;
  onClose: () => void;
}

export default function AudioTourAgent({ location, activity, onClose }: AudioTourAgentProps) {
  const [content, setContent] = useState<TourContent | null>(null);
  const [activeSegmentIdx, setActiveSegmentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function initTour() {
      const tourContent = await generateTourContent(location, activity);
      setContent(tourContent);
      setLoading(false);
      
      // Request GPS
      if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
          (pos) => setUserLocation(pos),
          (err) => console.error("GPS error:", err),
          { enableHighAccuracy: true }
        );
      }
    }
    initTour();
  }, [location, activity]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setVoiceActive(!isPlaying);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-dark/95 backdrop-blur-xl flex flex-col items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-24 h-24 rounded-full border-2 border-gold/20 flex items-center justify-center mb-6"
        >
          <Globe className="text-gold animate-pulse" size={40} />
        </motion.div>
        <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Historical Protocol...</p>
      </div>
    );
  }

  const activeSegment = content?.segments[activeSegmentIdx];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-[100] bg-dark text-white flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20">
              <Globe size={18} className="text-gold" />
            </div>
            <div>
              <h2 className="text-[12px] font-black uppercase tracking-widest text-gold">Audio Expedition</h2>
              <p className="text-[10px] text-white/40">{activity} • {location}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {/* Visual Grounding */}
          <div className="relative aspect-video rounded-2xl overflow-hidden glass-panel border-white/10">
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
              <motion.div 
                animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-[150px] font-serif italic opacity-5 select-none"
              >
                {activeSegment?.title[0]}
              </motion.div>
            </div>
            
            <div className="absolute bottom-6 left-6 z-20">
              <motion.div 
                key={activeSegmentIdx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-1"
              >
                <div className="flex items-center gap-2 text-gold">
                  <MapPin size={10} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Current Stop</span>
                </div>
                <h3 className="text-2xl font-serif italic font-bold">{activeSegment?.title}</h3>
              </motion.div>
            </div>
          </div>

          {/* Narrative */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/30">
                  <Volume2 size={14} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Narration</span>
                </div>
                <p className="text-lg text-white/80 leading-relaxed font-light">
                  {isPlaying ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {activeSegment?.description}
                    </motion.span>
                  ) : (
                    <span className="text-white/20 italic">Tap play to begin audio transmission...</span>
                  )}
                </p>
              </div>

              {activeSegment?.historicalFact && (
                <div className="p-6 rounded-xl bg-gold/5 border border-gold/10 space-y-3">
                  <div className="flex items-center gap-2 text-gold">
                    <History size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Expedition Fragment</span>
                  </div>
                  <p className="text-sm font-medium text-gold/80 italic">"{activeSegment.historicalFact}"</p>
                </div>
              )}
            </div>

            {/* Telemetry Panel */}
            <div className="space-y-4">
              <div className="glass-panel p-5 space-y-4 border-white/5!">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Telemetry</h4>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2 text-white/60">
                    <Clock size={12} />
                    <span className="text-[10px]">Segment Time</span>
                  </div>
                  <span className="text-[10px] font-medium text-gold">{activeSegment?.estimatedDuration}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2 text-white/60">
                    <Shield size={12} />
                    <span className="text-[10px]">GPS Lock</span>
                  </div>
                  <span className={`text-[10px] font-medium ${userLocation ? 'text-green-400' : 'text-red-400'}`}>
                    {userLocation ? 'Active' : 'Unlocking...'}
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest mb-2">Next Objective</p>
                  <p className="text-[10px] text-white/60 italic leading-snug">{activeSegment?.navigationTip}</p>
                </div>
              </div>

              <div className="glass-panel p-4 flex items-center gap-3 border-white/5!">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Real-time Grounding Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="p-8 border-t border-white/5 bg-white/2 backdrop-blur-md">
          <div className="max-w-xl mx-auto flex flex-col items-center gap-6">
            {/* Progress Bar (Simulated) */}
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                animate={{ width: isPlaying ? "100%" : "30%" }}
                transition={{ duration: 30, ease: "linear" }}
                className="h-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
               />
            </div>

            <div className="flex items-center gap-12 text-white/60">
              <button 
                onClick={() => setActiveSegmentIdx(Math.max(0, activeSegmentIdx - 1))}
                className="hover:text-gold transition-colors"
                disabled={activeSegmentIdx === 0}
              >
                <SkipBack size={24} />
              </button>
              <button 
                onClick={togglePlay}
                className="w-20 h-20 rounded-full bg-gold text-dark flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:scale-110 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
              </button>
              <button 
                onClick={() => setActiveSegmentIdx(Math.min((content?.segments.length || 1) - 1, activeSegmentIdx + 1))}
                className="hover:text-gold transition-colors"
                disabled={activeSegmentIdx === (content?.segments.length || 1) - 1}
              >
                <SkipForward size={24} />
              </button>
            </div>

            <div className="flex gap-1">
              {[...Array(content?.segments.length || 0)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeSegmentIdx ? 'w-4 bg-gold' : 'bg-white/20'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
