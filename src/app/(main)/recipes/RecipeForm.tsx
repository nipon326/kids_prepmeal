"use client";

import { useMemo, useState, useTransition } from "react";
import { saveRecipeAction, type RecipePayload } from "@/app/actions";
import { ALLERGEN_LABELS, allergensInName } from "@/lib/domain/allergens";
import type {
  Allergen,
  CookMethod,
  FoodGroup,
  Ingredient,
  MealRole,
  ProteinGroup,
  ShoppingCategory,
} from "@/lib/domain/types";
import {
  CATEGORY_OPTIONS,
  COOK_LABELS,
  FOOD_GROUP_LABELS,
  PROTEIN_LABELS,
  ROLE_LABELS,
  UNIT_LABELS,
} from "@/lib/labels";

type Row = {
  key: number;
  name: string;
  amount: string;
  category: ShoppingCategory;
  foodGroup: FoodGroup;
  unit: Ingredient["unit"];
  allergens: Allergen[];
};

type Props = {
  ingredients: Pick<Ingredient, "id" | "name" | "unit" | "allergens">[];
  kids: { name: string; allergens: Allergen[] }[];
  initial?: {
    id?: string;
    title: string;
    role: MealRole;
    minAgeMonths: number;
    proteinGroup?: ProteinGroup;
    cookMethod: CookMethod;
    instructions: string[];
    ingredients: { name: string; amount: number }[];
  };
  defaults: { role?: MealRole; protein?: ProteinGroup };
  fromAi?: boolean;
};

const ROLES = Object.keys(ROLE_LABELS) as MealRole[];
const METHODS = Object.keys(COOK_LABELS) as CookMethod[];
const PROTEINS = Object.keys(PROTEIN_LABELS) as ProteinGroup[];
const ALLERGENS = Object.keys(ALLERGEN_LABELS) as Allergen[];

let nextKey = 1;
const emptyRow = (name = "", amount = ""): Row => ({
  key: nextKey++,
  name,
  amount,
  category: "vegetable",
  foodGroup: "vegetable",
  unit: "g",
  allergens: [],
});

