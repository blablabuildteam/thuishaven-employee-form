/** UTC calendar date at midnight. */
export function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

export function toUtcDate(date: Date): Date {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function parseIsoDate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) throw new Error("Ongeldige datum");
  return utcDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** First day of the month after `from` (local calendar). */
export function defaultContractStartDate(from = new Date()): Date {
  const month = from.getMonth() + 1;
  const year = from.getFullYear() + Math.floor(month / 12);
  const monthIndex = month % 12;
  return utcDate(year, monthIndex, 1);
}

/** Last day of the month 12 months after start (e.g. 01-09-2026 → 31-08-2027). */
export function defaultContractEndDate(startDate: Date): Date {
  const start = toUtcDate(startDate);
  return utcDate(start.getUTCFullYear() + 1, start.getUTCMonth(), 0);
}
