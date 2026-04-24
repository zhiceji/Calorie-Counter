import React, { useState, useEffect } from 'react';
import { MacroSummary } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { TrendingUp, Trophy, Timer } from 'lucide-react';

interface DashboardProps {
  summary: MacroSummary;
  target: number;
  weight?: number;
  onUpdateTarget?: (val: number) => void;
  onUpdateWeight?: (val: number | undefined) => void;
  onShowChart?: () => void;
  onShowWeeklyStats?: () => void;
  onShowTimer?: () => void;
}

const MACRO_GOALS_KEY = 'nutri_macro_goals';

export function Dashboard({ summary, target, weight, onUpdateTarget, onUpdateWeight, onShowChart, onShowWeeklyStats, onShowTimer }: DashboardProps) {
  const intake = summary.calories;
  const exercise = Math.abs(summary.exercise);
  const remaining = target - intake + exercise;
  const progress = Math.min((intake / (target + exercise)) * 100, 100);
  
  // SVG calculation for circular progress
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (progress / 100) * circumference;

  const [macroGoals, setMacroGoals] = useState({ carbs: 250, protein: 120, fat: 70 });

  useEffect(() => {
    const saved = localStorage.getItem(MACRO_GOALS_KEY);
    if (saved) {
      try {
        setMacroGoals(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleMacroEdit = (key: 'carbs' | 'protein' | 'fat', val: number) => {
    const newGoals = { ...macroGoals, [key]: val };
    setMacroGoals(newGoals);
    localStorage.setItem(MACRO_GOALS_KEY, JSON.stringify(newGoals));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 px-6">
      <div className="lg:col-span-2 bg-white rounded-[32px] py-8 px-6 border border-slate-100 shadow-sm flex items-center justify-between w-[338px] h-[207px]">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">剩余可摄入热量</p>
            <div className="flex gap-2">
              <button 
                onClick={onShowTimer}
                className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Timer size={16} />
              </button>
              <button 
                onClick={onShowWeeklyStats}
                className="p-2 bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm shadow-emerald-50 active:scale-95"
              >
                <Trophy size={16} />
              </button>
            </div>
          </div>
          <motion.h1 
            key={remaining}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter"
          >
            还可以吃 <span className="text-emerald-500">{remaining.toLocaleString()}</span> <span className="text-xl font-normal text-slate-400">kcal</span>
          </motion.h1>
          
          <div className="mt-6 flex items-center gap-x-3 sm:gap-x-4 overflow-hidden">
            <StatsItem label="目标" value={target} color="text-slate-700" isEditable onEdit={onUpdateTarget} />
            <StatsItem label="摄入" value={intake} color="text-slate-700" />
            <StatsItem label="运动" value={exercise} color="text-sky-500" prefix="+" />
            <div className="flex items-center gap-1">
              <StatsItem label="体重" value={weight || 0} color="text-emerald-500" suffix="kg" isEditable onEdit={(val) => onUpdateWeight?.(val === 0 ? undefined : val)} />
              <button 
                onClick={onShowChart}
                className="p-1 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all shrink-0"
              >
                <TrendingUp size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 宏量营养素圆形进度 */}
      <div className="bg-slate-900 rounded-[32px] py-6 px-4 flex items-center justify-around shadow-xl shadow-slate-900/10 h-[130px]">
        <MacroCircle label="碳水" current={summary.carbs} goal={macroGoals.carbs} color="#fbbf24" />
        <MacroCircle label="蛋白质" current={summary.protein} goal={macroGoals.protein} color="#fb7185" />
        <MacroCircle label="脂肪" current={summary.fat} goal={macroGoals.fat} color="#38bdf8" />
      </div>
    </div>
  );
}

function StatsItem({ label, value, color, prefix = "", suffix = "", isEditable, onEdit }: { label: string, value: number, color: string, prefix?: string, suffix?: string, isEditable?: boolean, onEdit?: (val: number) => void }) {
  const valRef = React.useRef<HTMLSpanElement>(null);

  const handleBlur = () => {
    if (onEdit && valRef.current) {
      const text = valRef.current.innerText.trim();
      const newVal = parseFloat(text);
      if (!isNaN(newVal)) onEdit(newVal);
    }
  };

  return (
    <div className="shrink-0">
      <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-0.5">{label}</p>
      <div className={cn("text-sm font-black tracking-tight flex items-baseline gap-0.5", color)}>
        {prefix}
        <span
          ref={valRef}
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={handleBlur}
          className={cn(isEditable && "border-b border-dashed border-slate-200 min-w-[16px] outline-none focus:border-emerald-500")}
        >
          {value || (isEditable ? '0' : '0')}
        </span>
        <span className="text-[9px] font-bold text-slate-300 ml-0.5">{suffix}</span>
      </div>
    </div>
  );
}

function MacroCircle({ label, current, goal, color }: { label: string, current: number, goal: number, color: string }) {
  const percentage = Math.min((current / goal) * 100, 100);
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-0">
      <div className="relative w-16 h-16">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="transparent" stroke="#334155" strokeWidth="6" />
          <motion.circle
            cx="32" cy="32" r={r}
            fill="transparent" stroke={color} strokeWidth="6"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black text-white">{Math.round(percentage)}%</span>
        </div>
      </div>
      <span className="text-[9px] font-bold text-slate-400">{label}</span>
      <span className="text-[8px] font-bold text-slate-500">{current}g/{goal}g</span>
    </div>
  );
}