export function RecipeForm({ ingredients, kids, initial, defaults, fromAi }: Props) {
  const byName = useMemo(() => new Map(ingredients.map((i) => [i.name, i])), [ingredients]);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [role, setRole] = useState<MealRole>(initial?.role ?? defaults.role ?? "main");
  const [minAge, setMinAge] = useState(String(initial?.minAgeMonths ?? (role === "puree" ? 6 : 12)));
  const [protein, setProtein] = useState<ProteinGroup | "">(initial?.proteinGroup ?? defaults.protein ?? "");
  const [method, setMethod] = useState<CookMethod>(initial?.cookMethod ?? (role === "puree" ? "blend" : "boil"));
  const [rows, setRows] = useState<Row[]>(
    initial?.ingredients.map((i) => emptyRow(i.name, String(i.amount))) ?? [emptyRow()],
  );
  const [steps, setSteps] = useState(initial?.instructions.join("\n") ?? "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const present = new Set<Allergen>([...allergensInName(title)]);
  for (const r of rows) {
    const known = byName.get(r.name.trim());
    (known ? known.allergens : r.allergens).forEach((a) => present.add(a));
    allergensInName(r.name).forEach((a) => present.add(a));
  }
  const unsafeFor = kids
    .map((k) => ({ name: k.name, hits: k.allergens.filter((a) => present.has(a)) }))
    .filter((k) => k.hits.length > 0);

  function submit() {
    setError(undefined);
    const payload: RecipePayload = {
      id: initial?.id,
      fromAi,
      title,
      role,
      minAgeMonths: Number(minAge),
      proteinGroup: protein || undefined,
      cookMethod: method,
      instructions: steps.split("\n"),
      ingredients: rows
        .filter((r) => r.name.trim())
        .map((r) => {
          const known = byName.get(r.name.trim());
          return known
            ? { ingredientId: known.id, amountPerPortion: Number(r.amount) }
            : {
                newIngredient: {
                  name: r.name.trim(),
                  category: r.category,
                  foodGroup: r.foodGroup,
                  unit: r.unit,
                  allergens: r.allergens,
                },
                amountPerPortion: Number(r.amount),
              };
        }),
    };
    startTransition(async () => {
      const res = await saveRecipeAction(JSON.stringify(payload));
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="card flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="title">ชื่อเมนู</label>
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        </div>

        <fieldset>
          <legend className="label">เมนูสำหรับ</legend>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => {
                  setRole(r);
                  setMinAge(r === "puree" ? "6" : "12");
                  if (r === "puree") setMethod("blend");
                }}
                className={`chip ${role === r ? "bg-accent text-accent-fg" : ""}`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="protein">โปรตีนหลัก{role === "main" ? "" : " (ถ้ามี)"}</label>
            <select id="protein" className="input" value={protein} onChange={(e) => setProtein(e.target.value as ProteinGroup | "")}>
              <option value="">—</option>
              {PROTEINS.map((p) => (
                <option key={p} value={p}>{PROTEIN_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="minAge">อายุขั้นต่ำ (เดือน)</label>
            <input id="minAge" type="number" inputMode="numeric" min={6} max={72} className="input" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
          </div>
        </div>

        <fieldset>
          <legend className="label">วิธีทำ</legend>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button type="button" key={m} onClick={() => setMethod(m)} className={`chip ${method === m ? "bg-accent text-accent-fg" : ""}`}>
                {COOK_LABELS[m]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="card flex flex-col gap-3">
        <div>
          <h2 className="font-bold">วัตถุดิบ ต่อ 1 มื้อ</h2>
          <p className="text-sm text-muted">
            {role === "puree" ? "1 มื้อ = 1 ก้อนอาหารบด" : "1 มื้อ = 1 กล่องของลูก"} · ระบบคูณจำนวนมื้อให้เองตอนทำ shopping list
          </p>
        </div>
        <datalist id="ingredient-names">
          {ingredients.map((i) => (
            <option key={i.id} value={i.name} />
          ))}
        </datalist>
        {rows.map((r) => {
          const known = byName.get(r.name.trim());
          const isNew = r.name.trim() !== "" && !known;
          const unit = known?.unit ?? r.unit;
          return (
            <div key={r.key} className="rounded-xl bg-surface-2 p-3">
              <div className="flex gap-2">
                <input
                  list="ingredient-names"
                  placeholder="พิมพ์หรือเลือกวัตถุดิบ"
                  className="input flex-1"
                  value={r.name}
                  onChange={(e) =>
                    updateRow(r.key, { name: e.target.value, allergens: allergensInName(e.target.value) })
                  }
                />
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  placeholder="0"
                  className="input w-20"
                  value={r.amount}
                  onChange={(e) => updateRow(r.key, { amount: e.target.value })}
                  aria-label="ปริมาณ"
                />
                <span className="self-center text-sm text-muted">{UNIT_LABELS[unit]}</span>
                <button
                  type="button"
                  aria-label="ลบ"
                  className="px-2 text-muted"
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [emptyRow()]))}
                >
                  ✕
                </button>
              </div>
              {isNew && (
                <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                  <p className="text-sm font-medium">วัตถุดิบใหม่ — บอกข้อมูลเพิ่มนิดหน่อย</p>
                  <div className="grid grid-cols-3 gap-2">
                    <select className="input" value={r.category} onChange={(e) => updateRow(r.key, { category: e.target.value as ShoppingCategory })} aria-label="หมวดในซูเปอร์">
                      {Object.entries(CATEGORY_OPTIONS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <select className="input" value={r.foodGroup} onChange={(e) => updateRow(r.key, { foodGroup: e.target.value as FoodGroup })} aria-label="หมู่อาหาร">
                      {Object.entries(FOOD_GROUP_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <select className="input" value={r.unit} onChange={(e) => updateRow(r.key, { unit: e.target.value as Ingredient["unit"] })} aria-label="หน่วย">
                      {Object.entries(UNIT_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-sm text-muted">มีสารก่อภูมิแพ้:</span>
                    {ALLERGENS.map((a) => {
                      const on = r.allergens.includes(a);
                      return (
                        <button
                          type="button"
                          key={a}
                          onClick={() => updateRow(r.key, { allergens: on ? r.allergens.filter((x) => x !== a) : [...r.allergens, a] })}
                          className={`chip text-xs ${on ? "bg-danger-soft text-danger" : ""}`}
                        >
                          {ALLERGEN_LABELS[a].split(" ")[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button type="button" className="btn" onClick={() => setRows((rs) => [...rs, emptyRow()])}>
          + เพิ่มวัตถุดิบ
        </button>
      </div>

      <div className="card">
        <label className="label" htmlFor="steps">วิธีทำ (บรรทัดละขั้นตอน)</label>
        <textarea id="steps" rows={5} className="input py-2" value={steps} onChange={(e) => setSteps(e.target.value)} />
      </div>

      {unsafeFor.length > 0 && (
        <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">
          ⚠️ ไม่เหมาะกับ{" "}
          {unsafeFor.map((k) => `${k.name} (${k.hits.map((h) => ALLERGEN_LABELS[h].split(" ")[0]).join(", ")})`).join(", ")}
          {" "}— บันทึกได้ แต่ระบบจะไม่จัดเมนูนี้ให้คนนั้น
        </p>
      )}
      {error && <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}

      <button className="btn-primary" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "บันทึกเมนู"}
      </button>
    </form>
  );
}
