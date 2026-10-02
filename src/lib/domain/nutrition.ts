import { ageInMonths, stageOf } from "./age";
import type { Child, FoodGroup, Ingredient, Recipe, WeeklyPlan } from "./types";

export type NutritionCheck = {
  childId: string;
  code: "missing_group" | "iron" | "calcium" | "fish" | "veg_colors" | "baby_seasoning";
  severity: "warn" | "info";
  message: string;
};

const GROUP_LABELS: Partial<Record<FoodGroup, string>> = {
  carb: "ข้าว/แป้ง",
  protein: "โปรตีน",
  vegetable: "ผัก",
  fruit: "ผลไม้",
};

export function checkPlan(
  plan: WeeklyPlan,
  history: WeeklyPlan[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  children: Child[],
): NutritionCheck[] {
  const recipeById = new Map(recipes.map((r) => [r.id, r]));
  const ingById = new Map(ingredients.map((i) => [i.id, i]));
  const checks: NutritionCheck[] = [];

  for (const child of children) {
    const stage = stageOf(child, plan.weekStart);
    const ings = plan.items
      .filter((i) => i.childId === child.id)
      .flatMap((i) => recipeById.get(i.recipeId)?.ingredients ?? [])
      .map((ri) => ingById.get(ri.ingredientId))
      .filter((x): x is Ingredient => !!x);
    if (ings.length === 0) continue;

    const groups = new Set(ings.map((i) => i.foodGroup));
    const required: FoodGroup[] = stage === "puree" ? ["carb", "protein", "vegetable", "fruit"] : ["carb", "protein", "vegetable"];
    for (const g of required) {
      if (!groups.has(g)) {
        checks.push({ childId: child.id, code: "missing_group", severity: "warn", message: `ยังไม่มีหมู่${GROUP_LABELS[g]}ในชุดนี้` });
      }
    }

    if (!ings.some((i) => i.ironRich)) {
      checks.push({
        childId: child.id,
        code: "iron",
        severity: "warn",
        message:
          stage === "puree"
            ? "ยังไม่มีแหล่งธาตุเหล็ก เด็กวัยนี้ต้องการธาตุเหล็กสูงมาก ลองเพิ่มไข่แดง ตับ หรือเนื้อแดงบด"
            : "ยังไม่มีแหล่งธาตุเหล็ก ลองเพิ่มไข่แดง ตับ เนื้อแดง หรือผักใบเขียวเข้ม",
      });
    }

    if (!ings.some((i) => i.calciumRich)) {
      checks.push({
        childId: child.id,
        code: "calcium",
        severity: "info",
        message: "ชุดนี้แคลเซียมน้อย ถ้าลูกดื่มนมได้ตามวัยก็ไม่เป็นไร ไม่งั้นลองเพิ่มเต้าหู้แข็ง ปลาตัวเล็ก หรือผักใบเขียว",
      });
    }

    const fishThisWeek = ings.some((i) => i.proteinGroup === "fish");
    const lastWeek = [...history]
      .filter((p) => p.weekStart < plan.weekStart)
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
    const fishLastWeek = lastWeek?.items
      .filter((i) => i.childId === child.id)
      .some((i) => recipeById.get(i.recipeId)?.ingredients.some((ri) => ingById.get(ri.ingredientId)?.proteinGroup === "fish"));
    if (!fishThisWeek && !fishLastWeek && !child.allergens.includes("fish")) {
      checks.push({ childId: child.id, code: "fish", severity: "info", message: "2 สัปดาห์แล้วที่ไม่มีปลา (แหล่ง DHA) ลองเพิ่มปลาสัก 1 เมนู" });
    }

    const vegColors = new Set(ings.filter((i) => i.foodGroup === "vegetable" && i.color).map((i) => i.color));
    if (vegColors.size < 2) {
      checks.push({ childId: child.id, code: "veg_colors", severity: "info", message: "ผักสัปดาห์นี้มีสีเดียว ลองสลับให้มีหลายสี" });
    }

    if (stage === "puree") {
      const age = ageInMonths(child.birthDate, plan.weekStart);
      const early = ings.filter((i) => (i.minAgeMonths ?? 0) > age);
      if (early.length > 0) {
        checks.push({
          childId: child.id,
          code: "baby_seasoning",
          severity: "warn",
          message: `ไม่เหมาะกับวัยนี้: ${[...new Set(early.map((i) => i.name))].join(", ")}`,
        });
      }
    }
  }
  return checks;
}
