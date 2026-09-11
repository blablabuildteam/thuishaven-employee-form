import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { CONTRACT_EXPIRY_WINDOW_DAYS } from "@/lib/contracts/expiry-window";

export async function refreshContractExpiryAlerts() {
  const today = new Date();
  const windowEnd = addDays(today, CONTRACT_EXPIRY_WINDOW_DAYS);

  const contracts = await prisma.contract.findMany({
    where: {
      status: "COUNTERSIGNED",
      endDate: { lte: windowEnd },
    },
    include: {
      employee: { select: { firstName: true, lastName: true } },
    },
  });

  const due = contracts.filter((contract) => contract.endDate >= addDays(today, -1));

  for (const contract of due) {
    const existing = await prisma.alert.findFirst({
      where: {
        contractId: contract.id,
        type: "CONTRACT_EXPIRING",
        acknowledged: false,
      },
    });
    if (existing) continue;

    const expired = contract.endDate < today;
    await prisma.alert.create({
      data: {
        employeeId: contract.employeeId,
        contractId: contract.id,
        type: "CONTRACT_EXPIRING",
        message: expired
          ? `Het contract (v${contract.version}) van ${contract.employee.firstName} ${contract.employee.lastName} is verlopen op ${formatDate(contract.endDate)}.`
          : `Het contract (v${contract.version}) van ${contract.employee.firstName} ${contract.employee.lastName} loopt af op ${formatDate(contract.endDate)}.`,
      },
    });
  }

  return due.length;
}
