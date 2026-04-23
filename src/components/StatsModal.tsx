import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Target, Zap, Waves } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { cn } from '../lib/utils';

interface WeeklyStats {
  date: string;
  calories: number;
  exercise: number;
  target: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WeeklyStats[];
}

export function StatsModal({ isOpen, onClose, data }: StatsModalProps) {
  const chartData = data.map(d => ({
    ...d,
    displayDate: format(parseISO(d.date), 'MM/dd'),
    netCalories: d.calories - d.target,
  }));

  const totalCalories = data.reduce((sum, d) => sum + d.calories, 0);
  const totalExercise = data.reduce((sum, d) => sum + d.exercise, 0);
  const avgCalories = Math.round(totalCalories / (data.length || 1));
  
  // Achievement metrics
  const activeDays = data.filter(d => d.exercise > 0).length;
  const goalMetDays = data.filter(d => d.calories <= d.target && d.calories > 0).length;

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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
          >
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                  <Trophy size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Weekly Report</p>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">几何周报统计</h3>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard 
                  icon={<Zap size={20} className="text-orange-500" />}
                  label="平均摄入"
                  value={avgCalories}
                  unit="kcal"
                  desc="过去7天平均每日"
                />
                <SummaryCard 
                  icon={<Waves size={20} className="text-sky-500" />}
                  label="运动频次"
                  value={activeDays}
                  unit="天"
                  desc="有记录的运动天数"
                  progress={(activeDays / 7) * 100}
                />
                <SummaryCard 
                  icon={<Target size={20} className="text-emerald-500" />}
                  label="达成天数"
                  value={goalMetDays}
                  unit="天"
                  desc="热量控制在目标内"
                  progress={(goalMetDays / 7) * 100}
                />
              </div>

              {/* Calorie Trend Chart */}
              <div>
                <div className="flex justify-between items-end mb-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">热量摄入 vs 目标 (kcal)</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.4 h-2.4 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Within Goal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.4 h-2.4 rounded-full bg-rose-400" />
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Overloaded</span>
                    </div>
                  </div>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="displayDate" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 min-w-[150px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{d.displayDate}</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between gap-4">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">摄入</span>
                                    <span className="text-sm font-black">{d.calories}</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">目标</span>
                                    <span className="text-sm font-black text-slate-300">{d.target}</span>
                                  </div>
                                  <div className="pt-2 border-t border-slate-800 flex justify-between gap-4 mt-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">差额</span>
                                    <span className={cn("text-sm font-black", d.calories > d.target ? "text-rose-400" : "text-emerald-400")}>
                                      {d.calories - d.target > 0 ? `+${d.calories-d.target}` : d.calories-d.target}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="calories" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.calories > entry.target ? '#fb7185' : '#10b981'} />
                        ))}
                      </Bar>
                      {/* Using ReferenceLine to show the average target if consistent */}
                      <ReferenceLine y={chartData[6]?.target} stroke="#64748b" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Achievement Message */}
              <div className="bg-slate-50 rounded-[32px] p-8 flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl shadow-sm border border-slate-100">
                  {goalMetDays >= 5 ? '👑' : goalMetDays >= 3 ? '💪' : '🌱'}
                </div>
                <div>
                  <h5 className="text-lg font-black text-slate-800">
                    {goalMetDays >= 5 ? '统御全场！' : goalMetDays >= 3 ? '渐入佳境！' : '开始发力！'}
                  </h5>
                  <p className="text-slate-500 text-sm font-medium mt-1">
                    本周您有 {goalMetDays} 天完美达标，完成运动次数 {activeDays} 次。继续保持几何平衡，迎接更好的自己！
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SummaryCard({ icon, label, value, unit, desc, progress }: { icon: React.ReactNode, label: string, value: number, unit: string, desc: string, progress?: number }) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
          {icon}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-slate-800">{value}</span>
          <span className="text-sm font-bold text-slate-300">{unit}</span>
        </div>
        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">{desc}</p>
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-1.5 bg-slate-50 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-emerald-500"
          />
        </div>
      )}
    </div>
  );
}
