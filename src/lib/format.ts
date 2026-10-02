import { ageInMonths } from "./domain/age";

export function formatAge(birthDate: string, onDate: string): string {
  const m = ageInMonths(birthDate, onDate);
  if (m < 12) return `${m} เดือน`;
  const y = Math.floor(m / 12);
  const rest = m % 12;
  return rest ? `${y} ปี ${rest} เดือน` : `${y} ปี`;
}
