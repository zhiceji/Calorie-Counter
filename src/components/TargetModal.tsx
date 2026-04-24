import React, { useState, useEffect } from 'react';
import { X, Target, Minus, Plus, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDefaultTarget, setDefaultTarget } from '../lib/storage';

interface MacroGoals {
  carbs: number;
  protein: number;
  fat: number;
}

interface TargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateTarget?: (target: number) => void;
}

const MACRO_GOALS_KEY = 'nutri_macro_goals';

export function TargetModal({ isOpen, onClose, onUpdateTarget }: TargetModalProps) {
  const [dailyTarget, setDailyTarget] = useState(2000);
  const [macroGoals, setMacroGoals] = useState<MacroGoals>({ carbs: 250, protein: 120, fat: 70 });

  useEffect(() => {
    setDailyTarget(getDefaultTarget());
    const saved = localStorage.getItem(MACRO_GOALS_KEY);
    if (saved) {
      try {
        setMacroGoals(JSON.parse(saved));
      } catch (e) {}
    }
  }, [isOpen]);

  const adjustTarget = (delta: number) => {
    setDailyTarget(prev => Math.max(500, prev + delta));
  };

  const adjustMacro = (key: keyof MacroGoals, delta: number) => {
    setMacroGoals(prev => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));
  };

  const handleSave = () => {
    setDefaultTarget(dailyTarget);
    localStorage.setItem(MACRO_GOALS_KEY, JSON.stringify(macroGoals));
    onUpdateTarget?.(dailyTarget);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl z-10 overflow-hidden pointer-events-auto"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">目标热量设置</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {/* 目标热量 */}
              <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => adjustTarget(-100)}
                    className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 hover:bg-emerald-100 transition-all shadow-sm"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={dailyTarget}
                      onChange={(e) => setDailyTarget(parseInt(e.target.value) || 0)}
                      className="w-28 bg-white border-none rounded-2xl px-4 py-3 text-xl font-black text-emerald-600 text-center focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                    <span className="text-sm font-bold text-slate-400">kcal</span>
                  </div>
                  <button
                    onClick={() => adjustTarget(100)}
                    className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 hover:bg-emerald-100 transition-all shadow-sm"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* 宏量营养素目标 */}
              <div className="space-y-4">
                {/* 碳水 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-600 w-16">碳水</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustMacro('carbs', -10)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200">
                      <Minus size={14} />
                    </button>
                    <input type="number" value={macroGoals.carbs} onChange={(e) => setMacroGoals(p => ({...p, carbs: parseInt(e.target.value) || 0}))} className="w-16 bg-slate-50 rounded-xl px-2 py-2 text-sm font-black text-center outline-none" />
                    <button onClick={() => adjustMacro('carbs', 10)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200">
                      <Plus size={14} />
                    </button>
                    <span className="text-xs text-slate-400 w-8">g</span>
                  </div>
                </div>
                {/* 蛋白质 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-rose-500 w-16">蛋白质</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustMacro('protein', -10)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200">
                      <Minus size={14} />
                    </button>
                    <input type="number" value={macroGoals.protein} onChange={(e) => setMacroGoals(p => ({...p, protein: parseInt(e.target.value) || 0}))} className="w-16 bg-slate-50 rounded-xl px-2 py-2 text-sm font-black text-center outline-none" />
                    <button onClick={() => adjustMacro('protein', 10)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200">
                      <Plus size={14} />
                    </button>
                    <span className="text-xs text-slate-400 w-8">g</span>
                  </div>
                </div>
                {/* 脂肪 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-sky-500 w-16">脂肪</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustMacro('fat', -10)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200">
                      <Minus size={14} />
                    </button>
                    <input type="number" value={macroGoals.fat} onChange={(e) => setMacroGoals(p => ({...p, fat: parseInt(e.target.value) || 0}))} className="w-16 bg-slate-50 rounded-xl px-2 py-2 text-sm font-black text-center outline-none" />
                    <button onClick={() => adjustMacro('fat', 10)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200">
                      <Plus size={14} />
                    </button>
                    <span className="text-xs text-slate-400 w-8">g</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-emerald-200 transition-all"
              >
                保存
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
