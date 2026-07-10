export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

export function compareText(a: string | null | undefined, b: string | null | undefined): number {
  return (a || '').localeCompare(b || '');
}

export function compareNumber(a: number | null | undefined, b: number | null | undefined): number {
  return Number(a || 0) - Number(b || 0);
}
