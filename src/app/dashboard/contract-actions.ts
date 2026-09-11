"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateHourlyRate } from "@/lib/pay-calculation";
import { getPayRatesForDate } from "@/lib/pay-rates";
import {
  defaultContractEndDate,
  defaultContractStartDate,
  parseIsoDate,
} from "@/lib/contracts/dates";
import { CONTRACT_TEMPLATE_VERSION } from "@/lib/contracts/copy";
import { generateInviteToken } from "@/lib/contracts/token";
import { storeFullySignedPdf } from "@/lib/contracts/render";
import { readPrivateBlobBuffer } from "@/lib/contracts/blob";
import {
  contractInviteEmail,
  sendEmail,
  signedCopyEmail,
} from "@/lib/email/send";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Niet ingelogd");
  return session;
}

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
}

export async function previewContractInvite(employeeId: string) {
  await requireSession();
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { _count: { select: { submissions: true } } },
  });
  if (!employee) throw new Error("Medewerker niet gevonden");

  const startDate = defaultContractStartDate();
  const endDate = defaultContractEndDate(startDate);
  const rates = await getPayRatesForDate(startDate);
  const hourlyRate = calculateHourlyRate(
    employee.dateOfBirth,
    startDate,
    rates,
  );

  return {
    canSend: employee._count.submissions >= 1,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    hourlyRate,
    email: employee.email,
  };
}

export async function sendContractInvite(opts: {
  employeeId: string;
  startDate?: string;
  endDate?: string;
}) {
  const session = await requireSession();
  const employee = await prisma.employee.findUnique({
    where: { id: opts.employeeId },
    include: {
      _count: { select: { submissions: true } },
      contracts: { orderBy: { version: "desc" }, take: 1 },
    },
  });
  if (!employee) throw new Error("Medewerker niet gevonden");
  if (employee._count.submissions < 1) {
    throw new Error(
      "Een contract kan pas worden verstuurd na de eerste dienst.",
    );
  }

  const latest = employee.contracts[0];
  if (latest?.status === "EMPLOYEE_SIGNED") {
    throw new Error(
      "Er is al een getekend contract dat nog door Thuishaven moet worden ondertekend.",
    );
  }

  const startDate = opts.startDate
    ? parseIsoDate(opts.startDate)
    : defaultContractStartDate();
  const endDate = opts.endDate
    ? parseIsoDate(opts.endDate)
    : defaultContractEndDate(startDate);
  const rates = await getPayRatesForDate(startDate);
  const hourlyRate = calculateHourlyRate(
    employee.dateOfBirth,
    startDate,
    rates,
  );

  const { raw, hash } = generateInviteToken();
  const invitedBy = session.user.email ?? "HR";

  if (latest?.status === "INVITED") {
    await prisma.contract.update({
      where: { id: latest.id },
      data: {
        startDate,
        endDate,
        hourlyRate,
        inviteTokenHash: hash,
        invitedAt: new Date(),
        invitedBy,
        verifiedAt: null,
      },
    });
  } else {
    const version = (latest?.version ?? 0) + 1;
    await prisma.contract.create({
      data: {
        employeeId: employee.id,
        version,
        templateVersion: CONTRACT_TEMPLATE_VERSION,
        startDate,
        endDate,
        hourlyRate,
        inviteTokenHash: hash,
        invitedBy,
      },
    });
  }

  const link = `${appBaseUrl()}/contract/${raw}`;
  const mail = contractInviteEmail({ firstName: employee.firstName, link });
  const result = await sendEmail({ to: employee.email, ...mail });
  if (!result.sent) {
    console.info("[contract invite]", link);
  }

  revalidatePath(`/dashboard/employees/${employee.id}`);
  revalidatePath("/dashboard/alerts");
  return { resent: latest?.status === "INVITED", skippedEmail: result.skipped };
}

export async function countersignContract(opts: {
  employeeId: string;
  contractId: string;
  signatureData: string;
}) {
  const session = await requireSession();
  if (!opts.signatureData) throw new Error("Handtekening is verplicht");

  const contract = await prisma.contract.findFirst({
    where: { id: opts.contractId, employeeId: opts.employeeId },
    include: { employee: true },
  });
  if (!contract) throw new Error("Contract niet gevonden");
  if (contract.status !== "EMPLOYEE_SIGNED") {
    throw new Error("De medewerker moet eerst ondertekenen.");
  }
  if (!contract.employeeSignatureData) {
    throw new Error("Handtekening van de medewerker ontbreekt.");
  }

  const signedOn = new Date();
  const blob = await storeFullySignedPdf({
    employee: contract.employee,
    contractId: contract.id,
    startDate: contract.startDate,
    endDate: contract.endDate,
    hourlyRate: Number(contract.hourlyRate),
    employeeSignatureData: contract.employeeSignatureData,
    employerSignatureData: opts.signatureData,
    signedOn,
  });

  await prisma.contract.update({
    where: { id: contract.id },
    data: {
      status: "COUNTERSIGNED",
      employerSignatureData: opts.signatureData,
      employerSignedAt: signedOn,
      employerSignedBy: session.user.email ?? "HR",
      fullySignedPdfPathname: blob.pathname,
      fullySignedPdfUrl: blob.url,
    },
  });

  await prisma.alert.updateMany({
    where: {
      contractId: contract.id,
      type: "CONTRACT_SIGNED",
      acknowledged: false,
    },
    data: {
      acknowledged: true,
      acknowledgedAt: signedOn,
      acknowledgedBy: session.user.email ?? "HR",
    },
  });

  revalidatePath(`/dashboard/employees/${opts.employeeId}`);
  revalidatePath("/dashboard/alerts");
}

export async function sendSignedContractCopy(opts: {
  employeeId: string;
  contractId: string;
}) {
  await requireSession();
  const contract = await prisma.contract.findFirst({
    where: { id: opts.contractId, employeeId: opts.employeeId },
    include: { employee: true },
  });
  if (!contract || contract.status !== "COUNTERSIGNED") {
    throw new Error("Er is nog geen volledig ondertekend contract.");
  }
  if (!contract.fullySignedPdfPathname || !contract.reglementPdfPathname) {
    throw new Error("PDF-bestanden ontbreken.");
  }

  const [contractPdf, reglementPdf] = await Promise.all([
    readPrivateBlobBuffer(contract.fullySignedPdfPathname),
    readPrivateBlobBuffer(contract.reglementPdfPathname),
  ]);
  if (!contractPdf || !reglementPdf) {
    throw new Error("PDF-bestanden konden niet worden geladen.");
  }

  const mail = signedCopyEmail({ firstName: contract.employee.firstName });
  await sendEmail({
    to: contract.employee.email,
    ...mail,
    attachments: [
      {
        name: `oproepovereenkomst-${contract.employee.lastName}.pdf`,
        contentType: "application/pdf",
        contentBase64: contractPdf.toString("base64"),
      },
      {
        name: `huishoudelijk-reglement-${contract.employee.lastName}.pdf`,
        contentType: "application/pdf",
        contentBase64: reglementPdf.toString("base64"),
      },
    ],
  });

  await prisma.contract.update({
    where: { id: contract.id },
    data: { signedCopyEmailedAt: new Date() },
  });

  revalidatePath(`/dashboard/employees/${opts.employeeId}`);
}
