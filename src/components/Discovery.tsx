import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, MapPin, Globe, Compass, Star } from 'lucide-react';
import { chatWithAura } from '../lib/gemini';

export default function Discovery() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const prompt = `Act as Aura. Suggest 3 'Elite Expeditions' for ultra-high-net-worth travelers. 
      The more remote, expensive, and breathtaking the better. Deep-sea hubs, orbital hotels, or private arctic estates.
      Return JSON:
      {
        "expeditions": [
          {
            "title": "Short poetic title (e.g. 'The Lunar Drift')",
            "destination": "Specific Location (e.g. 'Mare Tranquillitatis' or 'Bhutanese Sky Abbey')",
            "vibe": "What makes it elite (e.g. 'Zero-gravity meditation' or 'Private monks' blessing')",
            "cost": "Est. price like $2,500,000+",
            "imageKeyword": "Unsplash keyword for vivid, ultra-luxury, or remote architecture/landscape"
          }
        ]
      }`;
      const res = await chatWithAura([{ role: 'user', content: prompt, timestamp: Date.now() }]);
      const jsonMatch = res.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         setRecommendations(JSON.parse(jsonMatch[0]).expeditions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const getImageUrl = (keyword: string, width = 800, height = 1000, random = 0) => {
    const cleanKeyword = (keyword || '').replace(/\s+/g, ',');
    return `https://loremflickr.com/${width}/${height}/${cleanKeyword}${cleanKeyword ? ',' : ''}luxury,travel?random=${random}`;
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32">
      <div className="relative h-[60vh] flex items-end p-8 border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=2000&auto=format&fit=crop" 
          alt="World Discovery" 
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-20 space-y-4 max-w-sm">
          <div className="flex items-center gap-2 text-gold">
            <Sparkles size={16} />
            <span className="text-[10px] uppercase font-bold tracking-[0.4em]">Elite Discovery</span>
          </div>
          <h1 className="text-5xl font-serif italic text-white leading-tight">Plan an amazing expedition.</h1>
          <p className="text-sm text-white/40 font-light leading-relaxed">
            Aura tracks the most remote and exclusive destinations globally, reserved for the Vantage network.
          </p>
          <button 
            onClick={() => (window as any).dispatchEvent(new CustomEvent('START_ONBOARDING'))}
            className="flex items-center gap-3 px-8 py-4 bg-white text-dark rounded-full font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-2xl"
          >
            Begin Protocol <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="p-8 space-y-12">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/20 mb-2">Curated for You</h2>
            <p className="text-2xl font-serif italic">Aura's Elite Selection</p>
          </div>
          <button onClick={fetchRecommendations} className="text-[10px] uppercase font-black tracking-widest text-gold/60 border-b border-gold/20 pb-1">Refresh Grid</button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] glass-panel animate-pulse bg-white/5 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatePresence>
              {recommendations.map((exp, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative h-[500px] rounded-[2.5rem] overflow-hidden glass-panel border-white/10! shadow-2xl curse-pointer"
                >
                  <img 
                    src={getImageUrl(exp.imageKeyword || exp.destination, 800, 1000, i)}
                    alt={exp.destination}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent opacity-80" />
                  
                  <div className="absolute inset-0 p-8 flex flex-col justify-end gap-4 transform transition-transform duration-500 group-hover:translate-y-[-10px]">
                    <div className="flex items-center gap-2">
                       <div className="p-1.5 bg-gold/20 rounded-lg text-gold border border-gold/20">
                          <Compass size={14} />
                       </div>
                       <span className="text-[10px] uppercase font-black tracking-[0.2em] text-gold">{exp.cost}</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif italic text-white mb-1">{exp.title}</h3>
                      <p className="flex items-center gap-1.5 text-white/50 text-[10px] uppercase font-bold tracking-widest">
                        <MapPin size={10} /> {exp.destination}
                      </p>
                    </div>
                    <p className="text-[11px] text-white/40 italic leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      "{exp.vibe}"
                    </p>
                    <button 
                      onClick={() => {
                        // In a real app, this would pre-fill onboarding
                        (window as any).dispatchEvent(new CustomEvent('START_ONBOARDING', { detail: exp }));
                      }}
                      className="w-full py-4 mt-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] hover:bg-white text-dark transition-all"
                    >
                      Initialize Expedition
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="p-8 mt-20 text-center space-y-6">
        <Star size={40} className="mx-auto text-gold/20" />
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-xl font-serif italic">Beyond the Map.</h3>
          <p className="text-xs text-white/30 font-light leading-relaxed">
            The Vantage network provides access to private islands, orbital excursions, and deep-sea habs not visible to the public eye.
          </p>
        </div>
      </div>
    </div>
  );
}
