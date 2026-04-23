import React from 'react';
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

export function Dashboard({ summary, target, weight, onUpdateTarget, onUpdateWeight, onShowChart, onShowWeeklyStats, onShowTimer }: DashboardProps) {
  const intake = summary.calories;
  const exercise = Math.abs(summary.exercise);
  const remaining = target - intake + exercise;
  const progress = Math.min((intake / (target + exercise)) * 100, 100);
  
  // SVG calculation for circular progress
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (progress / 100) * circumference;

  const [macroGoals, setMacroGoals] = React.useState({ carbs: 250, protein: 120, fat: 70 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 px-6">
      <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
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
          
          <div className="mt-8 flex flex-wrap items-center gap-x-4 sm:gap-x-10 gap-y-4">
            <StatsItem label="目标" value={target} color="text-slate-700" isEditable onEdit={onUpdateTarget} />
            <StatsItem label="摄入" value={intake} color="text-slate-700" />
            <StatsItem label="运动" value={exercise} color="text-sky-500" prefix="+" />
            <div className="flex items-center gap-1">
              <StatsItem label="体重" value={weight || 0} color="text-emerald-500" suffix="kg" isEditable onEdit={(val) => onUpdateWeight?.(val === 0 ? undefined : val)} />
              <button 
                onClick={onShowChart}
                className="mt-4 p-1.5 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <TrendingUp size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative w-28 h-28 hidden sm:flex items-center justify-center shrink-0 ml-4">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="56" cy="56" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
            <motion.circle 
              cx="56" cy="56" r={radius} 
              fill="transparent" stroke="#10b981" strokeWidth="10" 
              strokeDasharray={circumference} 
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round" 
            />
          </svg>
          <span className="text-sm font-black text-slate-800">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[32px] p-8 flex flex-col justify-between shadow-xl shadow-slate-900/10">
        <div className="space-y-6">
          <MacroBar label="碳水" current={summary.carbs} goal={macroGoals.carbs} color="bg-amber-400" onEditGoal={(val) => setMacroGoals(prev => ({...prev, carbs: val}))} />
          <MacroBar label="蛋白质" current={summary.protein} goal={macroGoals.protein} color="bg-rose-400" onEditGoal={(val) => setMacroGoals(prev => ({...prev, protein: val}))} />
          <MacroBar label="脂肪" current={summary.fat} goal={macroGoals.fat} color="bg-sky-400" onEditGoal={(val) => setMacroGoals(prev => ({...prev, fat: val}))} />
        </div>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-8 font-bold">结构平衡: 已优化</p>
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
    <div>
      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-0.5">{label}</p>
      <div className={cn("text-lg font-black tracking-tight flex items-baseline gap-1", color)}>
        {prefix}
        <span
          ref={valRef}
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={handleBlur}
          className={cn(isEditable && "border-b border-dashed border-slate-200 min-w-[20px] outline-none focus:border-emerald-500")}
        >
          {value || (isEditable ? '0' : '0')}
        </span>
        <span className="text-[10px] font-bold text-slate-300 ml-0.5">{suffix}</span>
      </div>
    </div>
  );
}

function MacroBar({ label, current, goal, color, onEditGoal }: { label: string, current: number, goal: number, color: string, onEditGoal?: (val: number) => void }) {
  const percentage = Math.min((current / goal) * 100, 100);
  const goalRef = React.useRef<HTMLSpanElement>(null);

  const handleBlur = () => {
    if (onEditGoal && goalRef.current) {
      const newVal = parseFloat(goalRef.current.innerText);
      if (!isNaN(newVal)) onEditGoal(newVal);
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-[10px] font-black text-white uppercase tracking-wider">
          {label} ({Math.round(current)}g/
          <span
            ref={goalRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            className="border-b border-transparent focus:border-emerald-500 outline-none"
          >
            {goal}
          </span>
          g)
        </span>
        <span className="text-[10px] font-bold text-slate-500">{Math.round(percentage)}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
          className={cn("h-full rounded-full", color)} 
        />
      </div>
    </div>
  );
}
