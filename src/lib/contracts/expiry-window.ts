import { addDays } from "date-fns";

export const CONTRACT_EXPIRY_WINDOW_DAYS = 30;

export function isContractExpiringSoon(endDate: Date, now = new Date()) {
  const windowEnd = addDays(now, CONTRACT_EXPIRY_WINDOW_DAYS);
  return endDate <= windowEnd;
}
