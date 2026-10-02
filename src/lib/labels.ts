import type { CookMethod, FoodGroup, MealRole, ProteinGroup, Rating, ShoppingCategory } from "./domain/types";

export const PROTEIN_LABELS: Record<ProteinGroup, string> = {
  pork: "หมู",
  chicken: "ไก่",
  beef: "เนื้อวัว",
  fish: "ปลา",
  shrimp: "กุ้ง",
  egg: "ไข่",
  tofu: "เต้าหู้",
  liver: "ตับ",
};

export const PROTEIN_EMOJI: Record<ProteinGroup, string> = {
  pork: "🐷",
  chicken: "🐔",
  beef: "🐮",
  fish: "🐟",
  shrimp: "🦐",
  egg: "🥚",
  tofu: "🧊",
  liver: "🫀",
};

export const ROLE_LABELS: Record<MealRole, string> = {
  breakfast: "มื้อเช้า",
  main: "กับข้าว (เที่ยง/เย็น)",
  puree: "อาหารบด",
};

export const COOK_LABELS: Record<CookMethod, string> = {
  boil: "ต้ม",
  stir_fry: "ผัด",
  steam: "นึ่ง",
  stew: "ตุ๋น",
  bake: "อบ",
  fry: "ทอด",
  blend: "บด",
};

export const FOOD_GROUP_LABELS: Record<FoodGroup, string> = {
  carb: "ข้าว/แป้ง",
  protein: "โปรตีน",
  vegetable: "ผัก",
  fruit: "ผลไม้",
  fat: "ไขมัน",
  seasoning: "เครื่องปรุง",
};

export const CATEGORY_OPTIONS: Record<ShoppingCategory, string> = {
  meat: "เนื้อสัตว์",
  seafood: "อาหารทะเล",
  egg_dairy: "ไข่ / นม / เต้าหู้",
  vegetable: "ผัก",
  fruit: "ผลไม้",
  grain: "ข้าว / แป้ง",
  pantry: "เครื่องปรุง",
};

export const RATING_OPTIONS: { value: Rating; emoji: string; label: string }[] = [
  { value: "loved", emoji: "❤️", label: "ชอบมาก" },
  { value: "liked", emoji: "👍", label: "ชอบ" },
  { value: "neutral", emoji: "😐", label: "เฉยๆ" },
  { value: "disliked", emoji: "👎", label: "ไม่ชอบ" },
];

export const UNIT_LABELS = { g: "ก.", ml: "มล.", piece: "ชิ้น" } as const;
