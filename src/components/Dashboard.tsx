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
      {/* 摄入热量卡片 */}
      <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm" style={{ borderRadius: '32px', width: '312px', height: '217px', padding: '24px', position: 'relative' }}>
        {/* 右上角按钮组 - 完全独立，绝对定位 */}
        <div style={{ position: 'absolute', top: '23px', right: '28px', zIndex: 10 }}>
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', flexShrink: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '10px' }}>
              <p style={{ margin: 0, padding: 0, lineHeight: '10px', fontSize: '13px', letterSpacing: '2px', color: 'oklch(0.704 0.04 256.788)', height: '14px', fontWeight: 'bold' }}>剩余可摄入热量</p>
              <div>
                <div className="font-black text-slate-900" style={{ width: '140px', height: '40px', fontSize: '36px', lineHeight: '36px', letterSpacing: '-2px' }}>
                  还可以吃
                </div>
                <motion.div 
                  key={remaining}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-4xl sm:text-5xl font-black tracking-tighter inline-flex items-baseline gap-0"
                  style={{ lineHeight: '1' }}
                >
                  <span className="text-emerald-500">{remaining.toLocaleString()}</span>
                  <span className="text-xl font-normal text-slate-400 ml-1">kcal</span>
                </motion.div>
              </div>
            </div>
            
            <div className="flex items-center gap-x-3 sm:gap-x-4" style={{ flexShrink: 0 }}>
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
          
          {/* 热量圆环进度 - 固定在右侧 */}
          <div style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', width: '80px', height: '80px', flexShrink: 0 }}>
            <svg className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="36" fill="transparent" stroke="#e2e8f0" strokeWidth="6" />
              <motion.circle
                cx="40" cy="40" r="36"
                fill="transparent" stroke={progress > 100 ? "#ef4444" : "#10b981"} strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-slate-700">{Math.round(progress)}%</span>
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      valRef.current?.blur();
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
          onKeyDown={handleKeyDown}
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
  const rawPercentage = (current / goal) * 100;
  const percentage = Math.min(rawPercentage, 100);
  const isOverflow = rawPercentage > 100;
  const ringColor = isOverflow ? "#ef4444" : color;
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
            fill="transparent" stroke={ringColor} strokeWidth="6"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-[10px] font-black", isOverflow ? "text-red-400" : "text-white")}>{Math.round(rawPercentage)}%</span>
        </div>
      </div>
      <span className="text-[9px] font-bold text-slate-400">{label}</span>
      <span className="text-[8px] font-bold text-slate-500">{current}g/{goal}g</span>
    </div>
  );
}
