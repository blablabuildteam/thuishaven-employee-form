"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteIdentityDocumentBlob } from "@/lib/id-document";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireSession() {
  const session = await auth();
  if (!session) throw new Error("Niet ingelogd");
  return session;
}

function revalidateEmployeePaths(employeeId?: string) {
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/daily");
  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard");
  if (employeeId) {
    revalidatePath(`/dashboard/employees/${employeeId}`);
  }
}

/** Keep block/alert state consistent after the shift count changes. */
async function syncShiftThresholdState(
  employeeId: string,
  remainingShifts: number,
  acknowledgedBy: string,
) {
  if (remainingShifts < 4) {
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
        acknowledgedBy,
      },
    });
  }

  if (remainingShifts < 3) {
    await prisma.alert.updateMany({
      where: {
        employeeId,
        type: "THREE_SHIFTS",
        acknowledged: false,
      },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy,
      },
    });
  }
}

export async function unblockEmployee(employeeId: string) {
  const session = await requireSession();

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

  revalidateEmployeePaths(employeeId);
}

export async function acknowledgeAlert(alertId: string) {
  const session = await requireSession();

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

export async function deleteSubmission(submissionId: string) {
  const session = await requireSession();
  const acknowledgedBy = session.user?.name ?? "HR";

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, employeeId: true },
  });
  if (!submission) throw new Error("Inschrijving niet gevonden");

  await prisma.submission.delete({ where: { id: submissionId } });

  const remainingShifts = await prisma.submission.count({
    where: { employeeId: submission.employeeId },
  });

  await syncShiftThresholdState(
    submission.employeeId,
    remainingShifts,
    acknowledgedBy,
  );

  revalidateEmployeePaths(submission.employeeId);
}

export async function deleteEmployee(employeeId: string) {
  await requireSession();

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      identityDocument: { select: { pathname: true } },
    },
  });
  if (!employee) throw new Error("Medewerker niet gevonden");

  if (employee.identityDocument?.pathname) {
    await deleteIdentityDocumentBlob(employee.identityDocument.pathname);
  }

  await prisma.employee.delete({ where: { id: employeeId } });

  revalidateEmployeePaths();
  redirect("/dashboard/employees");
}
