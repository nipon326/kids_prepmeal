import Link from "next/link";
import { confirmPlanAction, generatePlanAction, rateAction, toggleIntroducedAction } from "@/app/actions";
import { stageOf } from "@/lib/domain/age";
import { checkPlan } from "@/lib/domain/nutrition";
import { findShortfalls, pureeGroupOf, ROTATION, type Shortfall } from "@/lib/domain/planner";
import type { Child, PlanItem } from "@/lib/domain/types";
import { loadLibrary, loadPlans, requireSession, type LibraryRecipe } from "@/lib/data";
import { formatAge } from "@/lib/format";
import { FOOD_GROUP_LABELS, PROTEIN_EMOJI, PROTEIN_LABELS, RATING_OPTIONS } from "@/lib/labels";
import { addDays, bangkokToday, defaultWeekStart, formatWeek, isWeekStart } from "@/lib/week";

export default async function WeekPage({ searchParams }: PageProps<"/">) {
  const q = await searchParams;
  const week = isWeekStart(q.week as string) ? (q.week as string) : defaultWeekStart(bangkokToday());
  const s = await requireSession();
  const lib = await loadLibrary(s);
  const { plan, history } = await loadPlans(s, week);
  const recipeById = new Map(lib.recipes.map((r) => [r.id, r]));
  const ingById = new Map(lib.ingredients.map((i) => [i.id, i]));
  const input = { weekStart: week, ...lib, history };
  const shortfalls = plan ? findShortfalls(input, plan) : [];
  const checks = plan ? checkPlan(plan, history, lib.recipes, lib.ingredients, lib.children) : [];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <Link href={`/?week=${addDays(week, -7)}`} className="btn px-3" aria-label="สัปดาห์ก่อน">‹</Link>
        <div className="text-center">
          <p className="text-sm text-muted">แผนสัปดาห์</p>
          <h1 className="text-xl font-bold">{formatWeek(week)}</h1>
        </div>
        <Link href={`/?week=${addDays(week, 7)}`} className="btn px-3" aria-label="สัปดาห์หน้า">›</Link>
      </header>

      {lib.children.length === 0 ? (
        <div className="card text-center">
          <p className="mb-3">เริ่มจากใส่ข้อมูลลูกก่อน (วันเกิดและอาหารที่แพ้)</p>
          <Link href="/kids" className="btn-primary">เพิ่มข้อมูลลูก</Link>
        </div>
      ) : !plan ? (
        <GenerateCard week={week} />
      ) : (
        <>
          <section className="card flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">โปรตีนหลักสัปดาห์นี้</p>
              <p className="text-2xl font-bold">
                {PROTEIN_EMOJI[plan.proteinGroup]} {PROTEIN_LABELS[plan.proteinGroup]}
              </p>
            </div>
            {plan.status === "confirmed" ? (
              <span className="chip bg-accent-soft">✓ ยืนยันแล้ว</span>
            ) : (
              <form action={confirmPlanAction}>
                <input type="hidden" name="week" value={week} />
                <button className="btn-primary">ใช้แผนนี้</button>
              </form>
            )}
          </section>

          {shortfalls.length > 0 && <Shortfalls items={shortfalls} kids={lib.children} />}

          {lib.children.map((child) => (
            <ChildPlan
              key={child.id}
              child={child}
              week={week}
              items={plan.items.filter((i) => i.childId === child.id)}
              recipeById={recipeById}
              lastRating={(recipeId) =>
                lib.ratings
                  .filter((r) => r.childId === child.id && r.recipeId === recipeId)
                  .sort((a, b) => b.date.localeCompare(a.date))[0]?.rating
              }
              groupOf={(r) => pureeGroupOf(r, ingById)}
              newFoods={plan.newFoods
                .filter((n) => n.childId === child.id)
                .map((n) => ({ id: n.ingredientId, name: ingById.get(n.ingredientId)?.name ?? n.ingredientId, done: child.introducedIngredientIds.includes(n.ingredientId) }))}
              checks={checks.filter((c) => c.childId === child.id)}
            />
          ))}

          <details className="card">
            <summary className="cursor-pointer font-medium">สร้างแผนใหม่ / เปลี่ยนโปรตีน</summary>
            <p className="mt-2 text-sm text-muted">แผนเดิมของสัปดาห์นี้จะถูกแทนที่</p>
            <ProteinForm week={week} />
          </details>
        </>
      )}
    </div>
  );
}

function GenerateCard({ week }: { week: string }) {
  return (
    <section className="card flex flex-col gap-3">
      <h2 className="text-lg font-bold">ยังไม่มีแผนสัปดาห์นี้</h2>
      <p className="text-muted">กดปุ่มเดียว แอปจะเลือกโปรตีนที่ไม่ได้กินมานานที่สุด แล้วจัดเมนูให้ครบทั้งสองคน</p>
      <ProteinForm week={week} />
    </section>
  );
}

function ProteinForm({ week }: { week: string }) {
  return (
    <form action={generatePlanAction} className="mt-2 flex flex-col gap-3">
      <input type="hidden" name="week" value={week} />
      <fieldset className="flex flex-wrap gap-2">
        <legend className="label">โปรตีนหลัก</legend>
        <label className="chip has-[:checked]:bg-accent has-[:checked]:text-accent-fg">
          <input type="radio" name="protein" value="" defaultChecked className="sr-only" />
          ✨ ให้แอปเลือก
        </label>
        {ROTATION.map((p) => (
          <label key={p} className="chip has-[:checked]:bg-accent has-[:checked]:text-accent-fg">
            <input type="radio" name="protein" value={p} className="sr-only" />
            {PROTEIN_EMOJI[p]} {PROTEIN_LABELS[p]}
          </label>
        ))}
      </fieldset>
      <button className="btn-primary">จัดแผนสัปดาห์นี้</button>
    </form>
  );
}

