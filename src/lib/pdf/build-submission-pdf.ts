import { prisma } from "@/lib/db";
import { generateIB47PDF } from "@/lib/pdf/generate-ib47";

export async function buildSubmissionPdf(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { employee: true },
  });

  if (!submission) return null;

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

  const eventDate = submission.eventDate.toISOString().split("T")[0];
  const filename = `IB47_${submission.employee.lastName}_${eventDate}.pdf`;

  return { pdfBuffer, filename, submission };
}
