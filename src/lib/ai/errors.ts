import Anthropic from "@anthropic-ai/sdk";

export function describeAiError(e: unknown): string {
  if (e instanceof Anthropic.APIError) {
    if (e.status === 401) return "ANTHROPIC_API_KEY ไม่ถูกต้อง";
    if (e.status === 429) return "ใช้ AI ถี่เกินไป รอสักครู่แล้วลองใหม่";
    if (e.status === 400 && /credit balance/i.test(e.message)) return "เครดิต AI หมด เติมที่ console.anthropic.com → Plans & Billing";
    return "เรียก AI ไม่สำเร็จ ลองใหม่อีกครั้ง";
  }
  return e instanceof Error ? e.message : "เรียก AI ไม่สำเร็จ ลองใหม่อีกครั้ง";
}
