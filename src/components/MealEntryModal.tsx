import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Utensils, Activity, Trash2, Heart, HeartOff } from 'lucide-react';
import { MealType, MealRecord, FavoriteItem } from '../types';
import { cn } from '../lib/utils';
import { useFavorites } from '../lib/storage';

interface MealEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (records: Partial<MealRecord>[]) => void;
  onDelete?: (id: string) => void;
  initialRecord?: MealRecord | null;
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

export function MealEntryModal({ isOpen, onClose, onSave, onDelete, initialRecord }: MealEntryModalProps) {
  const [type, setType] = useState<MealType>('breakfast');
  const [name, setName] = useState('');
  const [cal, setCal] = useState('');
  const [carb, setCarb] = useState('');
  const [pro, setPro] = useState('');
  const [fat, setFat] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'favorites'>('edit');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const { favorites, addFavorite, removeFavorite } = useFavorites();

  useEffect(() => {
    if (initialRecord) {
      setType(initialRecord.type);
      setName(initialRecord.name);
      setCal(Math.abs(initialRecord.cal).toString());
      setCarb(initialRecord.carb.toString());
      setPro(initialRecord.pro.toString());
      setFat(initialRecord.fat.toString());
      setActiveTab('edit');
    } else {
      setType('breakfast');
      setName('');
      setCal('');
      setCarb('');
      setPro('');
      setFat('');
      setActiveTab('edit');
    }
  }, [initialRecord, isOpen]);

  const handleSave = () => {
    if (!name || !cal) return;

    const calorieValue = parseFloat(cal);
    const resultCal = type === 'exercise' ? -Math.abs(calorieValue) : Math.abs(calorieValue);

    const recordData = {
      type,
      name,
      cal: resultCal,
      carb: parseFloat(carb) || 0,
      pro: parseFloat(pro) || 0,
      fat: parseFloat(fat) || 0,
      ...(initialRecord?.id ? { id: initialRecord.id } : {})
    };

    onSave([recordData]);
    onClose();
  };

  const handleAddFavorite = () => {
    if (!name || !cal) return;
    addFavorite({
      type,
      name,
      cal: parseFloat(cal),
      carb: parseFloat(carb) || 0,
      pro: parseFloat(pro) || 0,
      fat: parseFloat(fat) || 0,
    });
    
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const selectFavorite = (fav: FavoriteItem) => {
    setType(fav.type);
    setName(fav.name);
    setCal(fav.cal.toString());
    setCarb(fav.carb.toString());
    setPro(fav.pro.toString());
    setFat(fav.fat.toString());
    setActiveTab('edit');
  };

  const handleDelete = () => {
    if (initialRecord?.id && onDelete) {
      onDelete(initialRecord.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-visible z-10"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Save size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">
                    {initialRecord ? '编辑记录' : '手动添加记录'}
                  </h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              {/* Tab Switcher */}
              {!initialRecord && (
                <div className="flex bg-slate-50 p-1 rounded-2xl mb-8">
                  <button 
                    onClick={() => setActiveTab('edit')}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      activeTab === 'edit' ? "bg-white text-emerald-500 shadow-sm" : "text-slate-400"
                    )}
                  >
                    自定义录入
                  </button>
                  <button 
                    onClick={() => setActiveTab('favorites')}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      activeTab === 'favorites' ? "bg-white text-emerald-500 shadow-sm" : "text-slate-400"
                    )}
                  >
                    我的收藏 ({favorites.length})
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {activeTab === 'edit' ? (
                  <>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">选择类别</label>
                      <div className="grid grid-cols-4 gap-2">
                        {mealTypes.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setType(t.value)}
                            className={cn(
                              "py-2 px-1 rounded-xl text-[10px] font-bold transition-all border",
                              type === t.value 
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100" 
                                : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200"
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2 relative">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">名称 (食物或运动)</label>
                          <button 
                            onClick={handleAddFavorite}
                            disabled={!name || !cal}
                            className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-600 disabled:opacity-30"
                          >
                            <Heart size={10} fill={name && cal ? "currentColor" : "none"} /> 收藏为常用项
                          </button>
                          
                          <AnimatePresence>
                            {showSavedToast && (
                              <motion.div 
                                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                className="absolute right-0 top-6 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-lg z-20 shadow-lg pointer-events-none"
                              >
                                已加入收藏!
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="relative">
                          <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如: 燕麦粥, 跑步 5公里..."
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all pl-12"
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                            {type === 'exercise' ? <Activity size={18} /> : <Utensils size={18} />}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">热量 (kcal)</label>
                          <input 
                            type="number"
                            value={cal}
                            onChange={(e) => setCal(e.target.value)}
                            placeholder="0"
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">碳水 (克)</label>
                          <input 
                            type="number"
                            value={carb}
                            onChange={(e) => setCarb(e.target.value)}
                            placeholder="0"
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">蛋白质 (克)</label>
                          <input 
                            type="number"
                            value={pro}
                            onChange={(e) => setPro(e.target.value)}
                            placeholder="0"
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">脂肪 (克)</label>
                          <input 
                            type="number"
                            value={fat}
                            onChange={(e) => setFat(e.target.value)}
                            placeholder="0"
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      {initialRecord && (
                        <button 
                          onClick={handleDelete}
                          className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-500 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={18} />
                          删除
                        </button>
                      )}
                      <button 
                        onClick={handleSave}
                        disabled={!name || !cal}
                        className="flex-[2] bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-300 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                      >
                        {initialRecord ? '更新记录' : '确认添加'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {favorites.length === 0 ? (
                      <div className="py-12 text-center">
                        <Heart className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">暂无收藏条目</p>
                        <p className="text-[10px] text-slate-400 mt-1">在录入页面点击“收藏”即可添加</p>
                      </div>
                    ) : (
                      favorites.map((fav) => (
                        <div 
                          key={fav.id}
                          className="group relative flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 hover:ring-1 hover:ring-emerald-200 transition-all cursor-pointer"
                          onClick={() => selectFavorite(fav)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              fav.type === 'exercise' ? "bg-sky-100 text-sky-500" : "bg-emerald-100 text-emerald-500"
                            )}>
                              {fav.type === 'exercise' ? <Activity size={18} /> : <Utensils size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{fav.name}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                {fav.cal} kcal · {fav.carb}C · {fav.pro}P · {fav.fat}F
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFavorite(fav.id);
                            }}
                            className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <HeartOff size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
