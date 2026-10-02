import { allergenConflicts, allergensInName } from "./allergens";
import type { Allergen, Child, CookMethod, FoodGroup, Ingredient, MealRole, ProteinGroup, Recipe, ShoppingCategory } from "./types";

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

// --- Adapting an outside recipe (pasted text or a photo) for the kids -------------------------

export type NewIngredientSuggestion = {
  name: string;
  category: ShoppingCategory;
  foodGroup: FoodGroup;
  unit: Ingredient["unit"];
};

export type AdaptedRecipe = {
  title: string;
  cookMethod: CookMethod;
  proteinGroup: ProteinGroup | "none";
  ingredients: {
    ingredientId: string; // a catalog id, or "NEW" when newIngredient is set
    newIngredient: NewIngredientSuggestion | null;
    amountPerPortion: number;
  }[];
  instructions: string[];
  changes: string[];
};

export type AdaptedRow = {
  name: string;
  amount: number;
  isNew: boolean;
  unit: Ingredient["unit"];
  category?: ShoppingCategory;
  foodGroup?: FoodGroup;
  allergens: Allergen[];
  needsLabelCheck: boolean;
};

export type AdaptedDraft = {
  title: string;
  role: MealRole;
  minAgeMonths: number;
  proteinGroup?: ProteinGroup;
  cookMethod: CookMethod;
  instructions: string[];
  rows: AdaptedRow[];
  changes: string[];
};

export type AdaptValidation = { ok: true; draft: AdaptedDraft } | { ok: false; reason: string };

const MAX_CHANGES = 10;

export function validateAdapted(
  role: MealRole,
  gen: AdaptedRecipe,
  allowed: Ingredient[],
  everything: Ingredient[],
  children: Child[],
): AdaptValidation {
  const allowedById = new Map(allowed.map((i) => [i.id, i]));
  const allowedByName = new Map(allowed.map((i) => [i.name, i]));
  const blockedNames = new Set(everything.filter((i) => !allowedById.has(i.id)).map((i) => i.name));
  const childAllergens = new Set(children.flatMap((c) => c.allergens));

  const title = gen.title.trim();
  if (!title || title.length > 120) return { ok: false, reason: "ชื่อเมนูไม่ถูกต้อง" };
  const steps = gen.instructions.map((s) => s.trim()).filter(Boolean);
  if (steps.length === 0 || steps.length > MAX_STEPS) return { ok: false, reason: "จำนวนขั้นตอนไม่ถูกต้อง" };

  const changes = gen.changes.map((c) => c.trim()).filter(Boolean).slice(0, MAX_CHANGES);
  const rows: AdaptedRow[] = [];
  const seen = new Set<string>();
  const temp = new Map<string, Ingredient>(allowedById);
  const ids: { ingredientId: string; amountPerPortion: number }[] = [];

  for (const g of gen.ingredients) {
    let ing: Ingredient | undefined;
    let suggestion: NewIngredientSuggestion | undefined;
    if (g.ingredientId !== "NEW") {
      ing = allowedById.get(g.ingredientId);
      if (!ing) return { ok: false, reason: `วัตถุดิบ ${g.ingredientId} ไม่อยู่ในรายการที่อนุญาต` };
    } else {
      const n = g.newIngredient;
      const name = n?.name.trim() ?? "";
      if (!n || !name || name.length > 80) return { ok: false, reason: "ข้อมูลวัตถุดิบใหม่ไม่ครบ" };
      ing = allowedByName.get(name);
      if (!ing) {
        const hits = allergensInName(name).filter((a) => childAllergens.has(a));
        if (blockedNames.has(name) || hits.length > 0) {
          changes.push(`ตัด "${name}" ออก เพราะไม่ปลอดภัยสำหรับลูก`);
          continue;
        }
        suggestion = { ...n, name };
      }
    }

    const name = ing?.name ?? suggestion!.name;
    const unit = ing?.unit ?? suggestion!.unit;
    if (seen.has(name)) return { ok: false, reason: "วัตถุดิบซ้ำกัน" };
    seen.add(name);
    if (!(g.amountPerPortion > 0 && g.amountPerPortion <= MAX_AMOUNT[unit])) {
      return { ok: false, reason: `ปริมาณของ ${name} ไม่สมเหตุสมผล` };
    }

    if (suggestion) {
      const id = `new:${name}`;
      temp.set(id, { id, name, category: suggestion.category, foodGroup: suggestion.foodGroup, unit, allergens: [] });
      ids.push({ ingredientId: id, amountPerPortion: g.amountPerPortion });
      rows.push({
        name,
        amount: g.amountPerPortion,
        isNew: true,
        unit,
        category: suggestion.category,
        foodGroup: suggestion.foodGroup,
        allergens: allergensInName(name),
        needsLabelCheck: suggestion.category === "pantry" || suggestion.foodGroup === "seasoning",
      });
    } else {
      ids.push({ ingredientId: ing!.id, amountPerPortion: g.amountPerPortion });
      rows.push({ name, amount: g.amountPerPortion, isNew: false, unit, allergens: [], needsLabelCheck: false });
    }
  }

  if (rows.length === 0 || rows.length > MAX_INGREDIENTS) return { ok: false, reason: "จำนวนวัตถุดิบไม่ถูกต้อง" };
  const protein = gen.proteinGroup === "none" ? undefined : gen.proteinGroup;
  if (role === "main") {
    if (!protein) return { ok: false, reason: "กับข้าวต้องระบุโปรตีนหลัก" };
    if (!ids.some((r) => allowedById.get(r.ingredientId)?.proteinGroup === protein)) {
      return { ok: false, reason: "โปรตีนหลักต้องเป็นวัตถุดิบที่มีในรายการ" };
    }
  }

  const recipe: Recipe = {
    id: "ai-adapted",
    title,
    role,
    minAgeMonths: minAgeFor(role),
    proteinGroup: protein,
    cookMethod: gen.cookMethod,
    ingredients: ids,
    instructions: steps,
  };
  // Same final gate as everything else; new ingredients are scanned by name.
  for (const child of children) {
    if (allergenConflicts(recipe, child, temp).length > 0) return { ok: false, reason: "พบสารก่อภูมิแพ้" };
  }

  return {
    ok: true,
    draft: {
      title,
      role,
      minAgeMonths: recipe.minAgeMonths,
      proteinGroup: protein,
      cookMethod: gen.cookMethod,
      instructions: steps,
      rows,
      changes,
    },
  };
}
