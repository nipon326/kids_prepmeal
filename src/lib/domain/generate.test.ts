import { describe, expect, it } from "vitest";
import { STARTER_INGREDIENTS } from "@/data/catalog";
import { allowedIngredients, validateGenerated, type GeneratedRecipe } from "./generate";
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
