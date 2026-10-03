import { describe, expect, it } from "vitest";
import { STARTER_INGREDIENTS, STARTER_RECIPES } from "@/data/catalog";
import { ageInMonths } from "./age";
import { allergenConflicts } from "./allergens";
import { checkPlan } from "./nutrition";
import { alternatives, findShortfalls, generatePlan, replaceInPlan, type PlannerInput } from "./planner";
import { buildShoppingList } from "./shopping";
import type { Child, CookMethod, MealRole, ProteinGroup, Recipe, WeeklyPlan } from "./types";

const WEEK = "2026-10-05";
const ing = new Map(STARTER_INGREDIENTS.map((i) => [i.id, i]));

const elder: Child = {
  id: "elder",
  name: "พี่",
  birthDate: "2024-09-01",
  allergens: ["gluten"],
  portionScale: 1,
  introducedIngredientIds: [],
};

const baby: Child = {
  id: "baby",
  name: "น้อง",
  birthDate: "2026-01-15",
  allergens: [],
  portionScale: 1,
  introducedIngredientIds: ["jasmine_rice", "pumpkin", "carrot", "banana", "chicken_breast", "spinach"],
};

function r(
  id: string,
  role: MealRole,
  cookMethod: CookMethod,
  ingredients: [string, number][],
  opts: { protein?: ProteinGroup; minAge?: number; title?: string } = {},
): Recipe {
  return {
    id,
    title: opts.title ?? id,
    role,
    cookMethod,
    proteinGroup: opts.protein,
    minAgeMonths: opts.minAge ?? (role === "puree" ? 6 : 12),
    ingredients: ingredients.map(([ingredientId, amountPerPortion]) => ({ ingredientId, amountPerPortion })),
    instructions: [],
  };
}

const RECIPES: Recipe[] = [
  r("pork_soup", "main", "boil", [["pork_minced", 40], ["winter_melon", 50], ["jasmine_rice", 60]], { protein: "pork" }),
  r("pork_stirfry", "main", "stir_fry", [["pork_tenderloin", 40], ["chinese_kale", 40], ["jasmine_rice", 60], ["soy_sauce_gf", 3]], { protein: "pork" }),
  r("pork_steam", "main", "steam", [["pork_minced", 40], ["egg", 0.5], ["carrot", 30], ["jasmine_rice", 60]], { protein: "pork" }),
  r("pork_stew", "main", "stew", [["pork_tenderloin", 40], ["pumpkin", 50], ["jasmine_rice", 60]], { protein: "pork" }),
  r("pork_soup2", "main", "boil", [["pork_minced", 40], ["cabbage", 50], ["jasmine_rice", 60]], { protein: "pork" }),
  r("pork_bread", "main", "fry", [["pork_minced", 40]], { protein: "pork", title: "หมูชุบเกล็ดขนมปังทอด" }),
  r("chicken_soup", "main", "boil", [["chicken_breast", 40], ["carrot", 40], ["jasmine_rice", 60]], { protein: "chicken" }),
  r("chicken_stirfry", "main", "stir_fry", [["chicken_thigh", 40], ["broccoli", 40], ["jasmine_rice", 60]], { protein: "chicken" }),
  r("egg_congee", "breakfast", "boil", [["jasmine_rice", 50], ["egg", 1], ["spinach", 20]]),
  r("banana_pancake", "breakfast", "fry", [["rice_flour", 30], ["banana", 1], ["egg", 1]]),

  r("p_rice", "puree", "blend", [["jasmine_rice", 20]]),
  r("p_chicken", "puree", "blend", [["chicken_breast", 20]], { protein: "chicken" }),
  r("p_liver", "puree", "blend", [["chicken_liver", 15]], { protein: "liver" }),
  r("p_pork", "puree", "blend", [["pork_minced", 20]], { protein: "pork" }),
  r("p_pumpkin", "puree", "blend", [["pumpkin", 30]]),
  r("p_carrot", "puree", "blend", [["carrot", 30]]),
  r("p_broccoli", "puree", "blend", [["broccoli", 30]]),
  r("p_kale", "puree", "blend", [["chinese_kale", 30]]),
  r("p_banana", "puree", "blend", [["banana", 0.5]]),
  r("p_salted", "puree", "blend", [["sweet_potato", 30], ["salt", 1]]),
];

function input(overrides: Partial<PlannerInput> = {}): PlannerInput {
  return {
    weekStart: WEEK,
    children: [elder, baby],
    recipes: RECIPES,
    ingredients: STARTER_INGREDIENTS,
    ratings: [],
    history: [],
    ...overrides,
  };
}

