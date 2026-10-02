import type { Allergen, Child, Ingredient, ProteinGroup, Recipe } from "./types";

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: "กลูเตน (ข้าวสาลี บาร์เลย์ ไรย์ โอ๊ต)",
  milk: "นมวัว",
  egg: "ไข่",
  soy: "ถั่วเหลือง",
  peanut: "ถั่วลิสง",
  tree_nut: "ถั่วเปลือกแข็ง",
  fish: "ปลา",
  shellfish: "กุ้ง/หอย/ปู",
  sesame: "งา",
};

// Safety net for free-text ingredient names (e.g. AI output) that don't map to the catalog.
const KEYWORDS: Partial<Record<Allergen, string[]>> = {
  gluten: [
    "แป้งสาลี", "แป้งอเนกประสงค์", "แป้งขนมปัง", "แป้งเค้ก", "ขนมปัง", "เกล็ดขนมปัง",
    "ข้าวโอ๊ต", "โอ๊ต", "บาร์เลย์", "ไรย์", "พาสต้า", "มักกะโรนี", "สปาเก็ตตี",
    "บะหมี่", "เส้นบะหมี่", "แผ่นเกี๊ยว", "เกี๊ยว", "ซาลาเปา", "wheat", "oat", "barley", "rye",
  ],
  milk: ["นมวัว", "เนย", "ชีส", "โยเกิร์ต", "ครีม"],
  egg: ["ไข่"],
  soy: ["ถั่วเหลือง", "เต้าหู้", "ซีอิ๊ว", "เต้าเจี้ยว", "นมถั่วเหลือง"],
  peanut: ["ถั่วลิสง"],
  tree_nut: ["อัลมอนด์", "มะม่วงหิมพานต์", "วอลนัท", "พิสตาชิโอ"],
  fish: ["ปลา", "น้ำปลา"],
  shellfish: ["กุ้ง", "หอย", "ปู", "ปลาหมึก"],
  // bare "งา" would match "เงาะ"
  sesame: ["งาขาว", "งาดำ", "น้ำมันงา", "เมล็ดงา", "sesame"],
};

export function allergensInName(name: string): Allergen[] {
  const lower = name.toLowerCase();
  return (Object.keys(KEYWORDS) as Allergen[]).filter((a) =>
    KEYWORDS[a]!.some((k) => lower.includes(k)),
  );
}

export const PROTEIN_ALLERGEN: Partial<Record<ProteinGroup, Allergen>> = {
  fish: "fish",
  shrimp: "shellfish",
  egg: "egg",
  tofu: "soy",
};

export function recipeAllergens(
  recipe: Recipe,
  ingredients: Map<string, Ingredient>,
): Set<Allergen> {
  const found = new Set<Allergen>();
  for (const ri of recipe.ingredients) {
    const ing = ingredients.get(ri.ingredientId);
    if (!ing) continue;
    ing.allergens.forEach((a) => found.add(a));
    allergensInName(ing.name).forEach((a) => found.add(a));
  }
  allergensInName(recipe.title).forEach((a) => found.add(a));
  return found;
}

export function allergenConflicts(
  recipe: Recipe,
  child: Child,
  ingredients: Map<string, Ingredient>,
): Allergen[] {
  const present = recipeAllergens(recipe, ingredients);
  return child.allergens.filter((a) => present.has(a));
}
