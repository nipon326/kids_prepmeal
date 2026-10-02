import {
  ageInMonths,
  babyMealsPerDay,
  splitPortions,
  stageOf,
  TODDLER_MAIN_COUNT,
  TODDLER_MAIN_MEALS_PER_WEEK,
} from "./age";
import { allergenConflicts, PROTEIN_ALLERGEN } from "./allergens";
import { EXCLUDE_BELOW, ratingScore } from "./ratings";
import type {
  Child,
  FoodGroup,
  Ingredient,
  MealRole,
  PlanItem,
  ProteinGroup,
  RatingEntry,
  Recipe,
  VegColor,
  WeeklyPlan,
} from "./types";

export const ROTATION: ProteinGroup[] = ["pork", "chicken", "fish", "beef", "shrimp", "tofu"];
export const LOW_IRON_PROTEINS: ProteinGroup[] = ["chicken", "fish", "shrimp", "tofu"];

export type PureeGroup = Extract<FoodGroup, "carb" | "protein" | "vegetable" | "fruit">;

const PUREE_SLOTS: { group: PureeGroup; count: number }[] = [
  { group: "protein", count: 1 },
  { group: "carb", count: 1 },
  { group: "vegetable", count: 2 },
  { group: "fruit", count: 1 },
];
const MAX_NEW_FOODS_PER_WEEK = 2;
const FRUIT_PORTIONS_PER_WEEK = 7;
const BREAKFAST_PORTIONS_PER_WEEK = 7;

