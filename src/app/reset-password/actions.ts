"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ResetState = { error?: string };

export async function exchangeCodeAction(code: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return { error: "ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่" };
  return {};
}

export async function updatePasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัว" };
  if (password !== confirm) return { error: "รหัสผ่านไม่ตรงกัน" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/");
}
