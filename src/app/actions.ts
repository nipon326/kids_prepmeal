"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adaptRecipeDraft, type AdaptImage } from "@/lib/ai/adapt-recipe";
import { describeAiError } from "@/lib/ai/errors";
import { AiUnavailableError, generateRecipeDraft } from "@/lib/ai/generate-recipe";
import { allergensInName } from "@/lib/domain/allergens";
import { allowedIngredients, validateAdapted, validateGenerated, type AdaptedDraft } from "@/lib/domain/generate";
import { alternatives, generatePlan, replaceInPlan, ROTATION } from "@/lib/domain/planner";
import type {
  Allergen,
  CookMethod,
  FoodGroup,
  Ingredient,
  MealRole,
  ProteinGroup,
  Rating,
  ShoppingCategory,
} from "@/lib/domain/types";
import { loadLibrary, loadPlans, requireSession, type Session } from "@/lib/data";
import { stripStepNumber } from "@/lib/format";
import { isWeekStart } from "@/lib/week";

const ALLERGENS: Allergen[] = ["gluten", "milk", "egg", "soy", "peanut", "tree_nut", "fish", "shellfish", "sesame"];
const PROTEINS: ProteinGroup[] = ["pork", "chicken", "beef", "fish", "shrimp", "egg", "tofu", "liver"];
const ROLES: MealRole[] = ["breakfast", "main", "puree"];
const METHODS: CookMethod[] = ["boil", "stir_fry", "steam", "stew", "bake", "fry", "blend"];
const RATINGS: Rating[] = ["loved", "liked", "neutral", "disliked"];
const CATEGORIES: ShoppingCategory[] = ["meat", "seafood", "egg_dairy", "vegetable", "fruit", "grain", "pantry"];
const FOOD_GROUPS: FoodGroup[] = ["carb", "protein", "vegetable", "fruit", "fat", "seasoning"];
const UNITS: Ingredient["unit"][] = ["g", "ml", "piece"];

function oneOf<T extends string>(allowed: readonly T[], value: unknown): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function text(value: unknown, max = 200): string {
  if (typeof value !== "string") throw new Error("ข้อมูลไม่ถูกต้อง");
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) throw new Error("ข้อมูลไม่ถูกต้อง");
  return trimmed;
}

function week(formData: FormData): string {
  const w = formData.get("week");
  if (typeof w !== "string" || !isWeekStart(w)) throw new Error("สัปดาห์ไม่ถูกต้อง");
  return w;
}

async function plannerInput(s: Session, weekStart: string) {
  const lib = await loadLibrary(s);
  const { plan, history } = await loadPlans(s, weekStart);
  return { lib, plan, input: { weekStart, ...lib, history } };
}

