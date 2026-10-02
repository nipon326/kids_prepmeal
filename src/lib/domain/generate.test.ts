import { describe, expect, it } from "vitest";
import { STARTER_INGREDIENTS } from "@/data/catalog";
import { allowedIngredients, validateAdapted, validateGenerated, type AdaptedRecipe, type GeneratedRecipe } from "./generate";
import type { Child } from "./types";

const strict: Child = {
  id: "c1",
  name: "x",
  birthDate: "2024-03-01",
  allergens: ["gluten", "peanut", "shellfish"],
  portionScale: 1,
  introducedIngredientIds: [],
};

const pork = (ids: string[]): GeneratedRecipe => ({
  title: "หมูผัดผัก",
  cookMethod: "stir_fry",
  ingredients: ids.map((ingredientId) => ({ ingredientId, amountPerPortion: 30 })),
  instructions: ["ผัดให้สุก"],
});

describe("allowedIngredients", () => {
  it("drops ingredients that conflict with any child's allergens", () => {
    const ids = allowedIngredients("main", "pork", [strict], STARTER_INGREDIENTS).map((i) => i.id);
    expect(ids).not.toContain("shrimp");
    expect(ids).toContain("pork_minced");
  });

  it("keeps other proteins out of a main dish", () => {
    const ids = allowedIngredients("main", "pork", [strict], STARTER_INGREDIENTS).map((i) => i.id);
    expect(ids).not.toContain("chicken_breast");
    expect(ids).not.toContain("egg");
  });

  it("limits purees to unseasoned base foods", () => {
    const list = allowedIngredients("puree", undefined, [strict], STARTER_INGREDIENTS);
    expect(list.every((i) => ["carb", "protein", "vegetable", "fruit"].includes(i.foodGroup))).toBe(true);
    expect(list.map((i) => i.id)).not.toContain("soy_sauce_gf");
  });
});

describe("validateGenerated", () => {
  const allowed = allowedIngredients("main", "pork", [strict], STARTER_INGREDIENTS);

  it("accepts a valid pork main", () => {
    expect(validateGenerated("main", "pork", pork(["pork_minced", "carrot"]), allowed, [strict]).ok).toBe(true);
  });

  it("rejects ingredients outside the allowed list", () => {
    const r = validateGenerated("main", "pork", pork(["pork_minced", "shrimp"]), allowed, [strict]);
    expect(r.ok).toBe(false);
  });

  it("rejects a title that carries an allergen keyword", () => {
    const gen = { ...pork(["pork_minced"]), title: "หมูผัดกุ้ง" };
    expect(validateGenerated("main", "pork", gen, allowed, [strict]).ok).toBe(false);
  });

  it("requires the week's protein in a main", () => {
    expect(validateGenerated("main", "pork", pork(["carrot", "onion"]), allowed, [strict]).ok).toBe(false);
  });

  it("rejects absurd amounts and duplicate ingredients", () => {
    const big = pork(["pork_minced"]);
    big.ingredients[0].amountPerPortion = 5000;
    expect(validateGenerated("main", "pork", big, allowed, [strict]).ok).toBe(false);
    expect(validateGenerated("main", "pork", pork(["pork_minced", "pork_minced"]), allowed, [strict]).ok).toBe(false);
  });

  it("requires exactly one ingredient for a puree", () => {
    const pureeAllowed = allowedIngredients("puree", undefined, [strict], STARTER_INGREDIENTS);
    const two = validateGenerated("puree", undefined, pork(["pumpkin", "carrot"]), pureeAllowed, [strict]);
    expect(two.ok).toBe(false);
    const one = validateGenerated("puree", undefined, pork(["pumpkin"]), pureeAllowed, [strict]);
    expect(one.ok).toBe(true);
  });
});

describe("validateAdapted", () => {
  const allowed = allowedIngredients("breakfast", undefined, [strict], STARTER_INGREDIENTS);
  const base = (rows: AdaptedRecipe["ingredients"]): AdaptedRecipe => ({
    title: "ผัดซีอิ๊วหมูสับ",
    cookMethod: "stir_fry",
    proteinGroup: "pork",
    ingredients: rows,
    instructions: ["ผัดให้สุก"],
    changes: ["ตัดพริกออก"],
  });
  const cat = (ingredientId: string, amountPerPortion = 30) => ({ ingredientId, newIngredient: null, amountPerPortion });
  const fresh = (name: string, category: "pantry" | "vegetable" = "vegetable") => ({
    ingredientId: "NEW",
    newIngredient: { name, category, foodGroup: category === "pantry" ? ("seasoning" as const) : ("vegetable" as const), unit: "g" as const },
    amountPerPortion: 10,
  });

  it("keeps a safe new ingredient as a suggestion", () => {
    const r = validateAdapted("main", base([cat("pork_minced"), fresh("ต้นหอม")]), allowed, STARTER_INGREDIENTS, [strict]);
    expect(r.ok && r.draft.rows.find((x) => x.isNew)?.name).toBe("ต้นหอม");
  });

  it("flags new seasonings for a label check", () => {
    const r = validateAdapted("main", base([cat("pork_minced"), fresh("ซอสปรุงรส", "pantry")]), allowed, STARTER_INGREDIENTS, [strict]);
    expect(r.ok && r.draft.rows.find((x) => x.isNew)?.needsLabelCheck).toBe(true);
  });

  it("drops a new ingredient whose name carries a child's allergen and says so", () => {
    const r = validateAdapted("main", base([cat("pork_minced"), fresh("ซอสหอยนางรม", "pantry")]), allowed, STARTER_INGREDIENTS, [strict]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.draft.rows.map((x) => x.name)).not.toContain("ซอสหอยนางรม");
      expect(r.draft.changes.some((c) => c.includes("ซอสหอยนางรม"))).toBe(true);
    }
  });

  it("drops a new ingredient that matches a catalog item blocked for the kids", () => {
    const r = validateAdapted("main", base([cat("pork_minced"), fresh("กุ้งแกะเปลือก")]), allowed, STARTER_INGREDIENTS, [strict]);
    expect(r.ok && r.draft.rows.map((x) => x.name)).not.toContain("กุ้งแกะเปลือก");
  });

  it("reuses the catalog item when a suggestion matches an allowed name", () => {
    const r = validateAdapted("main", base([cat("pork_minced"), fresh("แครอท")]), allowed, STARTER_INGREDIENTS, [strict]);
    expect(r.ok && r.draft.rows.find((x) => x.name === "แครอท")?.isNew).toBe(false);
  });

  it("rejects a catalog id outside the allowed list, and a title with an allergen", () => {
    expect(validateAdapted("main", base([cat("pork_minced"), cat("shrimp")]), allowed, STARTER_INGREDIENTS, [strict]).ok).toBe(false);
    const titled = { ...base([cat("pork_minced")]), title: "ผัดกุ้ง" };
    expect(validateAdapted("main", titled, allowed, STARTER_INGREDIENTS, [strict]).ok).toBe(false);
  });

  it("requires the named protein to be a catalog ingredient in a main", () => {
    expect(validateAdapted("main", base([cat("carrot"), cat("onion")]), allowed, STARTER_INGREDIENTS, [strict]).ok).toBe(false);
  });
});
