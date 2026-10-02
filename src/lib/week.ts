const DAY_MS = 86_400_000;

export function bangkokToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
}

function weekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// Batch cooking happens on the weekend, so from Saturday on we're planning next week.
export function defaultWeekStart(today: string): string {
  const dow = weekday(today);
  if (dow === 6) return addDays(today, 2);
  if (dow === 0) return addDays(today, 1);
  return addDays(today, 1 - dow);
}

export function isWeekStart(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && weekday(value) === 1;
}

const fmt = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: "UTC" });

export function formatWeek(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(start.getTime() + 6 * DAY_MS);
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}