export async function generatePlanAction(formData: FormData) {
  const weekStart = week(formData);
  const proteinGroup = oneOf(ROTATION, formData.get("protein"));
  const s = await requireSession();
  const { input } = await plannerInput(s, weekStart);
  const { plan } = generatePlan({ ...input, proteinGroup });
  const { error } = await s.supabase.from("weekly_plans").upsert(
    {
      household_id: s.householdId,
      week_start: weekStart,
      protein_group: plan.proteinGroup,
      items: plan.items,
      new_foods: plan.newFoods,
      status: "draft",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "household_id,week_start" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function swapAction(formData: FormData) {
  const weekStart = week(formData);
  const childId = text(formData.get("child"));
  const oldId = text(formData.get("old"));
  const newId = text(formData.get("new"));
  const s = await requireSession();
  const { input, plan } = await plannerInput(s, weekStart);
  if (!plan) throw new Error("ยังไม่มีแผนของสัปดาห์นี้");
  const allowed = alternatives(input, plan, childId, oldId, 50).some((r) => r.id === newId);
  if (!allowed) throw new Error("เมนูนี้ใช้แทนไม่ได้");
  const next = replaceInPlan(input, plan, childId, oldId, newId);
  const { error } = await s.supabase
    .from("weekly_plans")
    .update({ items: next.items, new_foods: next.newFoods, updated_at: new Date().toISOString() })
    .eq("household_id", s.householdId)
    .eq("week_start", weekStart);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect(`/?week=${weekStart}`);
}

export async function confirmPlanAction(formData: FormData) {
  const weekStart = week(formData);
  const s = await requireSession();
  const { error } = await s.supabase
    .from("weekly_plans")
    .update({ status: "confirmed", updated_at: new Date().toISOString() })
    .eq("household_id", s.householdId)
    .eq("week_start", weekStart);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function rateAction(formData: FormData) {
  const childId = text(formData.get("child"));
  const recipeId = text(formData.get("recipe"));
  const rating = oneOf(RATINGS, formData.get("rating"));
  if (!rating) throw new Error("คะแนนไม่ถูกต้อง");
  const s = await requireSession();
  const { error } = await s.supabase
    .from("ratings")
    .insert({ household_id: s.householdId, child_id: childId, recipe_id: recipeId, rating });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

async function setIntroduced(childId: string, ingredientId: string, on: boolean) {
  const s = await requireSession();
  const { data, error } = await s.supabase
    .from("children")
    .select("introduced_ingredient_ids")
    .eq("id", childId)
    .single();
  if (error || !data) throw new Error("ไม่พบข้อมูลลูก");
  const current = new Set<string>(data.introduced_ingredient_ids);
  if (on) current.add(ingredientId);
  else current.delete(ingredientId);
  const res = await s.supabase
    .from("children")
    .update({ introduced_ingredient_ids: [...current] })
    .eq("id", childId);
  if (res.error) throw new Error(res.error.message);
  revalidatePath("/", "layout");
}

export async function toggleIntroducedAction(formData: FormData) {
  await setIntroduced(text(formData.get("child")), text(formData.get("ingredient")), formData.get("on") === "1");
}

export async function saveChildAction(formData: FormData) {
  const id = formData.get("id");
  const name = text(formData.get("name"), 50);
  const birthDate = text(formData.get("birth_date"), 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw new Error("วันเกิดไม่ถูกต้อง");
  const allergens = formData.getAll("allergens").map((a) => oneOf(ALLERGENS, a)).filter((a) => !!a);
  const scale = Number(formData.get("portion_scale") ?? 1);
  if (!(scale > 0 && scale <= 3)) throw new Error("สัดส่วนไม่ถูกต้อง");

  const s = await requireSession();
  const row = { name, birth_date: birthDate, allergens, portion_scale: scale };
  const res =
    typeof id === "string" && id
      ? await s.supabase.from("children").update(row).eq("id", id)
      : await s.supabase.from("children").insert({ ...row, household_id: s.householdId });
  if (res.error) throw new Error(res.error.message);
  revalidatePath("/", "layout");
  redirect("/kids");
}

export async function deleteChildAction(formData: FormData) {
  const s = await requireSession();
  const { error } = await s.supabase.from("children").delete().eq("id", text(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/kids");
}

export type RecipePayload = {
  id?: string;
  fromAi?: boolean;
  title: string;
  role: MealRole;
  minAgeMonths: number;
  proteinGroup?: ProteinGroup;
  cookMethod: CookMethod;
  instructions: string[];
  ingredients: {
    ingredientId?: string;
    newIngredient?: {
      name: string;
      category: ShoppingCategory;
      foodGroup: FoodGroup;
      unit: Ingredient["unit"];
      allergens: Allergen[];
    };
    amountPerPortion: number;
  }[];
};

export async function saveRecipeAction(json: string): Promise<{ error: string } | void> {
  let p: RecipePayload;
  try {
    p = JSON.parse(json);
  } catch {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }
  const title = typeof p.title === "string" ? p.title.trim() : "";
  const role = oneOf(ROLES, p.role);
  const cookMethod = oneOf(METHODS, p.cookMethod);
  const proteinGroup = p.proteinGroup ? oneOf(PROTEINS, p.proteinGroup) : undefined;
  const minAge = Number(p.minAgeMonths);
  if (!title || title.length > 120) return { error: "กรุณาใส่ชื่อเมนู" };
  if (!role || !cookMethod) return { error: "กรุณาเลือกประเภทและวิธีทำ" };
  if (!(minAge >= 6 && minAge <= 72)) return { error: "อายุขั้นต่ำต้องอยู่ระหว่าง 6–72 เดือน" };
  if (role === "main" && !proteinGroup) return { error: "กับข้าวต้องระบุโปรตีนหลัก เพื่อใช้หมุนเวียนรายสัปดาห์" };
  if (!Array.isArray(p.ingredients) || p.ingredients.length === 0) return { error: "ใส่วัตถุดิบอย่างน้อย 1 อย่าง" };
  if (p.ingredients.length > 30) return { error: "วัตถุดิบมากเกินไป" };
  const instructions = (Array.isArray(p.instructions) ? p.instructions : [])
    .map((x) => stripStepNumber(String(x)).trim())
    .filter(Boolean)
    .slice(0, 30);

  const s = await requireSession();
  const ingredients: { ingredientId: string; amountPerPortion: number }[] = [];
  for (const row of p.ingredients) {
    const amount = Number(row.amountPerPortion);
    if (!(amount > 0 && amount < 10_000)) return { error: "ปริมาณวัตถุดิบไม่ถูกต้อง" };
    if (row.ingredientId) {
      ingredients.push({ ingredientId: String(row.ingredientId), amountPerPortion: amount });
      continue;
    }
    const n = row.newIngredient;
    const name = typeof n?.name === "string" ? n.name.trim() : "";
    const category = oneOf(CATEGORIES, n?.category);
    const foodGroup = oneOf(FOOD_GROUPS, n?.foodGroup);
    const unit = oneOf(UNITS, n?.unit);
    if (!name || name.length > 80 || !category || !foodGroup || !unit) return { error: "ข้อมูลวัตถุดิบใหม่ไม่ครบ" };
    const allergens = new Set<Allergen>([
      ...(n!.allergens ?? []).map((a) => oneOf(ALLERGENS, a)).filter((a): a is Allergen => !!a),
      ...allergensInName(name),
    ]);
    const { data, error } = await s.supabase
      .from("ingredients")
      .insert({ household_id: s.householdId, name, category, food_group: foodGroup, unit, allergens: [...allergens] })
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "บันทึกวัตถุดิบไม่สำเร็จ" };
    ingredients.push({ ingredientId: data.id, amountPerPortion: amount });
  }

  const row = {
    title,
    role,
    min_age_months: minAge,
    protein_group: proteinGroup ?? null,
    cook_method: cookMethod,
    ingredients,
    instructions,
  };
  const res = p.id
    ? await s.supabase.from("recipes").update(row).eq("id", p.id).eq("household_id", s.householdId).select("id").single()
    : await s.supabase
        .from("recipes")
        .insert({ ...row, household_id: s.householdId, source: p.fromAi === true ? "ai" : "user" })
        .select("id")
        .single();
  if (res.error || !res.data) return { error: res.error?.message ?? "บันทึกเมนูไม่สำเร็จ" };
  revalidatePath("/", "layout");
  redirect(`/recipes/${res.data.id}`);
}

export type RecipeDraft = {
  title: string;
  role: MealRole;
  minAgeMonths: number;
  proteinGroup?: ProteinGroup;
  cookMethod: CookMethod;
  instructions: string[];
  ingredients: {
    name: string;
    amount: number;
    category?: ShoppingCategory;
    foodGroup?: FoodGroup;
    unit?: Ingredient["unit"];
    allergens?: Allergen[];
  }[];
};

const MAX_HINT = 200;
const MAX_ATTEMPTS = 2;

// The model only sees ingredients that are safe for every child, and its answer is re-validated
// against each child's allergens here. Nothing about the children is sent to the API.
export async function generateRecipeAction(
  roleInput: string,
  proteinInput: string,
  hintInput: string,
): Promise<{ error: string } | { draft: RecipeDraft }> {
  const role = oneOf(ROLES, roleInput);
  const proteinGroup = proteinInput ? oneOf(PROTEINS, proteinInput) : undefined;
  if (!role) return { error: "กรุณาเลือกประเภทเมนู" };
  if (role === "main" && !proteinGroup) return { error: "กับข้าวต้องระบุโปรตีนหลัก" };
  const hint = hintInput.trim().slice(0, MAX_HINT);

  const lib = await loadLibrary(await requireSession());
  const allowed = allowedIngredients(role, proteinGroup, lib.children, lib.ingredients);
  if (allowed.length < 3) return { error: "วัตถุดิบที่ปลอดภัยสำหรับลูกทุกคนมีน้อยเกินไปที่จะคิดสูตร" };
  const existingTitles = lib.recipes.filter((r) => r.role === role).map((r) => r.title);

  let previousProblem: string | undefined;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let gen;
    try {
      gen = await generateRecipeDraft({ role, proteinGroup, hint, allowed, existingTitles, previousProblem });
    } catch (e) {
      if (e instanceof AiUnavailableError) return { error: e.message };
      return { error: describeAiError(e) };
    }
    const check = validateGenerated(role, proteinGroup, gen, allowed, lib.children);
    if (check.ok) {
      const nameById = new Map(allowed.map((i) => [i.id, i.name]));
      const r = check.recipe;
      return {
        draft: {
          title: r.title,
          role: r.role,
          minAgeMonths: r.minAgeMonths,
          proteinGroup: r.proteinGroup,
          cookMethod: r.cookMethod,
          instructions: r.instructions.map(stripStepNumber),
          ingredients: r.ingredients.map((i) => ({ name: nameById.get(i.ingredientId) ?? "", amount: i.amountPerPortion })),
        },
      };
    }
    previousProblem = check.reason;
  }
  return { error: `AI คิดสูตรที่ผ่านการตรวจไม่ได้ (${previousProblem}) ลองใหม่หรือเปลี่ยนคำอธิบาย` };
}

const MAX_SOURCE_TEXT = 6000;
const MAX_IMAGE_BASE64 = 3_000_000;
const IMAGE_TYPES: AdaptImage["mediaType"][] = ["image/jpeg", "image/png", "image/webp"];

// Adapts a recipe the user found elsewhere (pasted text or a photo). Ingredients outside the catalog
// come back as suggestions; the user decides which ones to add. Nothing about the children is sent.
export async function adaptRecipeAction(
  roleInput: string,
  text: string,
  imageType: string,
  imageBase64: string,
): Promise<{ error: string } | { draft: AdaptedDraft }> {
  const role = roleInput === "main" || roleInput === "breakfast" ? roleInput : undefined;
  if (!role) return { error: "กรุณาเลือกประเภทเมนู" };
  const source = text.trim().slice(0, MAX_SOURCE_TEXT);
  const mediaType = IMAGE_TYPES.find((t) => t === imageType);
  if (imageBase64 && (!mediaType || imageBase64.length > MAX_IMAGE_BASE64)) return { error: "รูปต้องเป็น JPEG, PNG หรือ WebP และไม่ใหญ่เกินไป" };
  if (!source && !imageBase64) return { error: "วางข้อความสูตรหรือเลือกรูปก่อน" };
  const image = imageBase64 && mediaType ? { mediaType, base64: imageBase64 } : undefined;

  const lib = await loadLibrary(await requireSession());
  // "breakfast" applies no one-protein-per-week rule: an outside recipe may use any protein.
  const allowed = allowedIngredients("breakfast", undefined, lib.children, lib.ingredients);

  let previousProblem: string | undefined;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let gen;
    try {
      gen = await adaptRecipeDraft({ role, text: source, image, allowed, previousProblem });
    } catch (e) {
      return { error: describeAiError(e) };
    }
    const check = validateAdapted(role, gen, allowed, lib.ingredients, lib.children);
    if (check.ok) return { draft: check.draft };
    previousProblem = check.reason;
  }
  return { error: `AI ปรับสูตรที่ผ่านการตรวจไม่ได้ (${previousProblem}) ลองใหม่หรือใช้ข้อความอื่น` };
}

const COLORS = ["green", "orange", "red", "purple", "white", "yellow"] as const;

function ingredientsBack(message: string): never {
  redirect(`/ingredients?error=${encodeURIComponent(message)}`);
}

export async function saveIngredientAction(formData: FormData) {
  const id = formData.get("id");
  const name = text(formData.get("name"), 80);
  const category = oneOf(CATEGORIES, formData.get("category"));
  const foodGroup = oneOf(FOOD_GROUPS, formData.get("food_group"));
  const unit = oneOf(UNITS, formData.get("unit"));
  if (!category || !foodGroup || !unit) throw new Error("ข้อมูลไม่ครบ");

  const packSize = Number(formData.get("pack_size") || 0);
  const packLabel = String(formData.get("pack_label") ?? "").trim().slice(0, 30);
  if (!(packSize >= 0 && packSize < 100_000)) throw new Error("ขนาดแพ็คไม่ถูกต้อง");
  const hasPack = packSize > 0 && packLabel !== "";

  const minAge = String(formData.get("min_age_months") ?? "").trim();
  if (minAge !== "" && !(Number(minAge) >= 0 && Number(minAge) <= 72)) throw new Error("อายุขั้นต่ำไม่ถูกต้อง");

  const proteinRaw = formData.get("protein_group");
  const proteinGroup = proteinRaw ? oneOf(PROTEINS, proteinRaw) : undefined;
  const colorRaw = formData.get("color");
  const color = colorRaw ? oneOf(COLORS, colorRaw) : undefined;
  // Keywords in the name are always checked by the planner too, so keep the stored tags in step with them.
  const allergens = new Set<Allergen>([
    ...formData.getAll("allergens").map((a) => oneOf(ALLERGENS, a)).filter((a): a is Allergen => !!a),
    ...allergensInName(name),
  ]);

  const s = await requireSession();
  const { data: same } = await s.supabase.from("ingredients").select("id").eq("name", name).limit(2);
  if (same?.some((r) => r.id !== id)) ingredientsBack(`มีวัตถุดิบชื่อ “${name}” อยู่แล้ว`);

  const row = {
    name,
    category,
    food_group: foodGroup,
    unit,
    pack_size: hasPack ? packSize : null,
    pack_label: hasPack ? packLabel : null,
    allergens: [...allergens],
    protein_group: proteinGroup ?? null,
    iron_rich: formData.get("iron_rich") === "on",
    calcium_rich: formData.get("calcium_rich") === "on",
    color: color ?? null,
    min_age_months: minAge === "" ? null : Number(minAge),
  };
  const res =
    typeof id === "string" && id
      ? await s.supabase.from("ingredients").update(row).eq("id", id).eq("household_id", s.householdId)
      : await s.supabase.from("ingredients").insert({ ...row, household_id: s.householdId });
  if (res.error) throw new Error(res.error.message);
  revalidatePath("/", "layout");
  redirect("/ingredients");
}

export async function deleteIngredientAction(formData: FormData) {
  const id = text(formData.get("id"));
  const s = await requireSession();
  const lib = await loadLibrary(s);
  const usedBy = lib.recipes.filter((r) => r.ingredients.some((i) => i.ingredientId === id)).map((r) => r.title);
  if (usedBy.length > 0) {
    const shown = usedBy.slice(0, 3).join(", ") + (usedBy.length > 3 ? ` และอีก ${usedBy.length - 3} เมนู` : "");
    ingredientsBack(`ลบไม่ได้ เพราะยังใช้อยู่ใน: ${shown}`);
  }
  const { error } = await s.supabase.from("ingredients").delete().eq("id", id).eq("household_id", s.householdId);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/ingredients");
}

export async function deleteRecipeAction(formData: FormData) {
  const s = await requireSession();
  const { error } = await s.supabase
    .from("recipes")
    .delete()
    .eq("id", text(formData.get("id")))
    .eq("household_id", s.householdId);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/recipes");
}

export async function signOutAction() {
  const s = await requireSession();
  await s.supabase.auth.signOut();
  redirect("/login");
}