export type PlannerInput = {
  weekStart: string;
  children: Child[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  ratings: RatingEntry[];
  history: WeeklyPlan[];
  proteinGroup?: ProteinGroup;
};

export type Shortfall = {
  childId: string;
  role: MealRole;
  group?: PureeGroup;
  proteinGroup?: ProteinGroup;
  needed: number;
  found: number;
};

export type PlannerResult = { plan: WeeklyPlan; shortfalls: Shortfall[] };

type Ctx = PlannerInput & { ing: Map<string, Ingredient> };

const WEEK_MS = 7 * 86_400_000;

function weeksBetween(later: string, earlier: string): number {
  return Math.round((Date.parse(later) - Date.parse(earlier)) / WEEK_MS);
}

function weeksSinceRecipe(c: Ctx, childId: string, recipeId: string): number {
  let best = Infinity;
  for (const p of c.history) {
    if (p.items.some((i) => i.childId === childId && i.recipeId === recipeId)) {
      best = Math.min(best, weeksBetween(c.weekStart, p.weekStart));
    }
  }
  return best;
}

function weeksSinceProtein(c: Ctx, protein: ProteinGroup): number {
  let best = Infinity;
  for (const p of c.history) {
    if (p.proteinGroup === protein) best = Math.min(best, weeksBetween(c.weekStart, p.weekStart));
  }
  return best;
}

const RECENCY_PENALTY = [0, -6, -3, -1];

function recencyPenalty(weeks: number): number {
  return weeks < RECENCY_PENALTY.length ? RECENCY_PENALTY[weeks] : 0;
}

function fitsChild(c: Ctx, recipe: Recipe, child: Child): boolean {
  const age = ageInMonths(child.birthDate, c.weekStart);
  if (age < recipe.minAgeMonths) return false;
  if (recipe.maxAgeMonths !== undefined && age > recipe.maxAgeMonths) return false;
  if (allergenConflicts(recipe, child, c.ing).length > 0) return false;
  return recipe.ingredients.every((ri) => (c.ing.get(ri.ingredientId)?.minAgeMonths ?? 0) <= age);
}

function usable(c: Ctx, recipe: Recipe, child: Child): boolean {
  return (
    fitsChild(c, recipe, child) &&
    ratingScore(c.ratings, child.id, recipe.id, c.weekStart) >= EXCLUDE_BELOW
  );
}

function baseScore(c: Ctx, recipe: Recipe, child: Child): number {
  return (
    ratingScore(c.ratings, child.id, recipe.id, c.weekStart) +
    recencyPenalty(weeksSinceRecipe(c, child.id, recipe.id))
  );
}

function hasIron(c: Ctx, recipe: Recipe): boolean {
  return recipe.ingredients.some((ri) => c.ing.get(ri.ingredientId)?.ironRich);
}

function colors(c: Ctx, recipe: Recipe): VegColor[] {
  return recipe.ingredients
    .map((ri) => c.ing.get(ri.ingredientId)?.color)
    .filter((x): x is VegColor => !!x);
}

export function pureeGroupOf(recipe: Recipe, ing: Map<string, Ingredient>): PureeGroup | undefined {
  const main = [...recipe.ingredients].sort((a, b) => b.amountPerPortion - a.amountPerPortion)[0];
  const g = main && ing.get(main.ingredientId)?.foodGroup;
  return g === "carb" || g === "protein" || g === "vegetable" || g === "fruit" ? g : undefined;
}

function newIngredientsFor(c: Ctx, recipe: Recipe, child: Child): string[] {
  const known = new Set(child.introducedIngredientIds);
  return recipe.ingredients
    .map((ri) => ri.ingredientId)
    .filter((id) => !known.has(id) && c.ing.get(id)?.foodGroup !== "seasoning");
}

function pickDiverse(
  c: Ctx,
  candidates: Recipe[],
  n: number,
  score: (r: Recipe) => number,
  alreadyChosen: Recipe[] = [],
): Recipe[] {
  const chosen: Recipe[] = [];
  const methods = new Set<string>(alreadyChosen.map((r) => r.cookMethod));
  const seenColors = new Set<VegColor>(alreadyChosen.flatMap((r) => colors(c, r)));
  const pool = [...candidates];
  while (chosen.length < n && pool.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    pool.forEach((r, i) => {
      const s =
        score(r) +
        (methods.has(r.cookMethod) ? 0 : 2) +
        colors(c, r).filter((col) => !seenColors.has(col)).length;
      if (s > bestScore || (s === bestScore && r.id < pool[bestIdx].id)) {
        bestScore = s;
        bestIdx = i;
      }
    });
    const [pick] = pool.splice(bestIdx, 1);
    chosen.push(pick);
    methods.add(pick.cookMethod);
    colors(c, pick).forEach((col) => seenColors.add(col));
  }
  return chosen;
}

function toddlerChildren(c: Ctx): Child[] {
  return c.children.filter((ch) => stageOf(ch, c.weekStart) === "toddler");
}

function proteinAllowed(c: Ctx, p: ProteinGroup): boolean {
  const allergen = PROTEIN_ALLERGEN[p];
  const relevant = toddlerChildren(c).length > 0 ? toddlerChildren(c) : c.children;
  return !allergen || relevant.every((ch) => !ch.allergens.includes(allergen));
}

function mainCandidates(c: Ctx, child: Child, protein: ProteinGroup): Recipe[] {
  return c.recipes.filter(
    (r) => r.role === "main" && r.proteinGroup === protein && usable(c, r, child),
  );
}

export function chooseProtein(input: PlannerInput): ProteinGroup {
  if (input.proteinGroup) return input.proteinGroup;
  const c = toCtx(input);
  const allowed = ROTATION.filter((p) => proteinAllowed(c, p));
  const options = allowed.length > 0 ? allowed : ROTATION;
  const supply = (p: ProteinGroup) =>
    toddlerChildren(c).reduce((n, ch) => n + mainCandidates(c, ch, p).length, 0);
  return [...options].sort((a, b) => {
    const wa = Math.min(weeksSinceProtein(c, a), 99);
    const wb = Math.min(weeksSinceProtein(c, b), 99);
    if (wa !== wb) return wb - wa;
    const sa = Math.min(supply(a), TODDLER_MAIN_COUNT);
    const sb = Math.min(supply(b), TODDLER_MAIN_COUNT);
    if (sa !== sb) return sb - sa;
    return ROTATION.indexOf(a) - ROTATION.indexOf(b);
  })[0];
}

function toCtx(input: PlannerInput): Ctx {
  return { ...input, ing: new Map(input.ingredients.map((i) => [i.id, i])) };
}

function planToddler(c: Ctx, child: Child, protein: ProteinGroup, items: PlanItem[], shortfalls: Shortfall[]) {
  const mains = pickDiverse(c, mainCandidates(c, child, protein), TODDLER_MAIN_COUNT, (r) =>
    baseScore(c, r, child),
  );
  if (mains.length < TODDLER_MAIN_COUNT) {
    shortfalls.push({ childId: child.id, role: "main", proteinGroup: protein, needed: TODDLER_MAIN_COUNT, found: mains.length });
  }
  if (mains.length > 0) {
    const portions = splitPortions(TODDLER_MAIN_MEALS_PER_WEEK, mains.length);
    mains.forEach((r, i) => items.push({ childId: child.id, recipeId: r.id, role: "main", portions: portions[i] }));
  }

  const breakfast = rankBreakfast(c, child, protein)[0];
  if (breakfast) {
    items.push({ childId: child.id, recipeId: breakfast.id, role: "breakfast", portions: BREAKFAST_PORTIONS_PER_WEEK });
  } else {
    shortfalls.push({ childId: child.id, role: "breakfast", needed: 1, found: 0 });
  }
}

function breakfastScore(c: Ctx, r: Recipe, child: Child, protein: ProteinGroup): number {
  const ironBonus = LOW_IRON_PROTEINS.includes(protein) && hasIron(c, r) ? 3 : 0;
  return baseScore(c, r, child) + ironBonus;
}

function rankBreakfast(c: Ctx, child: Child, protein: ProteinGroup): Recipe[] {
  return c.recipes
    .filter((r) => r.role === "breakfast" && usable(c, r, child))
    .sort((a, b) => breakfastScore(c, b, child, protein) - breakfastScore(c, a, child, protein) || a.id.localeCompare(b.id));
}

function pureeScore(c: Ctx, r: Recipe, child: Child, group: PureeGroup, protein: ProteinGroup): number {
  let s = baseScore(c, r, child);
  if (group === "protein" && r.proteinGroup === protein) s += 4;
  if ((group === "protein" || group === "carb") && hasIron(c, r)) s += 2;
  if (newIngredientsFor(c, r, child).length === 1) s += 1;
  return s;
}

function pureeCandidates(
  c: Ctx,
  child: Child,
  group: PureeGroup,
  newFoods: string[],
  taken: Set<string>,
): Recipe[] {
  return c.recipes.filter((r) => {
    if (r.role !== "puree" || taken.has(r.id) || !usable(c, r, child)) return false;
    if (pureeGroupOf(r, c.ing) !== group) return false;
    const fresh = newIngredientsFor(c, r, child).filter((id) => !newFoods.includes(id));
    return fresh.length === 0 || (fresh.length === 1 && newFoods.length < MAX_NEW_FOODS_PER_WEEK);
  });
}

function planBaby(
  c: Ctx,
  child: Child,
  protein: ProteinGroup,
  items: PlanItem[],
  newFoods: WeeklyPlan["newFoods"],
  shortfalls: Shortfall[],
) {
  const meals = babyMealsPerDay(ageInMonths(child.birthDate, c.weekStart)) * 7;
  const introduced: string[] = [];
  const taken = new Set<string>();

  for (const { group, count } of PUREE_SLOTS) {
    const picked: Recipe[] = [];
    for (let i = 0; i < count; i++) {
      const candidates = pureeCandidates(c, child, group, introduced, taken);
      const [best] = pickDiverse(c, candidates, 1, (r) => pureeScore(c, r, child, group, protein), picked);
      if (!best) break;
      picked.push(best);
      taken.add(best.id);
      for (const id of newIngredientsFor(c, best, child)) {
        if (!introduced.includes(id)) introduced.push(id);
      }
    }
    if (picked.length < count) {
      shortfalls.push({ childId: child.id, role: "puree", group, needed: count, found: picked.length });
    }
    const total = group === "fruit" ? FRUIT_PORTIONS_PER_WEEK : meals;
    const portions = splitPortions(total, Math.max(picked.length, 1));
    picked.forEach((r, i) => items.push({ childId: child.id, recipeId: r.id, role: "puree", portions: portions[i] }));
  }
  introduced.forEach((ingredientId) => newFoods.push({ childId: child.id, ingredientId }));
}

export function generatePlan(input: PlannerInput): PlannerResult {
  const c = toCtx(input);
  const proteinGroup = chooseProtein(input);
  const items: PlanItem[] = [];
  const newFoods: WeeklyPlan["newFoods"] = [];
  const shortfalls: Shortfall[] = [];

  for (const child of c.children) {
    if (stageOf(child, c.weekStart) === "toddler") planToddler(c, child, proteinGroup, items, shortfalls);
    else planBaby(c, child, proteinGroup, items, newFoods, shortfalls);
  }

  return { plan: { weekStart: input.weekStart, proteinGroup, items, newFoods }, shortfalls };
}

export function findShortfalls(input: PlannerInput, plan: WeeklyPlan): Shortfall[] {
  const c = toCtx(input);
  const out: Shortfall[] = [];
  for (const child of c.children) {
    const mine = plan.items.filter((i) => i.childId === child.id);
    if (stageOf(child, c.weekStart) === "toddler") {
      const mains = mine.filter((i) => i.role === "main").length;
      if (mains < TODDLER_MAIN_COUNT) {
        out.push({ childId: child.id, role: "main", proteinGroup: plan.proteinGroup, needed: TODDLER_MAIN_COUNT, found: mains });
      }
      if (!mine.some((i) => i.role === "breakfast")) {
        out.push({ childId: child.id, role: "breakfast", needed: 1, found: 0 });
      }
    } else {
      for (const { group, count } of PUREE_SLOTS) {
        const found = mine.filter((i) => {
          const r = c.recipes.find((x) => x.id === i.recipeId);
          return i.role === "puree" && r && pureeGroupOf(r, c.ing) === group;
        }).length;
        if (found < count) out.push({ childId: child.id, role: "puree", group, needed: count, found });
      }
    }
  }
  return out;
}

export function replaceInPlan(
  input: PlannerInput,
  plan: WeeklyPlan,
  childId: string,
  oldRecipeId: string,
  newRecipeId: string,
): WeeklyPlan {
  const c = toCtx(input);
  const items = plan.items.map((i) =>
    i.childId === childId && i.recipeId === oldRecipeId ? { ...i, recipeId: newRecipeId } : i,
  );
  const child = c.children.find((ch) => ch.id === childId);
  if (!child || stageOf(child, c.weekStart) === "toddler") return { ...plan, items };

  const fresh = new Set<string>();
  for (const item of items.filter((i) => i.childId === childId)) {
    const recipe = c.recipes.find((r) => r.id === item.recipeId);
    if (recipe) newIngredientsFor(c, recipe, child).forEach((id) => fresh.add(id));
  }
  const newFoods = [
    ...plan.newFoods.filter((n) => n.childId !== childId),
    ...[...fresh].map((ingredientId) => ({ childId, ingredientId })),
  ];
  return { ...plan, items, newFoods };
}

export function alternatives(
  input: PlannerInput,
  plan: WeeklyPlan,
  childId: string,
  recipeId: string,
  limit = 5,
): Recipe[] {
  const c = toCtx(input);
  const child = c.children.find((ch) => ch.id === childId);
  const current = c.recipes.find((r) => r.id === recipeId);
  if (!child || !current) return [];
  const inPlan = new Set(plan.items.filter((i) => i.childId === childId).map((i) => i.recipeId));
  const protein = plan.proteinGroup;

  let ranked: Recipe[];
  if (current.role === "main") {
    ranked = mainCandidates(c, child, protein).sort(
      (a, b) => baseScore(c, b, child) - baseScore(c, a, child) || a.id.localeCompare(b.id),
    );
  } else if (current.role === "breakfast") {
    ranked = rankBreakfast(c, child, protein);
  } else {
    const group = pureeGroupOf(current, c.ing);
    if (!group) return [];
    const otherNew = plan.newFoods
      .filter((n) => n.childId === childId && !current.ingredients.some((ri) => ri.ingredientId === n.ingredientId))
      .map((n) => n.ingredientId);
    ranked = pureeCandidates(c, child, group, otherNew, inPlan).sort(
      (a, b) => pureeScore(c, b, child, group, protein) - pureeScore(c, a, child, group, protein) || a.id.localeCompare(b.id),
    );
  }
  return ranked.filter((r) => !inPlan.has(r.id)).slice(0, limit);
}
