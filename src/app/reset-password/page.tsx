"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { exchangeCodeAction, updatePasswordAction, type ResetState } from "./actions";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [ready, setReady] = useState(false);
  const [codeError, setCodeError] = useState<string>();
  const [state, action, pending] = useActionState<ResetState, FormData>(updatePasswordAction, {});

  useEffect(() => {
    if (!code) {
      setCodeError("ไม่พบ code ในลิงก์ กรุณาขอลิงก์รีเซ็ตใหม่");
      return;
    }
    exchangeCodeAction(code).then((res) => {
      if (res.error) setCodeError(res.error);
      else setReady(true);
    });
  }, [code]);

  if (codeError) {
    return (
      <div className="card flex flex-col gap-4 text-center">
        <p className="text-2xl">⚠️</p>
        <p className="text-sm text-danger">{codeError}</p>
        <Link href="/forgot-password" className="btn-primary text-center">
          ขอลิงก์รีเซ็ตใหม่
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="card text-center text-muted text-sm py-8">กำลังตรวจสอบลิงก์…</div>
    );
  }

  return (
    <form action={action} className="card flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="password">รหัสผ่านใหม่</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="confirm">ยืนยันรหัสผ่านใหม่</label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
          className="input"
        />
      </div>
      {state.error && (
        <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state.error}</p>
      )}
      <button className="btn-primary" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "ตั้งรหัสผ่านใหม่"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <div className="text-5xl">🔐</div>
        <h1 className="h1 mt-2">ตั้งรหัสผ่านใหม่</h1>
        <p className="mt-1 text-muted">รหัสผ่านต้องมีอย่างน้อย 8 ตัว</p>
      </div>
      <Suspense fallback={<div className="card text-center text-muted text-sm py-8">กำลังโหลด…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
