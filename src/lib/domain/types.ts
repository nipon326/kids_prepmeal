export type Allergen =
  | "gluten"
  | "milk"
  | "egg"
  | "soy"
  | "peanut"
  | "tree_nut"
  | "fish"
  | "shellfish"
  | "sesame";

export type ProteinGroup =
  | "pork"
  | "chicken"
  | "beef"
  | "fish"
  | "shrimp"
  | "egg"
  | "tofu"
  | "liver";

export type ShoppingCategory =
  | "meat"
  | "seafood"
  | "egg_dairy"
  | "vegetable"
  | "fruit"
  | "grain"
  | "pantry";

export type FoodGroup = "carb" | "protein" | "vegetable" | "fruit" | "fat" | "seasoning";

export type VegColor = "green" | "orange" | "red" | "purple" | "white" | "yellow";

export type Ingredient = {
  id: string;
  name: string;
  category: ShoppingCategory;
  foodGroup: FoodGroup;
  unit: "g" | "ml" | "piece";
  pack?: { size: number; label: string };
  allergens: Allergen[];
  proteinGroup?: ProteinGroup;
  ironRich?: boolean;
  calciumRich?: boolean;
  color?: VegColor;
  minAgeMonths?: number;
};

export type MealRole = "breakfast" | "main" | "puree";

export type CookMethod = "boil" | "stir_fry" | "steam" | "stew" | "bake" | "fry" | "blend";

export type RecipeIngredient = {
  ingredientId: string;
  amountPerPortion: number;
};

export type Recipe = {
  id: string;
  title: string;
  role: MealRole;
  minAgeMonths: number;
  maxAgeMonths?: number;
  proteinGroup?: ProteinGroup;
  cookMethod: CookMethod;
  ingredients: RecipeIngredient[];
  instructions: string[];
};

export type Child = {
  id: string;
  name: string;
  birthDate: string;
  allergens: Allergen[];
  portionScale: number;
  introducedIngredientIds: string[];
};

export type Rating = "loved" | "liked" | "neutral" | "disliked";

export type RatingEntry = {
  childId: string;
  recipeId: string;
  rating: Rating;
  date: string;
};

export type PlanItem = {
  childId: string;
  recipeId: string;
  role: MealRole;
  portions: number;
};

export type WeeklyPlan = {
  weekStart: string;
  proteinGroup: ProteinGroup;
  items: PlanItem[];
  newFoods: { childId: string; ingredientId: string }[];
};
