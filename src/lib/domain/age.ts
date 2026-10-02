import type { Child, MealRole } from "./types";

export function ageInMonths(birthDate: string, onDate: string): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = onDate.split("-").map(Number);
  let months = (ty - by) * 12 + (tm - bm);
  if (td < bd) months -= 1;
  return months;
}

export type Stage = "puree" | "toddler";

export function stageOf(child: Child, onDate: string): Stage {
  return ageInMonths(child.birthDate, onDate) < 12 ? "puree" : "toddler";
}

export function babyMealsPerDay(ageMonths: number): number {
  if (ageMonths < 7) return 1;
  if (ageMonths < 9) return 2;
  return 3;
}

export type Slot = { role: MealRole; count: number; portions: number[] };

export const TODDLER_MAIN_COUNT = 4;
export const TODDLER_MAIN_MEALS_PER_WEEK = 14;

export function splitPortions(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  const extra = total % count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}
