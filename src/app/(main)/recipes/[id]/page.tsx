import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteRecipeAction, rateAction } from "@/app/actions";
import { ALLERGEN_LABELS, allergenConflicts } from "@/lib/domain/allergens";
import { loadLibrary, requireSession } from "@/lib/data";
import { stripStepNumber } from "@/lib/format";
import { COOK_LABELS, PROTEIN_LABELS, RATING_OPTIONS, ROLE_LABELS, UNIT_LABELS } from "@/lib/labels";

export default async function RecipePage({ params }: PageProps<"/recipes/[id]">) {
  const { id } = await params;
  const lib = await loadLibrary(await requireSession());
  const recipe = lib.recipes.find((r) => r.id === id);
  if (!recipe) notFound();
  const ingById = new Map(lib.ingredients.map((i) => [i.id, i]));

  return (
    <div className="flex flex-col gap-4">
      <Link href="/recipes" className="text-sm text-muted">‹ คลังเมนู</Link>
      <div>
        <h1 className="h1">{recipe.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="chip">{ROLE_LABELS[recipe.role]}</span>
          {recipe.proteinGroup && <span className="chip">{PROTEIN_LABELS[recipe.proteinGroup]}</span>}
          <span className="chip">{COOK_LABELS[recipe.cookMethod]}</span>
          <span className="chip">{recipe.minAgeMonths}+ เดือน</span>
        </div>
      </div>

      {lib.children.map((child) => {
        const hits = allergenConflicts(recipe, child, ingById);
        return hits.length > 0 ? (
          <p key={child.id} className="rounded-xl bg-danger-soft p-3 text-sm text-danger">
            ⚠️ ไม่เหมาะกับ{child.name}: {hits.map((h) => ALLERGEN_LABELS[h]).join(", ")}
          </p>
        ) : null;
      })}

      <section className="card">
        <h2 className="mb-2 font-bold">วัตถุดิบ ต่อ 1 มื้อ</h2>
        <ul className="flex flex-col divide-y divide-line">
          {recipe.ingredients.map((ri) => {
            const ing = ingById.get(ri.ingredientId);
            return (
              <li key={ri.ingredientId} className="flex justify-between py-2">
                <span>{ing?.name ?? "?"}</span>
                <span className="text-muted">
                  {ri.amountPerPortion} {ing ? UNIT_LABELS[ing.unit] : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {recipe.instructions.length > 0 && (
        <section className="card">
          <h2 className="mb-2 font-bold">วิธีทำ</h2>
          <ol className="list-decimal pl-5">
            {recipe.instructions.map((s, i) => (
              <li key={i} className="py-1">{stripStepNumber(s)}</li>
            ))}
          </ol>
        </section>
      )}

      {lib.children.length > 0 && (
        <section className="card flex flex-col gap-3">
          <h2 className="font-bold">ลูกชอบไหม</h2>
          {lib.children.map((child) => {
            const history = lib.ratings
              .filter((r) => r.childId === child.id && r.recipeId === recipe.id)
              .sort((a, b) => b.date.localeCompare(a.date));
            return (
              <div key={child.id} className="flex items-center justify-between gap-2">
                <div>
                  <p>{child.name}</p>
                  {history.length > 0 && (
                    <p className="text-xs text-muted">
                      {history.slice(0, 5).map((h) => RATING_OPTIONS.find((o) => o.value === h.rating)?.emoji).join(" ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {RATING_OPTIONS.map((o) => (
                    <form key={o.value} action={rateAction}>
                      <input type="hidden" name="child" value={child.id} />
                      <input type="hidden" name="recipe" value={recipe.id} />
                      <input type="hidden" name="rating" value={o.value} />
                      <button aria-label={o.label} className="size-10 rounded-full bg-surface-2 text-lg">{o.emoji}</button>
                    </form>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <div className="flex gap-2">
        <Link href={`/recipes/new?copy=${recipe.id}`} className="btn flex-1">คัดลอกเป็นเมนูใหม่</Link>
        {recipe.own && <Link href={`/recipes/${recipe.id}/edit`} className="btn flex-1">แก้ไข</Link>}
      </div>
      {recipe.own && (
        <form action={deleteRecipeAction}>
          <input type="hidden" name="id" value={recipe.id} />
          <button className="btn w-full text-danger">ลบเมนู</button>
        </form>
      )}
    </div>
  );
}
