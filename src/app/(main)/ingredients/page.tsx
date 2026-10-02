import { deleteIngredientAction, saveIngredientAction } from "@/app/actions";
import { ALLERGEN_LABELS } from "@/lib/domain/allergens";
import { CATEGORY_ORDER } from "@/lib/domain/shopping";
import type { Allergen, ProteinGroup, VegColor } from "@/lib/domain/types";
import { loadLibrary, requireSession, type LibraryIngredient } from "@/lib/data";
import { CATEGORY_OPTIONS, FOOD_GROUP_LABELS, PROTEIN_LABELS, UNIT_LABELS } from "@/lib/labels";

const ALLERGENS = Object.keys(ALLERGEN_LABELS) as Allergen[];
const PROTEINS = Object.keys(PROTEIN_LABELS) as ProteinGroup[];
const COLOR_LABELS: Record<VegColor, string> = {
  green: "เขียว",
  orange: "ส้ม",
  red: "แดง",
  purple: "ม่วง",
  white: "ขาว",
  yellow: "เหลือง",
};

export default async function IngredientsPage({ searchParams }: PageProps<"/ingredients">) {
  const q = await searchParams;
  const error = typeof q.error === "string" ? q.error : undefined;
  const lib = await loadLibrary(await requireSession());

  return (
    <div className="flex flex-col gap-4">
      <h1 className="h1">วัตถุดิบ</h1>
      <p className="text-sm text-muted">
        เป็นของบ้านคุณ แก้ได้ทุกอย่าง ใช้ในสูตร รายการซื้อของ และการตรวจสารก่อภูมิแพ้ ติ๊กสารก่อภูมิแพ้ให้ครบ เพราะระบบใช้แท็กนี้ตัดเมนูที่ลูกกินไม่ได้
      </p>
      {error && <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}

      <details className="card" open={lib.ingredients.length === 0}>
        <summary className="cursor-pointer font-bold">+ เพิ่มวัตถุดิบ</summary>
        <IngredientForm />
      </details>

      {CATEGORY_ORDER.map((cat) => {
        const items = lib.ingredients.filter((i) => i.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat} className="flex flex-col gap-2">
            <h2 className="label">{CATEGORY_OPTIONS[cat]} ({items.length})</h2>
            {items.map((i) => (
              <details key={i.id} className="card">
                <summary className="cursor-pointer">
                  <span className="font-medium">{i.name}</span>
                  <span className="ml-2 text-xs text-muted">
                    {i.pack ? `${i.pack.size} ${UNIT_LABELS[i.unit]} / ${i.pack.label}` : UNIT_LABELS[i.unit]}
                    {i.ironRich && " · เหล็ก"}
                    {i.calciumRich && " · แคลเซียม"}
                  </span>
                  {i.allergens.length > 0 && (
                    <span className="ml-2 text-xs text-danger">แพ้: {i.allergens.map((a) => ALLERGEN_LABELS[a].split(" ")[0]).join(", ")}</span>
                  )}
                </summary>
                <IngredientForm ingredient={i} />
                <form action={deleteIngredientAction} className="mt-2">
                  <input type="hidden" name="id" value={i.id} />
                  <button className="btn w-full text-danger">ลบ {i.name}</button>
                </form>
              </details>
            ))}
          </section>
        );
      })}
    </div>
  );
}

function IngredientForm({ ingredient }: { ingredient?: LibraryIngredient }) {
  const k = ingredient?.id ?? "new";
  return (
    <form action={saveIngredientAction} className="mt-3 flex flex-col gap-3">
      {ingredient && <input type="hidden" name="id" value={ingredient.id} />}
      <div>
        <label className="label" htmlFor={`n-${k}`}>ชื่อ</label>
        <input id={`n-${k}`} name="name" defaultValue={ingredient?.name} required maxLength={80} className="input" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label" htmlFor={`c-${k}`}>หมวดในซูเปอร์</label>
          <select id={`c-${k}`} name="category" defaultValue={ingredient?.category ?? "vegetable"} className="input">
            {Object.entries(CATEGORY_OPTIONS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`g-${k}`}>หมู่อาหาร</label>
          <select id={`g-${k}`} name="food_group" defaultValue={ingredient?.foodGroup ?? "vegetable"} className="input">
            {Object.entries(FOOD_GROUP_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`u-${k}`}>หน่วย</label>
          <select id={`u-${k}`} name="unit" defaultValue={ingredient?.unit ?? "g"} className="input">
            {Object.entries(UNIT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label" htmlFor={`ps-${k}`}>ขนาดแพ็คที่ซื้อ</label>
          <input id={`ps-${k}`} name="pack_size" type="number" step="any" min="0" inputMode="decimal" defaultValue={ingredient?.pack?.size} placeholder="เช่น 300" className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`pl-${k}`}>เรียกว่า</label>
          <input id={`pl-${k}`} name="pack_label" maxLength={30} defaultValue={ingredient?.pack?.label} placeholder="เช่น แพ็ค, ถุง" className="input" />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted">ใส่ทั้งสองช่องเพื่อให้รายการซื้อของนับเป็นแพ็ค เว้นว่างได้ถ้าซื้อตามน้ำหนัก</p>
      <fieldset>
        <legend className="label">สารก่อภูมิแพ้ที่มีอยู่ในวัตถุดิบนี้</legend>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <label key={a} className="chip has-[:checked]:bg-danger-soft has-[:checked]:text-danger">
              <input type="checkbox" name="allergens" value={a} defaultChecked={ingredient?.allergens.includes(a)} className="sr-only" />
              {ALLERGEN_LABELS[a]}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">ระบบตรวจคำในชื่อ (เช่น “หอย”, “แป้งสาลี”) ด้วยเสมอ แม้ไม่ได้ติ๊ก</p>
      </fieldset>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label" htmlFor={`pg-${k}`}>โปรตีนหลัก (ถ้าเป็นเนื้อสัตว์/ไข่/เต้าหู้)</label>
          <select id={`pg-${k}`} name="protein_group" defaultValue={ingredient?.proteinGroup ?? ""} className="input">
            <option value="">ไม่ใช่</option>
            {PROTEINS.map((p) => (
              <option key={p} value={p}>{PROTEIN_LABELS[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`co-${k}`}>สี (ใช้ดูความหลากหลายของผัก)</label>
          <select id={`co-${k}`} name="color" defaultValue={ingredient?.color ?? ""} className="input">
            <option value="">ไม่ระบุ</option>
            {Object.entries(COLOR_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="chip has-[:checked]:bg-accent-soft has-[:checked]:ring-1 has-[:checked]:ring-accent">
          <input type="checkbox" name="iron_rich" defaultChecked={ingredient?.ironRich} className="sr-only" />
          แหล่งธาตุเหล็ก
        </label>
        <label className="chip has-[:checked]:bg-accent-soft has-[:checked]:ring-1 has-[:checked]:ring-accent">
          <input type="checkbox" name="calcium_rich" defaultChecked={ingredient?.calciumRich} className="sr-only" />
          แหล่งแคลเซียม
        </label>
      </div>
      <div>
        <label className="label" htmlFor={`ma-${k}`}>อายุขั้นต่ำ (เดือน) ถ้าไม่เหมาะกับเด็กเล็ก</label>
        <input id={`ma-${k}`} name="min_age_months" type="number" min="0" max="72" inputMode="numeric" defaultValue={ingredient?.minAgeMonths} placeholder="เว้นว่างถ้ากินได้ทุกวัย" className="input" />
      </div>
      <button className="btn-primary">บันทึก</button>
    </form>
  );
}
