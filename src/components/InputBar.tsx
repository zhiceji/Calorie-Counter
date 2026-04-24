import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseFoodInput } from '../lib/gemini';
import { MealRecord } from '../types';
import { cn } from '../lib/utils';
import { MealEntryModal } from './MealEntryModal';

interface InputBarProps {
  onAdd: (records: Partial<MealRecord>[]) => void;
}

export function InputBar({ onAdd }: InputBarProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) {
      setIsManualModalOpen(true);
      return;
    }
    if (isLoading) return;

    setError('');
    setIsLoading(true);
    try {
      const results = await parseFoodInput(input, new Date());
      onAdd(results);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '识别失败');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pointer-events-none">
      <div className="max-w-xl mx-auto w-full pointer-events-auto flex items-stretch gap-3">
        <div className="relative flex-1 min-w-0">
          <form 
            onSubmit={handleSubmit}
            className="flex items-center bg-white h-14 px-4 sm:px-8 rounded-full shadow-lg shadow-slate-200/50 border border-slate-200 transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10"
          >
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="说在这个时刻吃了什么..."
              className="flex-1 min-w-0 bg-transparent text-slate-700 font-bold placeholder:text-slate-200 outline-none pr-2 sm:pr-4 text-sm sm:text-base"
            />
          </form>

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap"
            >
              DeepSeek 正在识别中...
            </motion.div>
          )}
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-lg whitespace-nowrap max-w-[280px] truncate"
            >
              {error}
            </motion.div>
          )}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className={cn(
            "h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 active:scale-90 flex-shrink-0",
            (input.trim() || isLoading || !isLoading) 
              ? "bg-emerald-500 shadow-emerald-200 scale-100" 
              : "bg-slate-200 shadow-transparent scale-95 cursor-not-allowed"
          )}
          title={input.trim() ? "发送识别" : "手动添加"}
        >
          {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Plus size={26} strokeWidth={3} className="w-6 h-6 sm:w-7 sm:h-7" />}
        </button>
      </div>

      <MealEntryModal 
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={onAdd}
      />
    </div>
  );
}
