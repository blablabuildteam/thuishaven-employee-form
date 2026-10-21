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

/**
 * Calendar day of a date-only timestamp. Postgres `timestamp` values are parsed
 * in the process timezone, so local parts match the stored wall-clock date.
 */
export function formatCalendarDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Valid birth date stored as UTC midnight. Must be a real past date, age 18+. */
export function parseBirthDate(iso: string): Date {
  const trimmed = iso.trim();
  if (!trimmed) throw new Error("Geboortedatum is verplicht");
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) throw new Error("Ongeldige geboortedatum");

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = utcDate(year, monthIndex, day);
  if (
    year < 1900 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Ongeldige geboortedatum");
  }

  const today = toUtcDate(new Date());
  if (date > today) {
    throw new Error("Geboortedatum kan niet in de toekomst liggen");
  }

  let age = today.getUTCFullYear() - year;
  if (
    today.getUTCMonth() < monthIndex ||
    (today.getUTCMonth() === monthIndex && today.getUTCDate() < day)
  ) {
    age -= 1;
  }
  if (age < 18) {
    throw new Error("Medewerker moet minimaal 18 jaar oud zijn");
  }

  return date;
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
