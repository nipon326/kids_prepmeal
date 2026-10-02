import type { Rating, RatingEntry } from "./types";

const POINTS: Record<Rating, number> = { loved: 3, liked: 1, neutral: 0, disliked: -3 };
const RECENT_DAYS = 90;
export const EXCLUDE_BELOW = -4;

export function ratingScore(
  entries: RatingEntry[],
  childId: string,
  recipeId: string,
  onDate: string,
): number {
  const now = Date.parse(onDate);
  let score = 0;
  for (const e of entries) {
    if (e.childId !== childId || e.recipeId !== recipeId) continue;
    const ageDays = (now - Date.parse(e.date)) / 86_400_000;
    score += POINTS[e.rating] * (ageDays < RECENT_DAYS ? 2 : 1);
  }
  return score;
}
