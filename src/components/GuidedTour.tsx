import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Mic, MicOff, Volume2, VolumeX, X, Play, Pause, ChevronRight, GpsFixed, Sparkles, Compass } from 'lucide-react';

interface PointOfInterest {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  narrative: string;
}

const DEMO_POI: PointOfInterest[] = [
  {
    id: '1',
    name: 'Galleria Vittorio Emanuele II',
    description: 'The world\'s oldest active shopping mall.',
    lat: 45.465,
    lng: 9.190,
    narrative: "Welcome, Elite. You are standing within the 'Living Room of Milan'. Look up at the cast-iron dome—a marvel of 19th-century engineering. Aura has secured a viewing of the central mosaic for you."
  },
  {
    id: '2',
    name: 'Duomo di Milano',
    description: 'The iconic Cathedral of Milan.',
    lat: 45.464,
    lng: 9.191,
    narrative: "Ahead lies the Duomo. Notice the 3,400 statues. Aura recommends the rooftop terrace at sunset for optimal clarity and privacy."
  },
  {
    id: '3',
    name: 'Teatro alla Scala',
    description: 'One of the most famous opera houses in the world.',
    lat: 45.467,
    lng: 9.189,
    narrative: "To your right, La Scala. The acoustics here are tuned for legends. Your private box is confirmed for this evening's performance."
  }
];

export default function GuidedTour({ onClose }: { onClose: () => void }) {
  const [activePoiIndex, setActivePoiIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioWaves, setIsAudioWaves] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [location, setLocation] = useState({ lat: 45.465, lng: 9.190 });
  const [isTourActive, setIsTourActive] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTourActive) {
      interval = setInterval(() => {
        setPulse(p => (p + 1) % 100);
        // Simulate minor location drift
        setLocation(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.0001,
          lng: prev.lng + (Math.random() - 0.5) * 0.0001
        }));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isTourActive]);

  const activePoi = DEMO_POI[activePoiIndex];

  const toggleTour = () => {
    setIsTourActive(!isTourActive);
    if (!isTourActive) {
      handleSpeech();
    }
  };

  const handleSpeech = () => {
    setIsSpeaking(true);
    setIsAudioWaves(true);
    setTimeout(() => {
      setIsSpeaking(false);
      setIsAudioWaves(false);
    }, 8000);
  };

  const nextPoi = () => {
    setActivePoiIndex((prev) => (prev + 1) % DEMO_POI.length);
    handleSpeech();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-dark/95 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-gradient-to-b from-dark to-transparent">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-1">Aura Live Guidance</h2>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-white/40 font-mono">GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </header>

      {/* Main Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Radar Map Simulation */}
        <div className="relative w-80 h-80 flex items-center justify-center">
          <div className="absolute inset-0 border border-white/5 rounded-full" />
          <div className="absolute inset-10 border border-white/5 rounded-full" />
          <div className="absolute inset-20 border border-white/5 rounded-full" />
          
          {/* Scanning Line */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-l border-gold/20 rounded-full"
            style={{ originX: '50%', originY: '50%' }}
          />

          {/* User Location */}
          <div className="relative z-10 w-4 h-4 bg-gold rounded-full shadow-[0_0_20px_rgba(212,175,55,0.8)]">
            <div className="absolute inset-0 bg-gold rounded-full animate-ping opacity-20" />
          </div>

          {/* POIs */}
          {DEMO_POI.map((poi, i) => {
            const angle = (i * 120) * (Math.PI / 180);
            const radius = 100;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <motion.div
                key={poi.id}
                className={`absolute w-3 h-3 rounded-full flex items-center justify-center ${activePoiIndex === i ? 'bg-white' : 'bg-white/10'}`}
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                {activePoiIndex === i && <div className="absolute inset-0 bg-white rounded-full animate-ping" />}
              </motion.div>
            );
          })}
        </div>

        {/* Narrative Box */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activePoiIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-12 text-center space-y-4 max-w-sm"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Compass size={14} className="text-gold" />
              <span className="text-[10px] uppercase font-black tracking-widest text-white/40">{activePoi.name}</span>
            </div>
            <p className="text-lg font-serif italic text-white/90 leading-snug">
              {isSpeaking ? (
                <span className="whitespace-pre-wrap">{activePoi.narrative}</span>
              ) : (
                <span className="text-white/20 italic">Aura is analyzing your surroundings...</span>
              )}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Audio Visualizer */}
        <div className="mt-8 flex items-end gap-1 h-12">
          {isAudioWaves && Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-gold rounded-full"
              animate={{ height: [4, Math.random() * 40 + 8, 4] }}
              transition={{ 
                duration: 0.5, 
                repeat: Infinity, 
                delay: i * 0.05 
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <footer className="p-10 bg-gradient-to-t from-dark to-transparent">
        <div className="max-w-md mx-auto grid grid-cols-3 items-center gap-8">
          <button 
            onClick={() => setIsListening(!isListening)}
            className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${isListening ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-white/40 hover:text-white'}`}
          >
            {isListening ? <Mic size={24} /> : <MicOff size={24} />}
            <span className="text-[8px] uppercase font-black tracking-tighter">Listen</span>
          </button>

          <button 
            onClick={toggleTour}
            className="w-20 h-20 rounded-full bg-white text-dark flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all mx-auto"
          >
            {isTourActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>

          <button 
            onClick={nextPoi}
            className="p-4 rounded-2xl bg-white/5 text-white/40 hover:text-white flex flex-col items-center gap-2 transition-all"
          >
            <ChevronRight size={24} />
            <span className="text-[8px] uppercase font-black tracking-tighter">Next POI</span>
          </button>
        </div>
        
        <div className="mt-8 flex justify-center">
          <div className="px-6 py-2 rounded-full border border-white/5 bg-white/[0.02] flex items-center gap-4 text-[9px] uppercase font-black tracking-widest text-white/20">
            <Volume2 size={12} />
            <span>AI Voice: Aura v4.2 Elite</span>
            <div className="h-4 w-[1px] bg-white/10" />
            <span>Mode: Adaptive Narrative</span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
