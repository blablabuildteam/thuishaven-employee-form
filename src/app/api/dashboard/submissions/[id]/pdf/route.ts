import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateIB47PDF } from "@/lib/pdf/generate-ib47";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { employee: true },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Inzending niet gevonden" },
      { status: 404 },
    );
  }

  if (submission.pdfUrl) {
    return NextResponse.redirect(submission.pdfUrl);
  }

  const pdfBuffer = await generateIB47PDF({
    employee: {
      firstName: submission.employee.firstName,
      lastName: submission.employee.lastName,
      dateOfBirth: submission.employee.dateOfBirth.toISOString(),
      bsn: submission.employee.bsn,
      street: submission.employee.street,
      houseNumber: submission.employee.houseNumber,
      postalCode: submission.employee.postalCode,
      city: submission.employee.city,
      phone: submission.employee.phone,
      email: submission.employee.email,
      iban: submission.employee.iban,
    },
    submission: {
      eventDate: submission.eventDate.toISOString(),
      department: submission.department,
      startTime: submission.startTime,
      endTime: submission.endTime,
      breakMinutes: submission.breakMinutes,
      hourlyRate: Number(submission.hourlyRate),
      totalHours: Number(submission.totalHours),
      totalPay: Number(submission.totalPay),
      signatureData: submission.signatureData,
      createdAt: submission.createdAt.toISOString(),
    },
  });

  const filename = `IB47_${submission.employee.lastName}_${submission.eventDate.toISOString().split("T")[0]}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
