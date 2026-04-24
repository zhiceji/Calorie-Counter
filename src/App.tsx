/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CalendarStrip } from './components/CalendarStrip';
import { Dashboard } from './components/Dashboard';
import { MealSection } from './components/MealSection';
import { InputBar } from './components/InputBar';
import { SettingsModal } from './components/SettingsModal';
import { TargetModal } from './components/TargetModal';
import { MonthCalendarModal } from './components/MonthCalendarModal';
import { MealEntryModal } from './components/MealEntryModal';
import { WeightChart } from './components/WeightChart';
import { StatsModal } from './components/StatsModal';
import { RestTimerModal } from './components/RestTimerModal';
import { useDayData, useWeightHistory, useWeeklyStats } from './lib/storage';
import { MacroSummary, MealType, MealRecord } from './types';
import { User, Plus, Settings } from 'lucide-react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Last Updated: 笑匠私人特制 - 2026-04-23
export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTargetOpen, setIsTargetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealRecord | null>(null);

  // 初始化沉浸式状态栏
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }); // 深色图标
      StatusBar.setBackgroundColor({ color: '#f8fafc' }); // 与页面背景色一致
    }
  }, []);
  const { data, addRecords, updateMeal, deleteMeal, updateTarget, updateWeight } = useDayData(selectedDate);
  const weightHistory = useWeightHistory(isChartOpen);
  const weeklyStats = useWeeklyStats(isStatsOpen);

  const summary = useMemo<MacroSummary>(() => {
    return data.meals.reduce((acc, meal) => {
      if (meal.type === 'exercise') {
        acc.exercise += meal.cal;
      } else {
        acc.calories += meal.cal;
        acc.carbs += meal.carbs || meal.carb || 0;
        acc.protein += meal.protein || meal.pro || 0;
        acc.fat += meal.fat || 0;
      }
      return acc;
    }, { carbs: 0, protein: 0, fat: 0, calories: 0, exercise: 0 });
  }, [data.meals]);

  const mealTypeOrder: MealType[] = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack', 'exercise'];
  const mealTypeLabels: Record<MealType, string> = {
    breakfast: '早餐',
    morning_snack: '早加餐',
    lunch: '午餐',
    afternoon_snack: '午加餐',
    dinner: '晚餐',
    evening_snack: '晚加餐',
    exercise: '运动消耗'
  };

  const mealsByType = useMemo(() => {
    const groups: Record<string, typeof data.meals> = {};
    data.meals.forEach(meal => {
      if (!groups[meal.type]) groups[meal.type] = [];
      groups[meal.type].push(meal);
    });
    return groups;
  }, [data.meals]);

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <TargetModal 
        isOpen={isTargetOpen} 
        onClose={() => setIsTargetOpen(false)}
        onUpdateTarget={updateTarget}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <MonthCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      <CalendarStrip 
        selectedDate={selectedDate} 
        onDateSelect={setSelectedDate}
        onOpenMonthView={() => setIsCalendarOpen(true)}
        headerButtons={
          <div className="flex gap-2">
            <button 
              onClick={() => setIsTargetOpen(true)}
              className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm text-slate-400 transition-all hover:bg-emerald-500 hover:text-white hover:border-emerald-500 group"
            >
              <Settings size={20} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm text-slate-400 transition-all hover:bg-slate-900 hover:text-white group"
            >
              <User size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        }
      />

      <main className="max-w-4xl mx-auto mt-4">
        <Dashboard 
          summary={summary} 
          target={data.target} 
          weight={data.weight}
          onUpdateTarget={updateTarget}
          onUpdateWeight={updateWeight}
          onShowChart={() => setIsChartOpen(true)}
          onShowWeeklyStats={() => setIsStatsOpen(true)}
          onShowTimer={() => setIsTimerOpen(true)}
        />

        <WeightChart 
          data={weightHistory} 
          isOpen={isChartOpen} 
          onClose={() => setIsChartOpen(false)} 
        />

        <StatsModal 
          isOpen={isStatsOpen} 
          onClose={() => setIsStatsOpen(false)} 
          data={weeklyStats} 
        />

        <RestTimerModal 
          isOpen={isTimerOpen}
          onClose={() => setIsTimerOpen(false)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 mt-4">
          {mealTypeOrder.map(type => (
            mealsByType[type] && mealsByType[type].length > 0 && (
              <div key={type} className={type === 'exercise' ? "md:col-span-2" : ""}>
                <MealSection 
                  title={mealTypeLabels[type]} 
                  type={type} 
                  records={mealsByType[type]} 
                  onUpdate={updateMeal} 
                  onDelete={deleteMeal}
                  onEditRequest={setEditingMeal}
                />
              </div>
            )
          ))}
        </div>

        {data.meals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-10 text-center opacity-40">
            <div className="w-20 h-20 bg-white border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center mb-6 text-slate-200">
              <Plus size={32} />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-loose">
              暂无记录 <br/> 
              <span className="text-[10px]">利用 AI 开启您的几何健康之旅</span>
            </p>
          </div>
        )}
      </main>

      <InputBar onAdd={addRecords} />

      <MealEntryModal
        isOpen={!!editingMeal}
        onClose={() => setEditingMeal(null)}
        initialRecord={editingMeal}
        onSave={(updates) => {
          if (editingMeal) {
            updateMeal(editingMeal.id, updates[0]);
          }
        }}
        onDelete={(id) => deleteMeal(id)}
      />
    </div>
  );
}

