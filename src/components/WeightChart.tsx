import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { X, TrendingUp } from 'lucide-react';

interface WeightData {
  date: string;
  weight: number;
}

interface WeightChartProps {
  data: WeightData[];
  isOpen: boolean;
  onClose: () => void;
}

export function WeightChart({ data, isOpen, onClose }: WeightChartProps) {
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
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden z-10"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">体重趋势</p>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">几何生长曲线</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              {data.length < 2 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                    <TrendingUp size={24} />
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">
                    累计记录 2 天以上体重<br/>即可解锁几何趋势图
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1 mb-6 justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight (kg)</span>
                  </div>

                  <div className="h-[300px] w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.map(d => ({ ...d, displayDate: format(parseISO(d.date), 'MM/dd') }))}>
                        <defs>
                          <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="displayDate" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                          dy={10}
                          interval={0}
                        />
                        <YAxis 
                          hide
                          domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-800">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].payload.displayDate}</p>
                                  <p className="text-sm font-black">{payload[0].value} <span className="text-[10px] opacity-60">kg</span></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#10b981" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorWeight)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
