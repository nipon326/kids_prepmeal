import Link from "next/link";
import { buildShoppingList, CATEGORY_LABELS, CATEGORY_ORDER, formatAmount } from "@/lib/domain/shopping";
import { loadLibrary, loadPlans, requireSession } from "@/lib/data";
import { bangkokToday, defaultWeekStart, formatWeek, isWeekStart } from "@/lib/week";
import { Checklist } from "./Checklist";

export default async function ShoppingPage({ searchParams }: PageProps<"/shopping">) {
  const q = await searchParams;
  const week = isWeekStart(q.week as string) ? (q.week as string) : defaultWeekStart(bangkokToday());
  const s = await requireSession();
  const lib = await loadLibrary(s);
  const { plan } = await loadPlans(s, week);

  if (!plan) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="h1">ซื้อของ · {formatWeek(week)}</h1>
        <div className="card text-center">
          <p className="mb-3 text-muted">ยังไม่มีแผนของสัปดาห์นี้</p>
          <Link href={`/?week=${week}`} className="btn-primary">ไปจัดแผน</Link>
        </div>
      </div>
    );
  }

  const lines = buildShoppingList(plan, lib.recipes, lib.ingredients, lib.children);
  const groups = CATEGORY_ORDER.map((cat) => ({
    key: cat,
    title: CATEGORY_LABELS[cat],
    items: lines
      .filter((l) => l.category === cat)
      .map((l) => ({
        id: l.ingredientId,
        name: l.name,
        detail: l.checkOnly
          ? ""
          : l.packs
            ? `${l.packs.count} ${l.packs.label} (ใช้ ${formatAmount(l.needed, l.unit)})`
            : formatAmount(l.needed, l.unit),
      })),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="h1">ซื้อของ</h1>
        <p className="text-muted">{formatWeek(week)} · รวมของทั้งสองคน เผื่อไว้ 10%</p>
      </div>
      <Checklist storageKey={`shopping:${week}`} groups={groups} />
    </div>
  );
}