function Shortfalls({ items, kids }: { items: Shortfall[]; kids: Child[] }) {
  const name = (id: string) => kids.find((k) => k.id === id)?.name ?? "";
  return (
    <section className="card border-warn/40 bg-warn-soft">
      <h2 className="font-bold text-warn">เมนูในคลังยังไม่พอ</h2>
      <ul className="mt-2 flex flex-col gap-2 text-sm">
        {items.map((s, i) => {
          const what =
            s.role === "main"
              ? `กับข้าว${s.proteinGroup ? PROTEIN_LABELS[s.proteinGroup] : ""}`
              : s.role === "breakfast"
                ? "มื้อเช้า"
                : `อาหารบดหมู่${FOOD_GROUP_LABELS[s.group!]}`;
          const params = new URLSearchParams({ role: s.role, ...(s.proteinGroup && s.role === "main" ? { protein: s.proteinGroup } : {}) });
          return (
            <li key={i} className="flex items-center justify-between gap-2">
              <span>
                {name(s.childId)}: {what} ขาด {s.needed - s.found} เมนู
              </span>
              <Link href={`/recipes/new?${params}`} className="btn min-h-9 px-3 text-sm">+ เพิ่มเมนู</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type ChildPlanProps = {
  child: Child;
  week: string;
  items: PlanItem[];
  recipeById: Map<string, LibraryRecipe>;
  lastRating: (recipeId: string) => string | undefined;
  groupOf: (r: LibraryRecipe) => string | undefined;
  newFoods: { id: string; name: string; done: boolean }[];
  checks: ReturnType<typeof checkPlan>;
};

function ChildPlan({ child, week, items, recipeById, lastRating, groupOf, newFoods, checks }: ChildPlanProps) {
  const stage = stageOf(child, week);
  const sections =
    stage === "toddler"
      ? [
          { title: "มื้อเช้า (ทั้งสัปดาห์)", items: items.filter((i) => i.role === "breakfast") },
          { title: "กับข้าว เที่ยง/เย็น (หมุนกิน)", items: items.filter((i) => i.role === "main") },
        ]
      : (["protein", "carb", "vegetable", "fruit"] as const).map((g) => ({
          title: `อาหารบด · ${FOOD_GROUP_LABELS[g]}`,
          items: items.filter((i) => {
            const r = recipeById.get(i.recipeId);
            return r && groupOf(r) === g;
          }),
        }));

  return (
    <section className="card flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">{child.name}</h2>
        <span className="text-sm text-muted">
          {formatAge(child.birthDate, week)} · {stage === "toddler" ? "เมนูชุด" : "อาหารบดแช่แข็ง"}
        </span>
      </header>

      {sections.map((sec) => (
        <div key={sec.title}>
          <h3 className="label">{sec.title}</h3>
          {sec.items.length === 0 ? (
            <p className="text-sm text-muted">—</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sec.items.map((item) => {
                const r = recipeById.get(item.recipeId);
                if (!r) return null;
                const rated = lastRating(r.id);
                return (
                  <li key={item.recipeId} className="rounded-xl bg-surface-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/recipes/${r.id}`} className="font-medium underline-offset-2 hover:underline">
                        {r.title}
                      </Link>
                      <span className="shrink-0 text-sm text-muted">× {item.portions}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex gap-1">
                        {RATING_OPTIONS.map((o) => (
                          <form key={o.value} action={rateAction}>
                            <input type="hidden" name="child" value={child.id} />
                            <input type="hidden" name="recipe" value={r.id} />
                            <input type="hidden" name="rating" value={o.value} />
                            <button
                              aria-label={o.label}
                              className={`size-9 rounded-full text-lg ${rated === o.value ? "bg-accent-soft ring-2 ring-accent" : "opacity-60"}`}
                            >
                              {o.emoji}
                            </button>
                          </form>
                        ))}
                      </div>
                      <Link
                        href={`/swap?${new URLSearchParams({ week, child: child.id, recipe: r.id })}`}
                        className="btn min-h-9 px-3 text-sm"
                      >
                        ⇄ สลับ
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}

      {newFoods.length > 0 && (
        <div className="rounded-xl border border-dashed border-line p-3">
          <h3 className="font-medium">🆕 อาหารใหม่ที่จะลองสัปดาห์นี้</h3>
          <p className="text-sm text-muted">ลองทีละอย่าง เว้นประมาณ 3 วัน แล้วสังเกตอาการ</p>
          <ul className="mt-2 flex flex-col gap-2">
            {newFoods.map((f) => (
              <li key={f.id} className="flex items-center justify-between">
                <span>{f.name}</span>
                {f.done ? (
                  <span className="chip bg-accent-soft">✓ กินได้</span>
                ) : (
                  <form action={toggleIntroducedAction}>
                    <input type="hidden" name="child" value={child.id} />
                    <input type="hidden" name="ingredient" value={f.id} />
                    <input type="hidden" name="on" value="1" />
                    <button className="btn min-h-9 px-3 text-sm">ลองแล้ว ไม่มีอาการ</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {checks.length > 0 && (
        <ul className="flex flex-col gap-2">
          {checks.map((c) => (
            <li
              key={c.code + c.message}
              className={`rounded-xl p-3 text-sm ${c.severity === "warn" ? "bg-warn-soft text-warn" : "bg-surface-2 text-muted"}`}
            >
              {c.severity === "warn" ? "⚠️ " : "💡 "}
              {c.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
