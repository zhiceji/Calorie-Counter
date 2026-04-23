import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DayData, MealRecord, FavoriteItem } from '../types';

const STORAGE_PREFIX = 'nutriai_day_';
const FAVORITES_KEY = 'nutriai_favorites';
const DEFAULT_TARGET = 2000;

export function useDayData(date: Date) {
  const dateKey = format(date, 'yyyy-MM-dd');
  const storageId = `${STORAGE_PREFIX}${dateKey}`;

  const [data, setData] = useState<DayData>(() => {
    const saved = localStorage.getItem(storageId);
    if (saved) {
      return JSON.parse(saved);
    }
    return { meals: [], target: DEFAULT_TARGET };
  });

  useEffect(() => {
    const saved = localStorage.getItem(storageId);
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      setData({ meals: [], target: DEFAULT_TARGET });
    }
  }, [storageId]);

  const saveData = (newData: DayData) => {
    localStorage.setItem(storageId, JSON.stringify(newData));
    setData(newData);
  };

  const addRecords = (records: Partial<MealRecord>[]) => {
    const newMeals = records.map(r => ({
      ...r,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    })) as MealRecord[];

    saveData({
      ...data,
      meals: [...data.meals, ...newMeals],
    });
  };

  const updateMeal = (id: string, updates: Partial<MealRecord>) => {
    saveData({
      ...data,
      meals: data.meals.map(m => m.id === id ? { ...m, ...updates } : m),
    });
  };

  const deleteMeal = (id: string) => {
    saveData({
      ...data,
      meals: data.meals.filter(m => m.id !== id),
    });
  };

  const updateTarget = (target: number) => {
    saveData({ ...data, target });
  };

  const updateWeight = (weight: number | undefined) => {
    saveData({ ...data, weight });
  };

  return {
    data,
    addRecords,
    updateMeal,
    deleteMeal,
    updateTarget,
    updateWeight,
  };
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const addFavorite = (item: Omit<FavoriteItem, 'id'>) => {
    const newFav: FavoriteItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
    };
    const newFavs = [...favorites, newFav];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
    setFavorites(newFavs);
  };

  const removeFavorite = (id: string) => {
    const newFavs = favorites.filter(f => f.id !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
    setFavorites(newFavs);
  };

  return { favorites, addFavorite, removeFavorite };
}

export function useWeeklyStats(trigger?: any) {
  const [stats, setStats] = useState<{
    date: string;
    calories: number;
    exercise: number;
    target: number;
    carbs: number;
    protein: number;
    fat: number;
  }[]>([]);

  useEffect(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return format(d, 'yyyy-MM-dd');
    });

    const weeklyData = last7Days.map(dateKey => {
      const dayData = JSON.parse(localStorage.getItem(STORAGE_PREFIX + dateKey) || JSON.stringify({
        meals: [],
        target: 2000,
        weight: undefined
      }));

      const totals = dayData.meals.reduce((acc: any, meal: any) => ({
        calories: acc.calories + (meal.cal > 0 ? meal.cal : 0),
        exercise: acc.exercise + (meal.cal < 0 ? Math.abs(meal.cal) : 0),
        carbs: acc.carbs + (meal.carb || 0),
        protein: acc.protein + (meal.pro || 0),
        fat: acc.fat + (meal.fat || 0)
      }), { calories: 0, exercise: 0, carbs: 0, protein: 0, fat: 0 });

      return {
        date: dateKey,
        target: dayData.target,
        ...totals
      };
    });

    setStats(weeklyData);
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return stats;
}

export function useWeightHistory(trigger?: any) {
  const [history, setHistory] = useState<{ date: string; weight: number }[]>([]);

  const fetchHistory = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    const data = keys.map(k => {
      const dayData = JSON.parse(localStorage.getItem(k) || '{}');
      return {
        date: k.replace(STORAGE_PREFIX, ''),
        weight: dayData.weight
      };
    })
    .filter(d => d.weight !== undefined && d.weight > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

    setHistory(data as { date: string; weight: number }[]);
  };

  useEffect(() => {
    fetchHistory();
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return history;
}
