import { allergenConflicts, allergensInName } from "./allergens";
import type { Child, CookMethod, Ingredient, MealRole, ProteinGroup, Recipe } from "./types";

// Pure helpers around AI recipe generation. The model never sees children's data: it only gets
// the ingredients that are safe for every child in the household, and whatever it returns is
// re-checked here before the user ever sees it.

export type GeneratedRecipe = {
  title: string;
  cookMethod: CookMethod;
  ingredients: { ingredientId: string; amountPerPortion: number }[];
  instructions: string[];
};

const PUREE_GROUPS = ["carb", "protein", "vegetable", "fruit"];
const PUREE_MIN_AGE = 6;
const MAX_INGREDIENTS = 12;
const MAX_STEPS = 12;
const MAX_AMOUNT: Record<Ingredient["unit"], number> = { g: 500, ml: 300, piece: 5 };

export function minAgeFor(role: MealRole): number {
  return role === "puree" ? PUREE_MIN_AGE : 12;
}

function safeForEveryone(ing: Ingredient, children: Child[]): boolean {
  const present = new Set([...ing.allergens, ...allergensInName(ing.name)]);
  return children.every((c) => c.allergens.every((a) => !present.has(a)));
}

export function allowedIngredients(
  role: MealRole,
  proteinGroup: ProteinGroup | undefined,
  children: Child[],
  ingredients: Ingredient[],
): Ingredient[] {
  return ingredients.filter((ing) => {
    if (!safeForEveryone(ing, children)) return false;
    if (role === "puree") return PUREE_GROUPS.includes(ing.foodGroup) && (ing.minAgeMonths ?? 0) <= PUREE_MIN_AGE;
    // One main protein per week: keep other proteins out of a main dish.
    if (role === "main" && ing.proteinGroup && ing.proteinGroup !== proteinGroup) return false;
    return true;
  });
}

export type Validation = { ok: true; recipe: Recipe } | { ok: false; reason: string };

export function validateGenerated(
  role: MealRole,
  proteinGroup: ProteinGroup | undefined,
  gen: GeneratedRecipe,
  allowed: Ingredient[],
  children: Child[],
): Validation {
  const byId = new Map(allowed.map((i) => [i.id, i]));
  const title = gen.title.trim();
  if (!title || title.length > 120) return { ok: false, reason: "ชื่อเมนูไม่ถูกต้อง" };

  const ids = gen.ingredients.map((i) => i.ingredientId);
  if (ids.length === 0 || ids.length > MAX_INGREDIENTS) return { ok: false, reason: "จำนวนวัตถุดิบไม่ถูกต้อง" };
  if (new Set(ids).size !== ids.length) return { ok: false, reason: "วัตถุดิบซ้ำกัน" };
  if (role === "puree" && ids.length !== 1) return { ok: false, reason: "อาหารบดต้องมีวัตถุดิบเดียว" };

  for (const row of gen.ingredients) {
    const ing = byId.get(row.ingredientId);
    if (!ing) return { ok: false, reason: `วัตถุดิบ ${row.ingredientId} ไม่อยู่ในรายการที่อนุญาต` };
    if (!(row.amountPerPortion > 0 && row.amountPerPortion <= MAX_AMOUNT[ing.unit])) {
      return { ok: false, reason: `ปริมาณของ ${ing.name} ไม่สมเหตุสมผล` };
    }
  }
  if (role === "main" && !gen.ingredients.some((r) => byId.get(r.ingredientId)?.proteinGroup === proteinGroup)) {
    return { ok: false, reason: "กับข้าวต้องมีโปรตีนหลักของสัปดาห์" };
  }

  const steps = gen.instructions.map((s) => s.trim()).filter(Boolean);
  if (steps.length === 0 || steps.length > MAX_STEPS) return { ok: false, reason: "จำนวนขั้นตอนไม่ถูกต้อง" };

  const recipe: Recipe = {
    id: "ai-draft",
    title,
    role,
    minAgeMonths: minAgeFor(role),
    proteinGroup: role === "main" ? proteinGroup : gen.ingredients.map((r) => byId.get(r.ingredientId)?.proteinGroup).find(Boolean),
    cookMethod: gen.cookMethod,
    ingredients: gen.ingredients,
    instructions: steps,
  };

  // Final deterministic gate, same check the planner uses. Title is covered by the keyword scan.
  for (const child of children) {
    if (allergenConflicts(recipe, child, byId).length > 0) return { ok: false, reason: "พบสารก่อภูมิแพ้" };
  }
  return { ok: true, recipe };
}
