import { format } from "date-fns";
import { nl } from "date-fns/locale";

export function formatCurrency(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `€${value.toFixed(2).replace(".", ",")}`;
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd-MM-yyyy");
}

export function formatDateLong(date: Date | string): string {
  return format(new Date(date), "EEEE d MMMM yyyy", { locale: nl });
}

export function maskBSN(bsn: string): string {
  if (bsn.length < 3) return "***";
  return `***-***-${bsn.slice(-3)}`;
}
