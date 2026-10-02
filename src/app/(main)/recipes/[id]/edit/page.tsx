import Link from "next/link";
import { notFound } from "next/navigation";
import { loadLibrary, requireSession } from "@/lib/data";
import { RecipeForm } from "../../RecipeForm";

export default async function EditRecipePage({ params }: PageProps<"/recipes/[id]/edit">) {
  const { id } = await params;
  const lib = await loadLibrary(await requireSession());
  const recipe = lib.recipes.find((r) => r.id === id);
  if (!recipe || !recipe.own) notFound();
  const ingById = new Map(lib.ingredients.map((i) => [i.id, i]));

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/recipes/${id}`} className="text-sm text-muted">‹ กลับ</Link>
      <h1 className="h1">แก้ไขเมนู</h1>
      <RecipeForm
        ingredients={lib.ingredients}
        kids={lib.children.map((c) => ({ name: c.name, allergens: c.allergens }))}
        defaults={{}}
        initial={{
          id: recipe.id,
          title: recipe.title,
          role: recipe.role,
          minAgeMonths: recipe.minAgeMonths,
          proteinGroup: recipe.proteinGroup,
          cookMethod: recipe.cookMethod,
          instructions: recipe.instructions,
          ingredients: recipe.ingredients.map((ri) => ({
            name: ingById.get(ri.ingredientId)?.name ?? "",
            amount: ri.amountPerPortion,
          })),
        }}
      />
    </div>
  );
}
