import React from 'react';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';

interface CalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onOpenMonthView: () => void;
  headerButtons?: React.ReactNode;
}

export function CalendarStrip({ selectedDate, onOpenMonthView, headerButtons }: CalendarStripProps) {
  return (
    <div className="max-w-4xl mx-auto px-6" style={{ paddingTop: '14px', paddingBottom: '12px' }}>
      <div className="flex justify-between items-center">
        <button 
          onClick={onOpenMonthView}
          className="text-left hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 p-4 -m-2 rounded-[32px] transition-all group"
          style={{ marginLeft: '3px' }}
        >
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter group-hover:text-emerald-500 transition-colors">
            {format(selectedDate, 'M月d日')}
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center">
            日期切换与目标
            <ChevronRight size={12} className="ml-1 text-slate-200 group-hover:text-emerald-300 transition-colors" />
          </p>
        </button>
        {headerButtons}
      </div>
    </div>
  );
}
