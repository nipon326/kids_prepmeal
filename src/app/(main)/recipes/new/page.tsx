import Link from "next/link";
import type { MealRole, ProteinGroup } from "@/lib/domain/types";
import { loadLibrary, requireSession } from "@/lib/data";
import { PROTEIN_LABELS, ROLE_LABELS } from "@/lib/labels";
import { RecipeForm } from "../RecipeForm";

export default async function NewRecipePage({ searchParams }: PageProps<"/recipes/new">) {
  const q = await searchParams;
  const role = Object.hasOwn(ROLE_LABELS, String(q.role)) ? (q.role as MealRole) : undefined;
  const protein = Object.hasOwn(PROTEIN_LABELS, String(q.protein)) ? (q.protein as ProteinGroup) : undefined;
  const lib = await loadLibrary(await requireSession());

  const source = typeof q.copy === "string" ? lib.recipes.find((r) => r.id === q.copy) : undefined;
  const ingById = new Map(lib.ingredients.map((i) => [i.id, i]));
  const initial = source
    ? {
        title: source.title,
        role: source.role,
        minAgeMonths: source.minAgeMonths,
        proteinGroup: source.proteinGroup,
        cookMethod: source.cookMethod,
        instructions: source.instructions,
        ingredients: source.ingredients.map((ri) => ({
          name: ingById.get(ri.ingredientId)?.name ?? "",
          amount: ri.amountPerPortion,
        })),
      }
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/recipes" className="text-sm text-muted">‹ คลังเมนู</Link>
      <h1 className="h1">{source ? "คัดลอกเป็นเมนูใหม่" : "เพิ่มเมนูเอง"}</h1>
      {source && <p className="text-sm text-muted">คัดลอกจาก “{source.title}” แก้ชื่อและวัตถุดิบที่ต่างออกไปได้เลย</p>}
      <RecipeForm
        ingredients={lib.ingredients}
        kids={lib.children.map((c) => ({ name: c.name, allergens: c.allergens }))}
        defaults={{ role, protein }}
        initial={initial}
      />
    </div>
  );
}
