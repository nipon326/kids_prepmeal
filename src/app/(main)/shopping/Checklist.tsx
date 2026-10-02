"use client";

import { useEffect, useState } from "react";

type Group = { key: string; title: string; items: { id: string; name: string; detail: string }[] };

function read(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

export function Checklist({ storageKey, groups }: { storageKey: string; groups: Group[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setChecked(new Set(read(storageKey)));
  }, [storageKey]);

  function toggle(id: string) {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch {}
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <p className="text-sm text-muted">
        ได้แล้ว {checked.size}/{total} รายการ
      </p>
      {groups.map((g) => (
        <section key={g.key} className="card">
          <h2 className="mb-2 font-bold">{g.title}</h2>
          <ul className="flex flex-col">
            {g.items.map((item) => {
              const done = checked.has(item.id);
              return (
                <li key={item.id}>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-line py-2 last:border-0">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggle(item.id)}
                      className="size-5 accent-[var(--accent)]"
                    />
                    <span className={`flex-1 ${done ? "text-muted line-through" : ""}`}>{item.name}</span>
                    {item.detail && <span className="text-right text-sm text-muted">{item.detail}</span>}
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
