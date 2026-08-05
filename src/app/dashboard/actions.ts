"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function unblockEmployee(employeeId: string) {
  const session = await auth();
  if (!session) throw new Error("Niet ingelogd");

  await prisma.employee.update({
    where: { id: employeeId },
    data: { isBlocked: false },
  });

  await prisma.alert.updateMany({
    where: {
      employeeId,
      type: "FOUR_SHIFTS",
      acknowledged: false,
    },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy: session.user?.name ?? "HR",
    },
  });

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${employeeId}`);
  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard");
}

export async function acknowledgeAlert(alertId: string) {
  const session = await auth();
  if (!session) throw new Error("Niet ingelogd");

  await prisma.alert.update({
    where: { id: alertId },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy: session.user?.name ?? "HR",
    },
  });

  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard");
}
