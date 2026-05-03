import React from 'react';
import { motion } from 'motion/react';
import { Ticket, CreditCard, Receipt, Calendar, CheckCircle2, QrCode, Clock, ExternalLink } from 'lucide-react';

const CONFIRMED_BOOKINGS = [
  {
    type: 'Flight',
    id: 'LX-7729',
    title: 'Private Jet Charter: Global Express',
    date: 'May 10, 2026',
    status: 'Confirmed',
    code: 'AURA-X79',
    price: '$65,400',
    icon: Ticket
  },
  {
    type: 'Stay',
    id: 'RS-922',
    title: 'Aman Tokyo: Otemachi Tower',
    date: 'May 10 - 15, 2026',
    status: 'Booked',
    code: 'AMAN-TK-22',
    price: '$12,500',
    icon: CreditCard
  },
  {
    type: 'Experience',
    id: 'EXP-4',
    title: 'Underground Sushi Masterclass',
    date: 'May 12, 2026',
    status: 'Secured',
    code: 'TSUK-993',
    price: '$1,200',
    icon: Receipt
  }
];

export default function BookingHub() {
  return (
    <div className="p-6 h-full overflow-y-auto no-scrollbar py-10">
      <header className="mb-10">
        <h1 className="font-serif italic text-3xl font-bold mb-1 tracking-tight">Expedition Vault</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest uppercase">Verified Assets & Access Protocols</p>
      </header>

      <div className="space-y-6">
        {CONFIRMED_BOOKINGS.map((booking, idx) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel overflow-hidden border-white/10! bg-gradient-to-br from-white/[0.03] to-transparent p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                  <booking.icon size={20} />
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
                <span className="text-[10px] font-mono text-white/40">{booking.price}</span>
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
        ))}
      </div>

      <div className="mt-12 p-8 border border-white/10 rounded-[32px] bg-white/[0.01] text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-gold/5 flex items-center justify-center text-gold mx-auto border border-gold/10">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Aura Synced Vault</h4>
          <p className="text-[10px] text-white/20 italic leading-relaxed">
            All future receipts and luxury vouchers will be automatically synthesized and secured within this protocol.
          </p>
        </div>
      </div>
    </div>
  );
}
