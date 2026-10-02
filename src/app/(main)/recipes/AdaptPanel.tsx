"use client";

import { useState, useTransition } from "react";
import { adaptRecipeAction, type RecipeDraft } from "@/app/actions";
import { ALLERGEN_LABELS } from "@/lib/domain/allergens";
import type { AdaptedDraft } from "@/lib/domain/generate";
import { CATEGORY_OPTIONS, UNIT_LABELS } from "@/lib/labels";

const MAX_EDGE = 1280;

async function shrinkImage(file: File): Promise<{ base64: string; preview: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const preview = canvas.toDataURL("image/jpeg", 0.8);
  return { base64: preview.split(",")[1], preview };
}

type Props = { onUse: (draft: RecipeDraft, notes: string[]) => void };

// Paste a recipe or add a photo, let AI adapt it for the kids, then choose which new ingredients to add.
export function AdaptPanel({ onUse }: Props) {
  const [role, setRole] = useState<"main" | "breakfast">("main");
  const [text, setText] = useState("");
  const [image, setImage] = useState<{ base64: string; preview: string }>();
  const [result, setResult] = useState<AdaptedDraft>();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  async function onFile(file: File | undefined) {
    setError(undefined);
    if (!file) return setImage(undefined);
    try {
      setImage(await shrinkImage(file));
    } catch {
      setImage(undefined);
      setError("เปิดรูปนี้ไม่ได้ ลองรูปแบบ JPEG หรือ PNG");
    }
  }

  function adapt() {
    setError(undefined);
    setResult(undefined);
    startTransition(async () => {
      const res = await adaptRecipeAction(role, text, image ? "image/jpeg" : "", image?.base64 ?? "");
      if ("error" in res) return setError(res.error);
      setPicked(new Set());
      setResult(res.draft);
    });
  }

  function use() {
    if (!result) return;
    const kept = result.rows.filter((r) => !r.isNew || picked.has(r.name));
    if (kept.length === 0) return setError("ต้องเหลือวัตถุดิบอย่างน้อย 1 อย่าง");
    const notes = [...result.changes];
    for (const r of result.rows.filter((x) => x.isNew)) {
      if (!picked.has(r.name)) notes.push(`ไม่ได้เลือก “${r.name}” — เพิ่มเองในฟอร์มได้ถ้าต้องการ`);
      else if (r.needsLabelCheck) notes.push(`“${r.name}” อ่านฉลากตอนซื้อ ว่าไม่มีสารก่อภูมิแพ้ของลูก (เช่น แป้งสาลีที่แฝงมา)`);
    }
    onUse(
      {
        title: result.title,
        role: result.role,
        minAgeMonths: result.minAgeMonths,
        proteinGroup: result.proteinGroup,
        cookMethod: result.cookMethod,
        instructions: result.instructions,
        ingredients: kept.map((r) =>
          r.isNew
            ? { name: r.name, amount: r.amount, category: r.category, foodGroup: r.foodGroup, unit: r.unit, allergens: r.allergens }
            : { name: r.name, amount: r.amount },
        ),
      },
      notes,
    );
  }

  const newRows = result?.rows.filter((r) => r.isNew) ?? [];

  return (
    <details className="card">
      <summary className="cursor-pointer font-bold">📷 ถอดสูตรจากรูป/ข้อความ</summary>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-sm text-muted">
          วางสูตรที่เจอ หรือเลือกรูปจานอาหาร/สูตร AI จะปรับเป็นเวอร์ชันของเด็กและบอกว่าเปลี่ยนอะไรบ้าง ไม่ควรส่งรูปที่มีหน้าคนหรือรูปลูก รูปจะถูกส่งไปที่ Anthropic เพื่ออ่านเท่านั้น
        </p>
        <label className="label" htmlFor="ad-role">ประเภท</label>
        <select id="ad-role" className="input" value={role} onChange={(e) => setRole(e.target.value as "main" | "breakfast")}>
          <option value="main">มื้อหลัก เที่ยง/เย็น (กับข้าวหรืออาหารจานเดียว)</option>
          <option value="breakfast">มื้อเช้า</option>
        </select>
        <label className="label" htmlFor="ad-text">วางสูตร (ไม่บังคับถ้ามีรูป)</label>
        <textarea id="ad-text" rows={5} className="input py-2" maxLength={6000} value={text} onChange={(e) => setText(e.target.value)} placeholder="วางวัตถุดิบและวิธีทำที่ก๊อปมา" />
        <label className="label" htmlFor="ad-file">หรือเลือกรูป</label>
        <input id="ad-file" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.preview} alt="รูปที่เลือก" className="max-h-48 rounded-xl object-contain" />
        )}
        <button type="button" className="btn-primary" disabled={pending || (!text.trim() && !image)} onClick={adapt}>
          {pending ? "กำลังปรับสูตร (ประมาณครึ่งนาที)..." : "ปรับให้ลูกกินได้"}
        </button>
        {error && <p className="text-sm text-danger">{error}</p>}

        {result && (
          <div className="flex flex-col gap-3 rounded-xl bg-surface-2 p-3">
            <p className="font-bold">{result.title}</p>
            {result.changes.length > 0 && (
              <div>
                <p className="text-sm font-medium">AI เปลี่ยนจากต้นฉบับ</p>
                <ul className="list-disc pl-5 text-sm text-muted">
                  {result.changes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            {newRows.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">วัตถุดิบที่ยังไม่มีในระบบ — เลือกที่จะเพิ่ม</p>
                <p className="text-xs text-muted">ถ้าไม่ติ๊ก จะไม่ใส่ในสูตร ผมไม่ได้เลือกให้</p>
                {newRows.map((r) => (
                  <label key={r.name} className="flex items-start gap-3 rounded-lg bg-surface p-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={picked.has(r.name)}
                      onChange={(e) =>
                        setPicked((p) => {
                          const next = new Set(p);
                          if (e.target.checked) next.add(r.name);
                          else next.delete(r.name);
                          return next;
                        })
                      }
                    />
                    <span className="text-sm">
                      <span className="font-medium">{r.name}</span> · {r.amount} {UNIT_LABELS[r.unit]}
                      {r.category && <span className="text-muted"> · {CATEGORY_OPTIONS[r.category]}</span>}
                      {r.needsLabelCheck && <span className="block text-warn">เครื่องปรุง/ของสำเร็จรูป: ต้องอ่านฉลากเอง</span>}
                      {r.allergens.length > 0 && (
                        <span className="block text-danger">พบคำของสารก่อภูมิแพ้: {r.allergens.map((a) => ALLERGEN_LABELS[a].split(" ")[0]).join(", ")}</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">วัตถุดิบทั้งหมดมีในระบบอยู่แล้ว</p>
            )}
            <button type="button" className="btn-primary" onClick={use}>ใช้สูตรนี้ (ตรวจในฟอร์มต่อ)</button>
          </div>
        )}
      </div>
    </details>
  );
}
