import React, { useRef, useState } from 'react';
import { MealRecord, MealType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface MealSectionProps {
  title: string;
  type: MealType;
  records: MealRecord[];
  onUpdate: (id: string, updates: Partial<MealRecord>) => void;
  onDelete: (id: string) => void;
  onEditRequest: (record: MealRecord) => void;
}

const mealTypes: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: '早餐' },
  { value: 'morning_snack', label: '早加餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'afternoon_snack', label: '午加餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'evening_snack', label: '晚加餐' },
  { value: 'exercise', label: '运动消耗' },
];

export function MealSection({ title, type, records, onUpdate, onDelete, onEditRequest }: MealSectionProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  if (records.length === 0) return null;

  const totalCal = records.reduce((sum, r) => sum + r.cal, 0);

  const dotColors: Record<string, string> = {
    breakfast: 'bg-amber-400',
    morning_snack: 'bg-orange-300',
    lunch: 'bg-rose-400',
    afternoon_snack: 'bg-pink-300',
    dinner: 'bg-emerald-400',
    evening_snack: 'bg-indigo-300',
    exercise: 'bg-sky-400'
  };

  const handleTypeChange = (newType: MealType) => {
    records.forEach(r => onUpdate(r.id, { type: newType }));
    setIsDropdownOpen(false);
  };

  return (
    <div className="mb-10 px-6">
      <div className="flex justify-between items-center mb-5 relative">
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center hover:text-slate-600 transition-colors group"
          >
            <span className={cn("w-2 h-2 rounded-full mr-2", dotColors[type])}></span> 
            {title}
            <ChevronDown size={10} className="ml-1 opacity-0 group-hover:opacity-100 transition-all" />
          </button>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 overflow-hidden"
                >
                  {mealTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleTypeChange(t.value)}
                      className={cn(
                        "w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-between",
                        type === t.value ? "text-emerald-500 bg-emerald-50/50" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {t.label}
                      {type === t.value && <Check size={10} />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">
          {Math.abs(totalCal)} kcal
        </span>
      </div>
      
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {records.map((record) => (
            <RecordItem 
              key={record.id} 
              record={record} 
              onEdit={() => onEditRequest(record)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface RecordItemProps {
  key?: string;
  record: MealRecord;
  onEdit: () => void;
}

function RecordItem({ record, onEdit }: RecordItemProps) {
  const isExercise = record.type === 'exercise';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onClick={onEdit}
      className={cn(
        "group flex justify-between items-center p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
        isExercise 
          ? "bg-sky-50 border-sky-100 hover:bg-sky-100 hover:border-sky-200" 
          : "bg-white border-slate-100 hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-500/5 shadow-sm"
      )}
    >
      <div className="flex-1 min-w-0 mr-4">
        <div 
          className={cn(
            "text-sm font-bold outline-none leading-tight",
            isExercise ? "text-sky-800" : "text-slate-800"
          )}
        >
          {record.name}
        </div>
        {!isExercise && (
          <div className="flex gap-4 mt-2">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter flex items-baseline gap-0.5">
              碳水 <span className="text-slate-500">{Math.round(record.carb)}</span> 克
            </span>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter flex items-baseline gap-0.5">
              蛋白 <span className="text-slate-500">{Math.round(record.pro)}</span> 克
            </span>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter flex items-baseline gap-0.5">
              脂肪 <span className="text-slate-500">{Math.round(record.fat)}</span> 克
            </span>
          </div>
        )}
        {isExercise && <div className="mt-2 text-[9px] font-black text-sky-400 uppercase tracking-tighter">运动状态</div>}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-1">
          <span className={cn("text-xl font-black tracking-tighter", isExercise ? "text-sky-600" : "text-slate-900")}>
            {isExercise ? '-' : ''}{Math.abs(record.cal)}
          </span>
          <span className={cn("text-[9px] font-black uppercase tracking-widest", isExercise ? "text-sky-400" : "text-slate-400")}>kcal</span>
        </div>
      </div>
    </motion.div>
  );
}
