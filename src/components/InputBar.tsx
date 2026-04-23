import React, { useState, useRef } from 'react';
import { Camera, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseFoodInput, parseFoodImage } from '../lib/gemini';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) {
      setIsManualModalOpen(true);
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    try {
      const results = await parseFoodInput(input, new Date());
      onAdd(results);
      setInput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const results = await parseFoodImage(base64, new Date());
      onAdd(results);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pointer-events-none">
      <div className="max-w-xl mx-auto w-full pointer-events-auto flex items-center gap-4">
        <div className="relative flex-1">
          <form 
            onSubmit={handleSubmit}
            className="flex items-center bg-white h-16 px-8 rounded-full shadow-lg shadow-slate-200/50 border border-slate-200 transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10"
          >
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="说在这个时刻吃了什么..."
              className="flex-1 bg-transparent text-slate-700 font-bold placeholder:text-slate-200 outline-none pr-4"
            />
            <div className="flex items-center space-x-4 border-l border-slate-100 pl-4">
              <button 
                type="button"
                onClick={handleCameraClick}
                className="text-slate-400 hover:text-emerald-500 transition-colors"
                title="拍照识别"
              >
                <Camera size={22} strokeWidth={2.5} />
              </button>
            </div>
            
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
            />
          </form>

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
            >
              DeepSeek 正在识别中...
            </motion.div>
          )}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 active:scale-90",
            (input.trim() || isLoading || !isLoading) 
              ? "bg-emerald-500 shadow-emerald-200 scale-100" 
              : "bg-slate-200 shadow-transparent scale-95 cursor-not-allowed"
          )}
          title={input.trim() ? "发送识别" : "手动添加"}
        >
          {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Plus size={28} strokeWidth={3} />}
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
