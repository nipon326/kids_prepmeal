"use client";

import { useActionState, useState } from "react";
import { authAction, type AuthState } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, action, pending] = useActionState<AuthState, FormData>(authAction, {});

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <div className="text-5xl">🍱</div>
        <h1 className="h1 mt-2">เมนูลูก</h1>
        <p className="mt-1 text-muted">วางแผนเมนู batch cook รายสัปดาห์</p>
      </div>

      <form action={action} className="card flex flex-col gap-4">
        <input type="hidden" name="mode" value={mode} />
        <div>
          <label className="label" htmlFor="email">อีเมล</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">รหัสผ่าน</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            className="input"
          />
        </div>
        {state.error && <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state.error}</p>}
        {state.message && <p className="rounded-xl bg-accent-soft p-3 text-sm">{state.message}</p>}
        <button className="btn-primary" disabled={pending}>
          {pending ? "กำลังดำเนินการ…" : mode === "signup" ? "สมัครใช้งาน" : "เข้าสู่ระบบ"}
        </button>
      </form>

      <button
        type="button"
        className="text-center text-sm text-muted underline"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup" ? "มีบัญชีแล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครใช้งาน"}
      </button>
    </main>
  );
}
