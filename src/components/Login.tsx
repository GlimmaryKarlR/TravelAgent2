import React from 'react';
import { motion } from 'motion/react';
import { Globe, Sparkles, LogIn } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../lib/firebase';

export default function Login({ onDemoLogin }: { onDemoLogin: () => void }) {
  const login = async (provider: any) => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("Domain unauthorized in Firebase. Please use 'Demo Access' for now or add this domain to your Firebase Console.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-40">
         <div className="accent-sphere sphere-1" />
         <div className="accent-sphere sphere-2" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 space-y-12 max-w-sm"
      >
        <div className="space-y-4">
          <div className="w-20 h-20 glass-panel mx-auto flex items-center justify-center rounded-3xl border-white/20! shadow-2xl">
            <Globe size={40} className="text-gold animate-pulse" />
          </div>
          <h1 className="text-5xl font-serif italic font-bold tracking-tighter">VANTAGE.</h1>
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/50">Elite Travel Intelligence</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => login(googleProvider)}
            className="w-full py-4 glass-panel border-white/20! flex items-center justify-center gap-3 hover:bg-white/10 transition-all font-bold text-sm tracking-tight"
          >
            <LogIn size={18} className="text-gold" />
            Continue with Google
          </button>
          
          <button 
            onClick={() => login(appleProvider)}
            className="w-full py-4 glass-panel border-white/20! flex items-center justify-center gap-3 hover:bg-white/10 transition-all font-bold text-sm tracking-tight"
          >
            <LogIn size={18} />
            Continue with Apple
          </button>

          <div className="pt-4">
            <button 
              onClick={onDemoLogin}
              className="text-[10px] uppercase font-bold text-gold/60 tracking-widest hover:text-gold transition-colors border-b border-gold/20 pb-0.5"
            >
              Enter via Demo (Bypass)
            </button>
          </div>
        </div>

        <p className="text-[10px] text-white/30 uppercase tracking-[0.1em] leading-relaxed">
          Access the global private network.<br />
          Biometric terms and conditions apply.
        </p>
      </motion.div>
    </div>
  );
}
