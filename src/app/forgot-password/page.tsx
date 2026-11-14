"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type ForgotState } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(
    forgotPasswordAction,
    {},
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <div className="text-5xl">🔑</div>
        <h1 className="h1 mt-2">ลืมรหัสผ่าน</h1>
        <p className="mt-1 text-muted">ใส่อีเมล เราจะส่งลิงก์รีเซ็ตให้</p>
      </div>

      {state.message ? (
        <div className="card flex flex-col gap-4 text-center">
          <p className="text-2xl">📬</p>
          <p className="text-sm">{state.message}</p>
          <Link href="/login" className="btn-primary text-center">
            กลับหน้าเข้าสู่ระบบ
          </Link>
        </div>
      ) : (
        <form action={action} className="card flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="email">อีเมล</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
            />
          </div>
          {state.error && (
            <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state.error}</p>
          )}
          <button className="btn-primary" disabled={pending}>
            {pending ? "กำลังส่ง…" : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
          </button>
        </form>
      )}

      <Link href="/login" className="text-center text-sm text-muted underline">
        กลับหน้าเข้าสู่ระบบ
      </Link>
    </main>
  );
}
