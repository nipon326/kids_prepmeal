import { redirect } from "next/navigation";
import type {
  Allergen,
  Child,
  Ingredient,
  PlanItem,
  ProteinGroup,
  RatingEntry,
  Recipe,
  RecipeIngredient,
  WeeklyPlan,
} from "./domain/types";
import { createClient } from "./supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type Session = { supabase: Supabase; householdId: string };

export async function requireSession(): Promise<Session> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  const { data: member, error } = await supabase
    .from("household_members")
    .select("household_id")
    .limit(1)
    .single();
  if (error || !member) throw new Error("ไม่พบข้อมูลครอบครัวของบัญชีนี้");
  return { supabase, householdId: member.household_id as string };
}

type ChildRow = {
  id: string;
  name: string;
  birth_date: string;
  allergens: string[];
  portion_scale: number;
  introduced_ingredient_ids: string[];
};

type IngredientRow = {
  id: string;
  household_id: string | null;
  name: string;
  category: Ingredient["category"];
  food_group: Ingredient["foodGroup"];
  unit: Ingredient["unit"];
  pack_size: number | null;
  pack_label: string | null;
  allergens: string[];
  protein_group: string | null;
  iron_rich: boolean;
  calcium_rich: boolean;
  color: string | null;
  min_age_months: number | null;
};

type RecipeRow = {
  id: string;
  household_id: string | null;
  title: string;
  role: Recipe["role"];
  min_age_months: number;
  max_age_months: number | null;
  protein_group: string | null;
  cook_method: Recipe["cookMethod"];
  ingredients: RecipeIngredient[];
  instructions: string[];
  source: "seed" | "user" | "ai";
};

type PlanRow = {
  week_start: string;
  protein_group: string;
  items: PlanItem[];
  new_foods: WeeklyPlan["newFoods"];
  status: "draft" | "confirmed";
};

export type LibraryRecipe = Recipe & { own: boolean; source: RecipeRow["source"] };
export type LibraryIngredient = Ingredient & { own: boolean };

function toChild(r: ChildRow): Child {
  return {
    id: r.id,
    name: r.name,
    birthDate: r.birth_date,
    allergens: r.allergens as Allergen[],
    portionScale: Number(r.portion_scale),
    introducedIngredientIds: r.introduced_ingredient_ids,
  };
}

function toIngredient(r: IngredientRow): LibraryIngredient {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    foodGroup: r.food_group,
    unit: r.unit,
    pack: r.pack_size && r.pack_label ? { size: Number(r.pack_size), label: r.pack_label } : undefined,
    allergens: r.allergens as Allergen[],
    proteinGroup: (r.protein_group ?? undefined) as ProteinGroup | undefined,
    ironRich: r.iron_rich,
    calciumRich: r.calcium_rich,
    color: (r.color ?? undefined) as Ingredient["color"],
    minAgeMonths: r.min_age_months ?? undefined,
    own: r.household_id !== null,
  };
}

function toRecipe(r: RecipeRow): LibraryRecipe {
  return {
    id: r.id,
    title: r.title,
    role: r.role,
    minAgeMonths: r.min_age_months,
    maxAgeMonths: r.max_age_months ?? undefined,
    proteinGroup: (r.protein_group ?? undefined) as ProteinGroup | undefined,
    cookMethod: r.cook_method,
    ingredients: r.ingredients,
    instructions: r.instructions,
    own: r.household_id !== null,
    source: r.source,
  };
}

function toPlan(r: PlanRow): WeeklyPlan & { status: PlanRow["status"] } {
  return {
    weekStart: r.week_start,
    proteinGroup: r.protein_group as ProteinGroup,
    items: r.items,
    newFoods: r.new_foods,
    status: r.status,
  };
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function loadLibrary({ supabase }: Session) {
  const [children, ingredients, recipes, ratings] = await Promise.all([
    supabase.from("children").select("*").order("birth_date"),
    supabase.from("ingredients").select("*").order("name"),
    supabase.from("recipes").select("*").order("title"),
    supabase.from("ratings").select("child_id, recipe_id, rating, rated_on"),
  ]);
  return {
    children: unwrap<ChildRow[]>(children).map(toChild),
    ingredients: unwrap<IngredientRow[]>(ingredients).map(toIngredient),
    recipes: unwrap<RecipeRow[]>(recipes).map(toRecipe),
    ratings: unwrap<{ child_id: string; recipe_id: string; rating: RatingEntry["rating"]; rated_on: string }[]>(
      ratings,
    ).map((r) => ({ childId: r.child_id, recipeId: r.recipe_id, rating: r.rating, date: r.rated_on })),
  };
}

const HISTORY_WEEKS = 8;

export async function loadPlans({ supabase, householdId }: Session, weekStart: string) {
  const rows = unwrap<PlanRow[]>(
    await supabase
      .from("weekly_plans")
      .select("week_start, protein_group, items, new_foods, status")
      .eq("household_id", householdId)
      .lte("week_start", weekStart)
      .order("week_start", { ascending: false })
      .limit(HISTORY_WEEKS + 1),
  ).map(toPlan);
  return {
    plan: rows.find((p) => p.weekStart === weekStart) ?? null,
    history: rows.filter((p) => p.weekStart < weekStart),
  };
}
