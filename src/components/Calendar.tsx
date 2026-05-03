import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, isAfter, startOfToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarProps {
  onSelect: (dates: string) => void;
  onOpenDates: () => void;
}

export default function LuxuryCalendar({ onSelect, onOpenDates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDateClick = (day: Date) => {
    if (isAfter(startOfToday(), day) && !isSameDay(startOfToday(), day)) return;

    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: day, end: null });
    } else {
      if (isAfter(selectedRange.start, day)) {
        setSelectedRange({ start: day, end: selectedRange.start });
      } else {
        setSelectedRange({ start: selectedRange.start, end: day });
      }
      
      // Auto-confirm if range is complete
      const rangeText = `${format(selectedRange.start || day, 'MMM d')} - ${format(day, 'MMM d, yyyy')}`;
      onSelect(rangeText);
    }
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-xl font-serif italic text-white/90">{format(currentMonth, 'MMMM yyyy')}</h3>
      <div className="flex gap-4">
        <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronLeft size={18} /></button>
        <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronRight size={18} /></button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] uppercase font-black tracking-widest text-white/20">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, i) => {
          const isSelected = (selectedRange.start && isSameDay(date, selectedRange.start)) || (selectedRange.end && isSameDay(date, selectedRange.end));
          const isInRange = selectedRange.start && selectedRange.end && isAfter(date, selectedRange.start) && isAfter(selectedRange.end, date);
          const isToday = isSameDay(date, new Date());
          const isDisabled = isAfter(startOfToday(), date) && !isToday;
          const isCurrentMonth = isSameMonth(date, monthStart);

          return (
            <button
              key={i}
              disabled={isDisabled}
              onClick={() => handleDateClick(date)}
              className={`h-10 w-full flex flex-col items-center justify-center rounded-lg text-xs transition-all relative ${
                !isCurrentMonth ? 'text-white/5' : isDisabled ? 'text-white/10 cursor-not-allowed' : 'text-white/60 hover:bg-white/10'
              } ${isSelected ? 'bg-gold! text-dark! font-bold scale-110 z-10' : ''} ${isInRange ? 'bg-gold/10 text-gold' : ''}`}
            >
              {format(date, 'd')}
              {isToday && !isSelected && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-gold/40" />}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full glass-panel p-6 border-white/10!">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3">
        <button 
          onClick={onOpenDates}
          className="w-full py-3 rounded-xl border border-gold/40 text-[10px] uppercase font-black tracking-widest text-gold hover:bg-gold/5 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles size={14} />
          Leave Window Open (Flexible)
        </button>
      </div>
    </div>
  );
}