const itemsFor = (plan: WeeklyPlan, childId: string, role?: MealRole) =>
  plan.items.filter((i) => i.childId === childId && (!role || i.role === role));

describe("age", () => {
  it("counts whole months", () => {
    expect(ageInMonths("2024-09-01", WEEK)).toBe(25);
    expect(ageInMonths("2026-01-15", WEEK)).toBe(8);
    expect(ageInMonths("2026-01-15", "2026-02-14")).toBe(0);
  });
});

describe("allergens", () => {
  it("catches gluten from the recipe title even when ingredients look clean", () => {
    const recipe = RECIPES.find((x) => x.id === "pork_bread")!;
    expect(allergenConflicts(recipe, elder, ing)).toEqual(["gluten"]);
  });
});

describe("toddler plan", () => {
  const { plan, shortfalls } = generatePlan(input({ proteinGroup: "pork" }));
  const mains = itemsFor(plan, "elder", "main");

  it("picks 4 mains of the week's protein, never the gluten one", () => {
    expect(mains).toHaveLength(4);
    expect(mains.map((m) => m.recipeId)).not.toContain("pork_bread");
    expect(shortfalls.filter((s) => s.childId === "elder")).toEqual([]);
  });

  it("prefers different cooking methods", () => {
    const methods = mains.map((m) => RECIPES.find((x) => x.id === m.recipeId)!.cookMethod);
    expect(new Set(methods).size).toBe(4);
  });

  it("spreads 14 lunch+dinner portions and 7 breakfasts", () => {
    expect(mains.reduce((s, m) => s + m.portions, 0)).toBe(14);
    expect(itemsFor(plan, "elder", "breakfast")).toEqual([
      expect.objectContaining({ portions: 7 }),
    ]);
  });

  it("fills the mains with other proteins when the week's protein is short", () => {
    const res = generatePlan(input({ proteinGroup: "chicken" }));
    const mains = itemsFor(res.plan, "elder", "main").map((m) => RECIPES.find((r) => r.id === m.recipeId)!);
    expect(mains).toHaveLength(4);
    expect(mains.filter((m) => m.proteinGroup === "chicken")).toHaveLength(2);
    expect(res.shortfalls.filter((x) => x.role === "main")).toEqual([]);
  });

  it("reports a shortfall only when every protein together is too small", () => {
    const fewMains = RECIPES.filter((r) => r.role !== "main" || ["pork_soup", "chicken_soup"].includes(r.id));
    const res = generatePlan(input({ proteinGroup: "chicken", recipes: fewMains }));
    expect(res.shortfalls).toContainEqual(
      expect.objectContaining({ childId: "elder", role: "main", needed: 4, found: 2 }),
    );
  });

  it("does not anchor a week on a protein that has no mains", () => {
    const porkOnly = RECIPES.filter((r) => r.role !== "main" || r.proteinGroup === "pork");
    const lastWeek: WeeklyPlan = { weekStart: "2026-09-28", proteinGroup: "pork", items: [], newFoods: [] };
    expect(generatePlan(input({ recipes: porkOnly, history: [lastWeek] })).plan.proteinGroup).toBe("pork");
  });

  it("recomputes the same shortfalls from a saved plan", () => {
    for (const proteinGroup of ["pork", "chicken"] as const) {
      const res = generatePlan(input({ proteinGroup }));
      expect(findShortfalls(input(), res.plan)).toEqual(res.shortfalls);
    }
  });
});

describe("protein rotation", () => {
  it("does not repeat last week's protein", () => {
    const lastWeek: WeeklyPlan = { weekStart: "2026-09-28", proteinGroup: "pork", items: [], newFoods: [] };
    expect(generatePlan(input({ history: [lastWeek] })).plan.proteinGroup).not.toBe("pork");
  });

  it("with no history, prefers a protein that can fill all 4 mains", () => {
    expect(generatePlan(input()).plan.proteinGroup).toBe("pork");
  });

  it("penalises a main eaten last week", () => {
    const lastWeek: WeeklyPlan = {
      weekStart: "2026-09-28",
      proteinGroup: "pork",
      items: [{ childId: "elder", recipeId: "pork_soup", role: "main", portions: 4 }],
      newFoods: [],
    };
    const { plan } = generatePlan(input({ proteinGroup: "pork", history: [lastWeek] }));
    expect(itemsFor(plan, "elder", "main").map((m) => m.recipeId)).toContain("pork_soup2");
    expect(itemsFor(plan, "elder", "main").map((m) => m.recipeId)).not.toContain("pork_soup");
  });
});

