"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/", icon: "📅", label: "สัปดาห์นี้" },
  { href: "/shopping", icon: "🛒", label: "ซื้อของ" },
  { href: "/prep", icon: "🔪", label: "วันเตรียม" },
  { href: "/recipes", icon: "📖", label: "เมนู" },
  { href: "/kids", icon: "👶", label: "ลูก" },
];

export function BottomNav() {
  const pathname = usePathname();
  const week = useSearchParams().get("week");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          const keepsWeek = ["/", "/shopping", "/prep"].includes(t.href);
          const href = week && keepsWeek ? `${t.href}?week=${week}` : t.href;
          return (
            <li key={t.href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs ${active ? "font-bold text-accent" : "text-muted"}`}
              >
                <span className="text-xl" aria-hidden>{t.icon}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
