import { prisma } from "@/lib/db";
import { RATE_18_19, RATE_20_PLUS, type PayRates } from "@/lib/pay-calculation";

const DEFAULT_EFFECTIVE_FROM = new Date("2000-01-01T00:00:00.000Z");

export async function ensureDefaultPayRate() {
  const count = await prisma.payRate.count();
  if (count > 0) return;
  await prisma.payRate.create({
    data: {
      effectiveFrom: DEFAULT_EFFECTIVE_FROM,
      under20Rate: RATE_18_19,
      over20Rate: RATE_20_PLUS,
      updatedBy: "system",
    },
  });
}

export async function getPayRatesForDate(date: Date): Promise<PayRates> {
  await ensureDefaultPayRate();
  const row = await prisma.payRate.findFirst({
    where: { effectiveFrom: { lte: date } },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!row) {
    return { under20Rate: RATE_18_19, over20Rate: RATE_20_PLUS };
  }
  return {
    under20Rate: Number(row.under20Rate),
    over20Rate: Number(row.over20Rate),
  };
}

export async function listPayRates() {
  await ensureDefaultPayRate();
  return prisma.payRate.findMany({
    orderBy: { effectiveFrom: "desc" },
  });
}
