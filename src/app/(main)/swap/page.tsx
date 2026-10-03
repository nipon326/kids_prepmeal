import Link from "next/link";
import { notFound } from "next/navigation";
import { swapAction } from "@/app/actions";
import { alternatives } from "@/lib/domain/planner";
import { loadLibrary, loadPlans, requireSession } from "@/lib/data";
import { COOK_LABELS, PROTEIN_EMOJI, PROTEIN_LABELS } from "@/lib/labels";
import { isWeekStart } from "@/lib/week";

export default async function SwapPage({ searchParams }: PageProps<"/swap">) {
  const q = await searchParams;
  const week = q.week as string;
  const childId = q.child as string;
  const recipeId = q.recipe as string;
  if (!isWeekStart(week) || !childId || !recipeId) notFound();

  const s = await requireSession();
  const lib = await loadLibrary(s);
  const { plan, history } = await loadPlans(s, week);
  if (!plan) notFound();
  const current = lib.recipes.find((r) => r.id === recipeId);
  const child = lib.children.find((c) => c.id === childId);
  if (!current || !child) notFound();

  const options = alternatives({ weekStart: week, ...lib, history }, plan, childId, recipeId, 50);
  const newParams = new URLSearchParams({
    role: current.role,
    ...(current.role === "main" ? { protein: plan.proteinGroup } : {}),
  });

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/?week=${week}`} className="text-sm text-muted">‹ กลับ</Link>
      <div>
        <p className="text-sm text-muted">สลับเมนูของ{child.name}</p>
        <h1 className="h1">แทน “{current.title}”</h1>
      </div>

      {options.length === 0 ? (
        <p className="card text-muted">ยังไม่มีเมนูอื่นที่ใช้แทนได้</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {options.map((r) => (
            <li key={r.id}>
              <form action={swapAction} className="card flex items-center justify-between gap-3">
                <input type="hidden" name="week" value={week} />
                <input type="hidden" name="child" value={childId} />
                <input type="hidden" name="old" value={recipeId} />
                <input type="hidden" name="new" value={r.id} />
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted">
                    {r.proteinGroup && `${PROTEIN_EMOJI[r.proteinGroup]} ${PROTEIN_LABELS[r.proteinGroup]} · `}
                    {COOK_LABELS[r.cookMethod]}
                  </p>
                </div>
                <button className="btn-primary min-h-9 px-3 text-sm">เลือก</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <Link href={`/recipes/new?${newParams}`} className="btn">+ เพิ่มเมนูใหม่เอง</Link>
    </div>
  );
}
