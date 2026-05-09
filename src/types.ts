/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IngredientRequirement {
  n: string; // name
  a: string; // amount
}

export interface Recipe {
  id: number;
  name: string;
  req: IngredientRequirement[];
  bs: string[]; // basic symptoms
  bc: string[]; // basic colors (tailwind classes)
  ef: string[]; // effects
  mth: '泡' | '煮'; // method
  caution: string;
  steps: string[];
}

export interface HistoryItem {
  id: number;
  recipeId: number;
  name: string;
  date: string;
  days: number;
  status: '饮用中' | '已完成';
  rating: number;
  symptoms: string[];
}