describe("baby plan", () => {
  const { plan } = generatePlan(input({ proteinGroup: "pork" }));
  const purees = itemsFor(plan, "baby", "puree").map((i) => i.recipeId);

  it("never includes salt or other under-12-month ingredients", () => {
    expect(purees).not.toContain("p_salted");
  });

  it("introduces at most 2 new foods per week", () => {
    expect(plan.newFoods.filter((n) => n.childId === "baby").length).toBeLessThanOrEqual(2);
  });

  it("uses 2 meals/day at 8 months", () => {
    const carb = itemsFor(plan, "baby").find((i) => i.recipeId === "p_rice")!;
    expect(carb.portions).toBe(14);
  });

  it("recomputes new foods after a swap", () => {
    const current = purees.find((id) => id === "p_broccoli" || id === "p_kale");
    if (!current) return;
    const next = replaceInPlan(input(), plan, "baby", current, "p_carrot");
    const newIds = next.newFoods.filter((n) => n.childId === "baby").map((n) => n.ingredientId);
    expect(newIds).not.toContain(current === "p_broccoli" ? "broccoli" : "chinese_kale");
  });
});

describe("alternatives", () => {
  it("offers every usable main not already in the plan, the week's protein first", () => {
    const inp = input({ proteinGroup: "pork" });
    const { plan } = generatePlan(inp);
    const inPlan = new Set(itemsFor(plan, "elder", "main").map((m) => m.recipeId));
    const first = [...inPlan][0];
    const ids = alternatives(inp, plan, "elder", first, 50).map((x) => x.id);
    expect(ids[0]).toBe("pork_soup2");
    expect(ids).toContain("chicken_soup");
    expect(ids.some((id) => inPlan.has(id))).toBe(false);
  });
});

describe("shopping list", () => {
  it("sums across both kids and converts to packs", () => {
    const { plan } = generatePlan(input({ proteinGroup: "pork" }));
    const list = buildShoppingList(plan, RECIPES, STARTER_INGREDIENTS, [elder, baby]);
    const pork = list.find((l) => l.ingredientId === "pork_minced")!;
    expect(pork.needed).toBeGreaterThan(0);
    expect(pork.packs!.count).toBe(Math.ceil(pork.needed / 300));
    const soy = list.find((l) => l.ingredientId === "soy_sauce_gf");
    if (soy) expect(soy.checkOnly).toBe(true);
    expect(list[0].category).toBe("meat");
  });
});

describe("nutrition checks", () => {
  it("flags missing iron", () => {
    const plan: WeeklyPlan = {
      weekStart: WEEK,
      proteinGroup: "chicken",
      items: [{ childId: "elder", recipeId: "chicken_soup", role: "main", portions: 14 }],
      newFoods: [],
    };
    const checks = checkPlan(plan, [], RECIPES, STARTER_INGREDIENTS, [elder]);
    expect(checks.map((c) => c.code)).toContain("iron");
  });
});

describe("starter recipes", () => {
  const strictChild: Child = { ...elder, allergens: ["gluten", "peanut", "shellfish"] };

  it("only reference catalog ingredients and have unique ids", () => {
    const ids = STARTER_RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of STARTER_RECIPES) {
      for (const ri of r.ingredients) expect(ing.has(ri.ingredientId), `${r.id}: ${ri.ingredientId}`).toBe(true);
    }
  });

  it("toddler mains are safe for a gluten, peanut and shellfish allergic child", () => {
    for (const r of STARTER_RECIPES.filter((x) => x.role === "main")) {
      expect(allergenConflicts(r, strictChild, ing), r.title).toEqual([]);
    }
  });

  it("baby purees contain no seasoning", () => {
    for (const r of STARTER_RECIPES.filter((x) => x.role === "puree")) {
      for (const ri of r.ingredients) expect(ing.get(ri.ingredientId)?.foodGroup, r.title).not.toBe("seasoning");
    }
  });

  it("fill a full pork week for a toddler and a baby with no shortfalls", () => {
    const library = [...STARTER_RECIPES, { ...STARTER_RECIPES[0], id: "bf", title: "โจ๊กหมู", role: "breakfast" as const }];
    const { shortfalls } = generatePlan({
      weekStart: WEEK,
      children: [strictChild, baby],
      recipes: library,
      ingredients: STARTER_INGREDIENTS,
      ratings: [],
      history: [],
      proteinGroup: "pork",
    });
    expect(shortfalls).toEqual([]);
  });
});
