/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack' | 'exercise';

export interface MealRecord {
  id: string;
  type: MealType;
  name: string;
  cal: number;
  carb: number;
  pro: number;
  fat: number;
  timestamp: number;
}

export interface DayData {
  meals: MealRecord[];
  target: number;
  weight?: number;
}

export interface FavoriteItem {
  id: string;
  type: MealType;
  name: string;
  cal: number;
  carb: number;
  pro: number;
  fat: number;
}

export interface MacroSummary {
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  exercise: number;
}
