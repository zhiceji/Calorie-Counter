import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface MonthCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function MonthCalendarModal({ isOpen, onClose, selectedDate, onDateSelect }: MonthCalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  });

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 px-4"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[40px] shadow-2xl z-[60] overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <CalendarIcon size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">选择日期</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  {format(currentMonth, 'yyyy年 MMMM', { locale: zhCN })}
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['一', '二', '三', '四', '五', '六', '日'].map((day, i) => (
                  <div key={i} className="text-center py-2">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{day}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateSelect(day)}
                      disabled={!isCurrentMonth}
                      className={cn(
                        "relative aspect-square rounded-2xl flex items-center justify-center transition-all group",
                        !isCurrentMonth && "opacity-0 pointer-events-none",
                        isSelected 
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
                          : isToday 
                            ? "bg-emerald-50 text-emerald-600 font-bold" 
                            : "hover:bg-slate-50 text-slate-700 font-medium"
                      )}
                    >
                      <span className="text-sm font-bold z-10">{format(day, 'd')}</span>
                      {isToday && !isSelected && (
                        <div className="absolute bottom-2 w-1 h-1 bg-emerald-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-50">
                <div className="bg-slate-50 rounded-3xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">当前选择</p>
                    <p className="text-sm font-black text-slate-800">{format(selectedDate, 'yyyy年M月d日 EEEE', { locale: zhCN })}</p>
                  </div>
                  <button 
                    onClick={() => handleDateSelect(new Date())}
                    className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
                  >
                    回到今天
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
