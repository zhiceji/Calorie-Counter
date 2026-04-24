import React from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { ChevronRight } from 'lucide-react';

interface CalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onOpenMonthView: () => void;
}

export function CalendarStrip({ selectedDate, onDateSelect, onOpenMonthView }: CalendarStripProps) {
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  return (
    <div className="flex justify-between px-6 py-8 bg-transparent">
      <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2 flex-1 md:mr-8 pr-4">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[3.5rem] w-14 h-20 rounded-2xl transition-all duration-300 border",
                isSelected 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 border-emerald-500" 
                  : "bg-white border-slate-200 text-slate-400 hover:border-emerald-200"
              )}
            >
              <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", isSelected ? "text-emerald-100" : "text-slate-400")}>
                {format(day, 'EEE', { locale: zhCN })}
              </span>
              <span className="text-xl font-semibold">
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
      </div>
      <button 
        onClick={onOpenMonthView}
        className="text-right hidden sm:block hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 p-4 -m-4 rounded-[32px] transition-all group"
      >
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter group-hover:text-emerald-500 transition-colors">
          {format(selectedDate, 'M月d日')}
        </h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-end">
          日期切换与目标
          <ChevronRight size={12} className="ml-1 text-slate-200 group-hover:text-emerald-300 transition-colors" />
        </p>
      </button>
    </div>
  );
}
