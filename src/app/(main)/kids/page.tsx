import { deleteChildAction, saveChildAction, signOutAction, toggleIntroducedAction } from "@/app/actions";
import { stageOf } from "@/lib/domain/age";
import { ALLERGEN_LABELS } from "@/lib/domain/allergens";
import { CATEGORY_ORDER } from "@/lib/domain/shopping";
import type { Allergen, Child } from "@/lib/domain/types";
import { loadLibrary, requireSession, type LibraryIngredient } from "@/lib/data";
import { formatAge } from "@/lib/format";
import { CATEGORY_OPTIONS } from "@/lib/labels";
import { bangkokToday } from "@/lib/week";

const ALLERGENS = Object.keys(ALLERGEN_LABELS) as Allergen[];

export default async function KidsPage() {
  const lib = await loadLibrary(await requireSession());
  const today = bangkokToday();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="h1">ลูก</h1>

      {lib.children.map((child) => (
        <section key={child.id} className="card flex flex-col gap-3">
          <header className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">{child.name}</h2>
            <span className="text-sm text-muted">{formatAge(child.birthDate, today)}</span>
          </header>
          <p className="text-sm">
            {child.allergens.length > 0 ? (
              <span className="text-danger">แพ้: {child.allergens.map((a) => ALLERGEN_LABELS[a]).join(", ")}</span>
            ) : (
              <span className="text-muted">ไม่มีอาหารที่แพ้</span>
            )}
          </p>

          {stageOf(child, today) === "puree" && <IntroducedFoods child={child} ingredients={lib.ingredients} />}

          <details>
            <summary className="cursor-pointer text-sm text-muted">แก้ไขข้อมูล</summary>
            <ChildForm child={child} />
            <form action={deleteChildAction} className="mt-2">
              <input type="hidden" name="id" value={child.id} />
              <button className="btn w-full text-danger">ลบข้อมูล{child.name}</button>
            </form>
          </details>
        </section>
      ))}

      <details className="card" open={lib.children.length === 0}>
        <summary className="cursor-pointer font-bold">+ เพิ่มลูก</summary>
        <ChildForm />
      </details>

      <form action={signOutAction}>
        <button className="btn w-full text-muted">ออกจากระบบ</button>
      </form>
    </div>
  );
}

function ChildForm({ child }: { child?: Child }) {
  return (
    <form action={saveChildAction} className="mt-3 flex flex-col gap-3">
      {child && <input type="hidden" name="id" value={child.id} />}
      <div>
        <label className="label" htmlFor={`name-${child?.id ?? "new"}`}>ชื่อเล่น</label>
        <input id={`name-${child?.id ?? "new"}`} name="name" defaultValue={child?.name} required maxLength={50} className="input" />
      </div>
      <div>
        <label className="label" htmlFor={`bd-${child?.id ?? "new"}`}>วันเกิด</label>
        <input id={`bd-${child?.id ?? "new"}`} name="birth_date" type="date" defaultValue={child?.birthDate} required className="input" />
      </div>
      <fieldset>
        <legend className="label">อาหารที่แพ้</legend>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <label key={a} className="chip has-[:checked]:bg-danger-soft has-[:checked]:text-danger">
              <input type="checkbox" name="allergens" value={a} defaultChecked={child?.allergens.includes(a)} className="sr-only" />
              {ALLERGEN_LABELS[a]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor={`scale-${child?.id ?? "new"}`}>ขนาดมื้อ (1 = ปกติ, 1.2 = กินเยอะกว่าปกติ 20%)</label>
        <input
          id={`scale-${child?.id ?? "new"}`}
          name="portion_scale"
          type="number"
          step="0.1"
          min="0.5"
          max="3"
          defaultValue={child?.portionScale ?? 1}
          className="input"
        />
      </div>
      <button className="btn-primary">บันทึก</button>
    </form>
  );
}

function IntroducedFoods({ child, ingredients }: { child: Child; ingredients: LibraryIngredient[] }) {
  const known = new Set(child.introducedIngredientIds);
  const foods = ingredients.filter((i) => i.foodGroup !== "seasoning" && i.foodGroup !== "fat");
  return (
    <details>
      <summary className="cursor-pointer text-sm">
        อาหารที่ลองแล้ว <span className="text-muted">({known.size} อย่าง)</span>
      </summary>
      <p className="mt-2 text-sm text-muted">ติ๊กอาหารที่{child.name}เคยกินแล้วไม่มีอาการ แผนจะใช้อาหารเหล่านี้ และค่อยๆ แนะนำอาหารใหม่ไม่เกินสัปดาห์ละ 2 อย่าง</p>
      {CATEGORY_ORDER.filter((c) => c !== "pantry").map((cat) => {
        const items = foods.filter((i) => i.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="mt-3">
            <h3 className="label">{CATEGORY_OPTIONS[cat]}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((i) => {
                const on = known.has(i.id);
                return (
                  <form key={i.id} action={toggleIntroducedAction}>
                    <input type="hidden" name="child" value={child.id} />
                    <input type="hidden" name="ingredient" value={i.id} />
                    <input type="hidden" name="on" value={on ? "0" : "1"} />
                    <button className={`chip ${on ? "bg-accent-soft ring-1 ring-accent" : "opacity-70"}`}>
                      {on ? "✓ " : ""}
                      {i.name}
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        );
      })}
    </details>
  );
}
