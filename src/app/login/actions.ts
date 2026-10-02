"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

export async function authAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const mode = formData.get("mode");
  if (!email || password.length < 8) return { error: "กรอกอีเมล และรหัสผ่านอย่างน้อย 8 ตัว" };

  const supabase = await createClient();
  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.session) return { message: "ส่งอีเมลยืนยันแล้ว กดลิงก์ในอีเมล แล้วกลับมาเข้าสู่ระบบ" };
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }
  redirect("/");
}
