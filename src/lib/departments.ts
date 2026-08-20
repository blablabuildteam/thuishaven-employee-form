export const DEPARTMENTS = [
  "Bar",
  "Runner",
  "Keuken",
  "Kassa",
  "Ingang",
  "Toezicht",
  "Terrein",
  "Overig",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export function isDepartment(value: string): value is Department {
  return (DEPARTMENTS as readonly string[]).includes(value);
}

/** Include a stored value that predates the fixed department list. */
export function departmentOptions(current?: string | null): string[] {
  if (current && !isDepartment(current)) {
    return [...DEPARTMENTS, current];
  }
  return [...DEPARTMENTS];
}
