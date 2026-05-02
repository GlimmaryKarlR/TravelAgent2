import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Map, Shield, Globe, Menu, X, Plus } from 'lucide-react';
import AuraConcierge from './components/AuraConcierge';
import ItineraryHub from './components/ItineraryHub';
import SafetyCenter from './components/SafetyCenter';
import Vault from './components/Vault';
import Login from './components/Login';
import NewTripOnboarding from './components/NewTripOnboarding';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

type Tab = 'concierge' | 'itinerary' | 'safety' | 'vault';

export default function App() {
  const [user, setUser] = useState<User | any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('concierge');
  const [tier, setTier] = useState<'basic' | 'elite'>('elite');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAlertActive, setIsAlertActive] = useState(false);

  const handleDemoLogin = () => {
    setUser({
      uid: 'demo-user-123',
      displayName: 'Elite Traveler',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      email: 'elite@nomad.com'
    });
  };

  useEffect(() => {
    const handleOnboarding = () => setShowOnboarding(true);
    window.addEventListener('START_ONBOARDING', handleOnboarding);
    return () => window.removeEventListener('START_ONBOARDING', handleOnboarding);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Dynamic Alert (Simulation)
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setIsAlertActive(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="h-screen bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="text-gold animate-pulse" size={32} />
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/40">Synchronizing Vantage...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onDemoLogin={handleDemoLogin} />;
  }

  if (showOnboarding) {
    return (
      <NewTripOnboarding 
        onComplete={() => {
          setShowOnboarding(false);
          setActiveTab('itinerary');
        }}
        onCancel={() => setShowOnboarding(false)}
      />
    );
  }

  const tabs = [
    { id: 'concierge', label: 'Aura', icon: Sparkles },
    { id: 'itinerary', label: 'Journey', icon: Map },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'vault', label: 'Vault', icon: Globe },
  ];

  return (
    <div className="flex flex-col h-screen bg-dark text-white overflow-hidden font-sans relative">
      {/* Mesh Background */}
      <div className="mesh-bg">
        <div className="accent-sphere sphere-1"></div>
        <div className="accent-sphere sphere-2"></div>
      </div>

      {/* Top Banner (Conditional Alert) */}
      <AnimatePresence>
        {isAlertActive && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gold text-dark px-6 py-2.5 flex items-center justify-between z-50 overflow-hidden shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Sparkles size={14} className="animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em]">Aura Update: Weather shifts in Tokyo. Rescheduling activities.</p>
            </div>
            <button onClick={() => setIsAlertActive(false)} className="hover:opacity-70 transition-opacity">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Luxury Header */}
      <header className="px-8 pt-8 pb-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter italic leading-none font-serif">NOMAD.</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Elite Travel Intelligence</p>
          </div>
          <div className="h-8 w-[1px] bg-white/20 mx-2"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold opacity-40 uppercase tracking-wider">Welcome</span>
            <span className="text-sm font-semibold tracking-tight">{user.displayName?.split(' ')[0] || 'Traveler'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowOnboarding(true)}
            className="w-10 h-10 glass-panel flex items-center justify-center rounded-xl border-white/20! text-gold hover:bg-gold/10 transition-colors"
          >
            <Plus size={20} />
          </button>
          <div className="w-10 h-10 glass-panel flex items-center justify-center rounded-full border-white/20!">
            <img src={user.photoURL || ''} alt="Profile" className="w-7 h-7 rounded-full shadow-inner" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden h-full z-10 px-4">
        <div className="h-full glass-panel overflow-hidden border-white/5!">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full w-full absolute inset-0"
            >
              {activeTab === 'concierge' && <AuraConcierge tier={tier} />}
              {activeTab === 'itinerary' && <ItineraryHub />}
              {activeTab === 'safety' && <SafetyCenter />}
              {activeTab === 'vault' && <Vault tier={tier} setTier={setTier} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Luxury Bottom Navigation */}
      <nav className="pb-safe pt-4 px-8 z-20">
        <div className="glass-panel p-2 flex justify-between items-center max-w-lg mx-auto border-white/5!">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all relative ${
                  isActive ? 'text-white' : 'text-white/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white/10 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon size={20} className={isActive ? 'text-gold' : ''} />
                <span className={`text-[9px] uppercase tracking-widest font-bold transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      <div className="h-6 shrink-0" /> {/* Bottom spacing */}
    </div>
  );
}
