import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  serializeSubmissionDetail,
  submissionDetailSelect,
} from "@/lib/dashboard/submission-detail";
import {
  calculateHourlyRate,
  calculateTotalHours,
  calculateTotalPay,
} from "@/lib/pay-calculation";
import { getPayRatesForDate } from "@/lib/pay-rates";
import { submissionEditSchema } from "@/lib/validations";

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
    select: submissionDetailSelect,
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Inschrijving niet gevonden" },
      { status: 404 },
    );
  }

  return NextResponse.json(serializeSubmissionDetail(submission));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige data" }, { status: 400 });
  }

  const parsed = submissionEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatie mislukt", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const existing = await prisma.submission.findUnique({
    where: { id },
    select: { id: true, employeeId: true, employee: { select: { bsn: true } } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Inschrijving niet gevonden" },
      { status: 404 },
    );
  }

  if (data.bsn !== existing.employee.bsn) {
    const bsnTaken = await prisma.employee.findUnique({
      where: { bsn: data.bsn },
      select: { id: true },
    });
    if (bsnTaken && bsnTaken.id !== existing.employeeId) {
      return NextResponse.json(
        { error: "Dit BSN hoort al bij een andere medewerker" },
        { status: 409 },
      );
    }
  }

  const eventDate = new Date(data.eventDate);
  const dateOfBirth = new Date(data.dateOfBirth);

  let hourlyRate: number;
  try {
    const rates = await getPayRatesForDate(eventDate);
    hourlyRate = calculateHourlyRate(dateOfBirth, eventDate, rates);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }

  const totalHours = calculateTotalHours(
    data.startTime,
    data.endTime,
    data.breakMinutes,
  );
  const totalPay = calculateTotalPay(hourlyRate, totalHours);
  const editorName = session.user.name?.trim() || session.user.email || "HR";

  await prisma.$transaction([
    prisma.employee.update({
      where: { id: existing.employeeId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth,
        bsn: data.bsn,
        street: data.street,
        houseNumber: data.houseNumber,
        postalCode: data.postalCode,
        city: data.city,
        email: data.email,
        phone: data.phone,
        iban: data.iban,
      },
    }),
    prisma.submission.update({
      where: { id },
      data: {
        eventDate,
        department: data.department,
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: data.breakMinutes,
        hourlyRate,
        totalHours,
        totalPay,
        pdfUrl: null,
        pdfGeneratedAt: null,
        editedAt: new Date(),
        editedBy: editorName,
        editedByEmail: session.user.email,
      },
    }),
  ]);

  const updated = await prisma.submission.findUnique({
    where: { id },
    select: submissionDetailSelect,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Inschrijving niet gevonden" },
      { status: 404 },
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/daily");
  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${existing.employeeId}`);

  return NextResponse.json(serializeSubmissionDetail(updated));
}
