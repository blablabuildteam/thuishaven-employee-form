import { differenceInYears } from "date-fns";

/** DAGCONTRACT 2025 rates */
export const RATE_18_19 = 13.5;
export const RATE_20_PLUS = 15;

export function calculateHourlyRate(
  dateOfBirth: Date,
  eventDate: Date,
): number {
  const age = differenceInYears(eventDate, dateOfBirth);
  if (age < 18) throw new Error("Medewerker moet minimaal 18 jaar oud zijn");
  if (age >= 20) return RATE_20_PLUS;
  return RATE_18_19;
}

export function calculateTotalHours(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): number {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Handle overnight shifts (e.g. 22:00 → 06:00)
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const workedMinutes = endMinutes - startMinutes - breakMinutes;
  return Math.max(0, Math.round((workedMinutes / 60) * 100) / 100);
}

export function calculateTotalPay(
  hourlyRate: number,
  totalHours: number,
): number {
  return Math.round(hourlyRate * totalHours * 100) / 100;
}

export function getAgeCategory(
  dateOfBirth: Date,
  eventDate: Date,
): "18/19" | "20+" {
  const age = differenceInYears(eventDate, dateOfBirth);
  return age >= 20 ? "20+" : "18/19";
}
