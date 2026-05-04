import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, CreditCard, Receipt, Calendar, CheckCircle2, QrCode, Clock, ExternalLink, Hotel, Plane, Car, Sparkles, ShoppingBag } from 'lucide-react';
import { collection, onSnapshot, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface Booking {
  id: string;
  type: string;
  title: string;
  date: string;
  status: string;
  code: string;
  price: string | number;
  userId?: string;
  provider?: string;
  details?: string;
}

type TabType = 'all' | 'stay' | 'flight' | 'experience' | 'transport';

export default function BookingHub() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const handleClearBookings = async () => {
    if (!auth.currentUser || !window.confirm("This will clear all verified assets in your vault. Proceed with reset?")) return;
    
    setClearing(true);
    try {
      const q = query(collection(db, 'bookings'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'bookings', d.id)));
      await Promise.all(deletePromises);
    } catch (err) {
      console.error("Failed to clear vault:", err);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Since bookings are nested under trips in our schema, we'd normally fetch all trips first.
    // For this simulation, we'll fetch from a top-level 'bookings' collection if it exists, 
    // or simulate based on the user's active trips.
    // To simplify for the "Dev Simulation", I'll listen to a global bookings collection filtered by userId
    const q = query(collection(db, 'bookings'), where('userId', '==', auth.currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      setBookings(bData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true;
    return b.type.toLowerCase().includes(activeTab.toLowerCase());
  });

  const tabs = [
    { id: 'all', label: 'All Assets', icon: ShoppingBag },
    { id: 'stay', label: 'Hotels', icon: Hotel },
    { id: 'flight', label: 'Flights', icon: Plane },
    { id: 'experience', label: 'Events', icon: Sparkles },
    { id: 'transport', label: 'Rental Cars', icon: Car },
  ];

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('hotel') || t.includes('stay')) return Hotel;
    if (t.includes('flight')) return Plane;
    if (t.includes('car') || t.includes('transport')) return Car;
    return Ticket;
  };

  return (
    <div className="p-6 h-full overflow-y-auto no-scrollbar py-10">
      <header className="mb-8">
        <h1 className="font-serif italic text-3xl font-bold mb-1 tracking-tight">Expedition Vault</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Verified Assets & Access Protocols</p>
      </header>

      {/* Categories */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] uppercase font-black tracking-widest transition-all shrink-0 border ${
              activeTab === tab.id 
                ? 'bg-gold text-dark border-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredBookings.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center glass-panel border-dashed border-white/10"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Receipt className="text-white/20" size={20} />
              </div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">No active protocols in this sector</p>
            </motion.div>
          ) : (
            <>
              {filteredBookings.map((booking, idx) => {
                const Icon = getIcon(booking.type);
                return (
                  <motion.div
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-panel overflow-hidden border-white/10! bg-gradient-to-br from-white/[0.03] to-transparent p-6 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] uppercase font-black tracking-widest text-gold/60">{booking.type}</span>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-[8px] uppercase font-black tracking-widest text-white/40">{booking.id}</span>
                          </div>
                          <h3 className="text-sm font-bold tracking-tight">{booking.title}</h3>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest border border-green-500/20">
                          {booking.status}
                        </span>
                        <span className="text-[10px] font-mono text-white/40">
                          {typeof booking.price === 'number' ? `$${booking.price.toLocaleString()}` : booking.price}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                      <div className="space-y-1">
                        <p className="text-[8px] uppercase font-black text-white/20 tracking-widest">Schedule</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/80">
                          <Calendar size={10} className="text-gold" />
                          {booking.date}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] uppercase font-black text-white/20 tracking-widest">Access Key</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gold">
                          <QrCode size={10} />
                          {booking.code}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button className="text-[9px] uppercase font-black tracking-[0.2em] text-white/40 hover:text-white transition-colors flex items-center gap-2">
                        Download Receipt <Receipt size={10} />
                      </button>
                      <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] uppercase font-black tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                        External Portal <ExternalLink size={10} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              <div className="pt-8">
                <button 
                  onClick={handleClearBookings}
                  disabled={clearing}
                  className="w-full py-4 border border-white/5 bg-white/[0.02] text-white/20 rounded-xl text-[8px] font-black uppercase tracking-[0.4em] hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20 transition-all"
                >
                  {clearing ? 'Wiping Secure Assets...' : 'Initialize Vault Reset'}
                </button>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
