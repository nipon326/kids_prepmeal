import Link from "next/link";
import { allergenConflicts } from "@/lib/domain/allergens";
import type { MealRole } from "@/lib/domain/types";
import { loadLibrary, requireSession } from "@/lib/data";
import { COOK_LABELS, PROTEIN_EMOJI, PROTEIN_LABELS, ROLE_LABELS } from "@/lib/labels";

const TABS: { role?: MealRole; label: string }[] = [
  { label: "ทั้งหมด" },
  { role: "main", label: "กับข้าว" },
  { role: "breakfast", label: "มื้อเช้า" },
  { role: "puree", label: "อาหารบด" },
];

export default async function RecipesPage({ searchParams }: PageProps<"/recipes">) {
  const q = await searchParams;
  const role = Object.hasOwn(ROLE_LABELS, String(q.role)) ? (q.role as MealRole) : undefined;
  const lib = await loadLibrary(await requireSession());
  const ingById = new Map(lib.ingredients.map((i) => [i.id, i]));
  const recipes = lib.recipes.filter((r) => !role || r.role === role);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="h1">คลังเมนู</h1>
        <Link href={`/recipes/new${role ? `?role=${role}` : ""}`} className="btn-primary min-h-10 px-3">+ เพิ่มเมนู</Link>
      </div>

      <nav className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.label}
            href={t.role ? `/recipes?role=${t.role}` : "/recipes"}
            className={`chip shrink-0 ${role === t.role ? "bg-accent text-accent-fg" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {recipes.length === 0 ? (
        <div className="card text-center text-muted">
          <p>ยังไม่มีเมนูในหมวดนี้</p>
          <p className="mt-1 text-sm">เพิ่มเมนูที่ลูกกินประจำก่อน แล้วแอปจะเริ่มจัดแผนให้ได้</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {recipes.map((r) => {
            const unsafe = lib.children.filter((c) => allergenConflicts(r, c, ingById).length > 0);
            return (
              <li key={r.id}>
                <Link href={`/recipes/${r.id}`} className="card block">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{r.title}</span>
                    {r.proteinGroup && (
                      <span aria-label={PROTEIN_LABELS[r.proteinGroup]}>{PROTEIN_EMOJI[r.proteinGroup]}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {ROLE_LABELS[r.role]} · {COOK_LABELS[r.cookMethod]} · {r.minAgeMonths}+ เดือน
                    {r.source === "ai" && " · ✨ AI"}
                  </p>
                  {unsafe.length > 0 && (
                    <p className="mt-1 text-sm text-danger">ไม่เหมาะกับ {unsafe.map((c) => c.name).join(", ")}</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
