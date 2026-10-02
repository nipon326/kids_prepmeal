import type { Child, Ingredient, Recipe, ShoppingCategory, WeeklyPlan } from "./types";

export const CATEGORY_ORDER: ShoppingCategory[] = [
  "meat",
  "seafood",
  "egg_dairy",
  "vegetable",
  "fruit",
  "grain",
  "pantry",
];

export const CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  meat: "เนื้อสัตว์",
  seafood: "อาหารทะเล",
  egg_dairy: "ไข่ / นม",
  vegetable: "ผัก",
  fruit: "ผลไม้",
  grain: "ข้าว / แป้ง",
  pantry: "เครื่องปรุง (เช็กว่ายังมีที่บ้าน)",
};

export type ShoppingLine = {
  ingredientId: string;
  name: string;
  category: ShoppingCategory;
  needed: number;
  unit: Ingredient["unit"];
  packs?: { count: number; label: string; size: number };
  checkOnly: boolean;
};

const BUFFER = 1.1;

function roundUp(amount: number, unit: Ingredient["unit"]): number {
  if (unit === "piece") return Math.ceil(amount);
  return Math.ceil(amount / 10) * 10;
}

export function buildShoppingList(
  plan: WeeklyPlan,
  recipes: Recipe[],
  ingredients: Ingredient[],
  children: Child[],
): ShoppingLine[] {
  const recipeById = new Map(recipes.map((r) => [r.id, r]));
  const ingById = new Map(ingredients.map((i) => [i.id, i]));
  const scaleByChild = new Map(children.map((c) => [c.id, c.portionScale]));
  const totals = new Map<string, number>();

  for (const item of plan.items) {
    const recipe = recipeById.get(item.recipeId);
    if (!recipe) continue;
    const scale = scaleByChild.get(item.childId) ?? 1;
    for (const ri of recipe.ingredients) {
      const add = ri.amountPerPortion * item.portions * scale;
      totals.set(ri.ingredientId, (totals.get(ri.ingredientId) ?? 0) + add);
    }
  }

  const lines: ShoppingLine[] = [];
  for (const [id, raw] of totals) {
    const ing = ingById.get(id);
    if (!ing) continue;
    const checkOnly = ing.category === "pantry";
    const needed = roundUp(raw * BUFFER, ing.unit);
    lines.push({
      ingredientId: id,
      name: ing.name,
      category: ing.category,
      needed,
      unit: ing.unit,
      packs:
        ing.pack && !checkOnly
          ? { count: Math.ceil(needed / ing.pack.size), label: ing.pack.label, size: ing.pack.size }
          : undefined,
      checkOnly,
    });
  }

  return lines.sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      a.name.localeCompare(b.name, "th"),
  );
}

export function formatAmount(amount: number, unit: Ingredient["unit"]): string {
  if (unit === "piece") return `${amount} ชิ้น`;
  if (unit === "ml") return amount >= 1000 ? `${(amount / 1000).toFixed(1)} ลิตร` : `${amount} มล.`;
  return amount >= 1000 ? `${(amount / 1000).toFixed(1)} กก.` : `${amount} ก.`;
}
