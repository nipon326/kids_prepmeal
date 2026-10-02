import { ageInMonths } from "./domain/age";

export function formatAge(birthDate: string, onDate: string): string {
  const m = ageInMonths(birthDate, onDate);
  if (m < 12) return `${m} เดือน`;
  const y = Math.floor(m / 12);
  const rest = m % 12;
  return rest ? `${y} ปี ${rest} เดือน` : `${y} ปี`;
}

// Steps are shown in an <ol>, so a hand-typed "1. " prefix would render as "1. 1.".
// Requires whitespace after the dot so "1.5 ถ้วย" and "180°C" are left alone.
export function stripStepNumber(step: string): string {
  return step.replace(/^\s*\d{1,2}\s*[.)]\s+/, "");
}
