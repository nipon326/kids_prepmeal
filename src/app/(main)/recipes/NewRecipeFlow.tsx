"use client";

import { useState, useTransition } from "react";
import { generateRecipeAction, type RecipeDraft } from "@/app/actions";
import type { MealRole, ProteinGroup } from "@/lib/domain/types";
import { PROTEIN_LABELS, ROLE_LABELS } from "@/lib/labels";
import { RecipeForm } from "./RecipeForm";

type FormProps = Parameters<typeof RecipeForm>[0];

const ROLES = Object.keys(ROLE_LABELS) as MealRole[];
const PROTEINS = Object.keys(PROTEIN_LABELS) as ProteinGroup[];

// Lets the user ask AI for a draft, then review and edit it in the normal form before saving.
export function NewRecipeFlow(props: FormProps) {
  const [role, setRole] = useState<MealRole>(props.defaults.role ?? "main");
  const [protein, setProtein] = useState<ProteinGroup | "">(props.defaults.protein ?? "");
  const [hint, setHint] = useState("");
  const [draft, setDraft] = useState<{ n: number; value: RecipeDraft }>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function generate() {
    setError(undefined);
    startTransition(async () => {
      const res = await generateRecipeAction(role, role === "main" ? protein : "", hint);
      if ("error" in res) setError(res.error);
      else setDraft((d) => ({ n: (d?.n ?? 0) + 1, value: res.draft }));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {!props.initial && (
        <details className="card" open={!!draft || undefined}>
          <summary className="cursor-pointer font-bold">✨ ให้ AI ช่วยคิดสูตร</summary>
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm text-muted">
              AI เห็นเฉพาะวัตถุดิบที่ปลอดภัยสำหรับลูกทุกคน ไม่เห็นชื่อหรือข้อมูลของลูก และแอปตรวจสารก่อภูมิแพ้ซ้ำอีกรอบก่อนแสดงผล ตรวจสูตรและปริมาณก่อนบันทึกทุกครั้ง
            </p>
            <label className="label" htmlFor="ai-role">ประเภท</label>
            <select id="ai-role" className="input" value={role} onChange={(e) => setRole(e.target.value as MealRole)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            {role === "main" && (
              <>
                <label className="label" htmlFor="ai-protein">โปรตีนหลัก</label>
                <select id="ai-protein" className="input" value={protein} onChange={(e) => setProtein(e.target.value as ProteinGroup | "")}>
                  <option value="">เลือกโปรตีน</option>
                  {PROTEINS.map((p) => (
                    <option key={p} value={p}>{PROTEIN_LABELS[p]}</option>
                  ))}
                </select>
              </>
            )}
            <label className="label" htmlFor="ai-hint">อยากได้แบบไหน (ไม่บังคับ)</label>
            <input
              id="ai-hint"
              className="input"
              maxLength={200}
              placeholder="เช่น ใช้ของที่มีในตู้เย็น, รสไม่จัด, ทำง่าย"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
            />
            <button type="button" className="btn-primary" disabled={pending || (role === "main" && !protein)} onClick={generate}>
              {pending ? "กำลังคิด..." : draft ? "คิดใหม่" : "คิดสูตรให้"}
            </button>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        </details>
      )}
      <RecipeForm
        key={draft?.n ?? 0}
        {...props}
        initial={draft?.value ?? props.initial}
        fromAi={!!draft}
        defaults={draft ? { role: draft.value.role, protein: draft.value.proteinGroup } : props.defaults}
      />
    </div>
  );
}
