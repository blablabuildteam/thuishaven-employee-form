import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireVerifiedContract } from "@/lib/contracts/session";
import { contractCompleteSchema } from "@/lib/contracts/schema";
import { formatIban } from "@/lib/iban";
import { storeEmployeeSignedPdfs } from "@/lib/contracts/render";
import {
  employeeSignedNotifyEmail,
  hrAlertEmails,
  sendEmail,
} from "@/lib/email/send";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const result = await requireVerifiedContract(token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { contract } = result;
    if (contract.status !== "INVITED") {
      return NextResponse.json(
        { error: "Dit contract is al ondertekend." },
        { status: 409 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = contractCompleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const signedOn = new Date();

    const employee = await prisma.employee.update({
      where: { id: contract.employeeId },
      data: {
        street: data.street,
        houseNumber: data.houseNumber,
        postalCode: data.postalCode,
        city: data.city,
        phone: data.phone,
        email: data.email,
        iban: formatIban(data.iban),
        initials: data.initials.trim(),
        namePrefix: data.namePrefix.trim() || null,
        placeOfBirth: data.placeOfBirth.trim(),
        gender: data.gender,
        nationality: data.nationality.trim(),
        maritalStatus: data.maritalStatus,
        applyPayrollTaxCredit: data.applyPayrollTaxCredit,
        receivesBenefits: data.receivesBenefits,
      },
    });

    const blobs = await storeEmployeeSignedPdfs({
      employee,
      contractId: contract.id,
      startDate: contract.startDate,
      endDate: contract.endDate,
      hourlyRate: Number(contract.hourlyRate),
      jobTitle: contract.jobTitle,
      employeeSignatureData: data.contractSignatureData,
      reglementSignatureData: data.reglementSignatureData,
      signedOn,
    });

    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: "EMPLOYEE_SIGNED",
        employeeSignatureData: data.contractSignatureData,
        reglementSignatureData: data.reglementSignatureData,
        employeeSignedAt: signedOn,
        contractPdfPathname: blobs.contractBlob.pathname,
        contractPdfUrl: blobs.contractBlob.url,
        reglementPdfPathname: blobs.reglementBlob.pathname,
        reglementPdfUrl: blobs.reglementBlob.url,
      },
    });

    await prisma.alert.create({
      data: {
        employeeId: employee.id,
        contractId: contract.id,
        type: "CONTRACT_SIGNED",
        message: `${employee.firstName} ${employee.lastName} heeft het contract ondertekend. Handtekening van Thuishaven is nog nodig.`,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const notify = employeeSignedNotifyEmail({
      fullName: `${employee.firstName} ${employee.lastName}`,
      profileUrl: `${baseUrl}/dashboard/employees/${employee.id}`,
    });
    const hrEmails = hrAlertEmails();
    if (hrEmails.length > 0) {
      try {
        await sendEmail({ to: hrEmails, ...notify });
      } catch (error) {
        console.error("HR contract notify failed:", error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contract complete failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Het ondertekenen is mislukt. Probeer het opnieuw.",
      },
      { status: 500 },
    );
  }
}
