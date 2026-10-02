import Link from "next/link";
import { buildShoppingList, formatAmount } from "@/lib/domain/shopping";
import { loadLibrary, loadPlans, requireSession } from "@/lib/data";
import { stripStepNumber } from "@/lib/format";
import { bangkokToday, defaultWeekStart, formatWeek, isWeekStart } from "@/lib/week";

export default async function PrepPage({ searchParams }: PageProps<"/prep">) {
  const q = await searchParams;
  const week = isWeekStart(q.week as string) ? (q.week as string) : defaultWeekStart(bangkokToday());
  const s = await requireSession();
  const lib = await loadLibrary(s);
  const { plan } = await loadPlans(s, week);

  if (!plan) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="h1">วันเตรียม · {formatWeek(week)}</h1>
        <div className="card text-center">
          <p className="mb-3 text-muted">ยังไม่มีแผนของสัปดาห์นี้</p>
          <Link href={`/?week=${week}`} className="btn-primary">ไปจัดแผน</Link>
        </div>
      </div>
    );
  }

  const recipeById = new Map(lib.recipes.map((r) => [r.id, r]));
  const childById = new Map(lib.children.map((c) => [c.id, c]));
  const usedBy = new Map<string, Set<string>>();
  for (const item of plan.items) {
    const r = recipeById.get(item.recipeId);
    r?.ingredients.forEach((ri) => {
      if (!usedBy.has(ri.ingredientId)) usedBy.set(ri.ingredientId, new Set());
      usedBy.get(ri.ingredientId)!.add(r.title);
    });
  }
  const prepLines = buildShoppingList(plan, lib.recipes, lib.ingredients, lib.children).filter((l) => !l.checkOnly);

  // Plain baby purees go first, before anything gets seasoned.
  const cookOrder = [...plan.items].sort((a, b) => (a.role === "puree" ? 0 : 1) - (b.role === "puree" ? 0 : 1));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="h1">วันเตรียม</h1>
        <p className="text-muted">{formatWeek(week)}</p>
      </div>

      <section className="card">
        <h2 className="mb-1 text-lg font-bold">1. เตรียมวัตถุดิบรวมทีเดียว</h2>
        <p className="mb-3 text-sm text-muted">ล้าง หั่น ต้ม ในรอบเดียว แล้วแบ่งไปใช้แต่ละเมนู</p>
        <ul className="flex flex-col gap-2">
          {prepLines.map((l) => (
            <li key={l.ingredientId} className="rounded-xl bg-surface-2 p-3">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{l.name}</span>
                <span className="text-sm text-muted">{formatAmount(l.needed, l.unit)}</span>
              </div>
              <p className="text-sm text-muted">ใช้ใน: {[...(usedBy.get(l.ingredientId) ?? [])].join(", ")}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="mb-1 text-lg font-bold">2. ทำทีละเมนู แล้วแบ่งกล่อง</h2>
        <p className="mb-3 text-sm text-muted">เริ่มจากอาหารบดของน้อง (ยังไม่ปรุงรส) ก่อน</p>
        <ol className="flex flex-col gap-3">
          {cookOrder.map((item, idx) => {
            const r = recipeById.get(item.recipeId);
            if (!r) return null;
            const child = childById.get(item.childId);
            return (
              <li key={`${item.childId}-${item.recipeId}`} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/recipes/${r.id}`} className="font-medium">
                    {idx + 1}. {r.title}
                  </Link>
                  <span className="chip shrink-0">{child?.name}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-accent">
                  {item.role === "puree" ? `แบ่ง ${item.portions} ก้อน (ถาดน้ำแข็ง)` : `แบ่ง ${item.portions} กล่อง`}
                </p>
                {r.instructions.length > 0 && (
                  <ol className="mt-2 list-decimal pl-5 text-sm text-muted">
                    {r.instructions.map((step, i) => (
                      <li key={i}>{stripStepNumber(step)}</li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="card text-sm text-muted">
        <h2 className="mb-1 font-bold text-fg">3. เก็บให้ปลอดภัย</h2>
        <ul className="list-disc pl-5">
          <li>พักให้เย็นแล้วเข้าช่องฟรีซภายใน 2 ชั่วโมง</li>
          <li>เขียนชื่อเมนูและวันที่บนกล่อง</li>
          <li>ละลายในตู้เย็นข้ามคืน อุ่นให้ร้อนทั่วถึง ไม่แช่แข็งซ้ำ</li>
          <li>ก้อนอาหารบดที่ละลายแล้วใช้ให้หมดใน 24 ชั่วโมง</li>
        </ul>
      </section>
    </div>
  );
}
