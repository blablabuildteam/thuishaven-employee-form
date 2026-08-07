import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formSchema } from "@/lib/validations";
import {
  calculateHourlyRate,
  calculateTotalHours,
  calculateTotalPay,
} from "@/lib/pay-calculation";
import { generateIB47PDF } from "@/lib/pdf/generate-ib47";
import { createSubmissionDownloadToken } from "@/lib/pdf/download-token";
import {
  idDocumentErrorMessage,
  uploadIdentityDocument,
  validateIdDocumentFile,
} from "@/lib/id-document";

async function parseSubmitRequest(request: Request): Promise<{
  data: unknown;
  idDocument: File | null;
}> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payload = formData.get("payload");
    if (typeof payload !== "string") {
      throw new Error("INVALID_PAYLOAD");
    }
    const idDocument = formData.get("idDocument");
    return {
      data: JSON.parse(payload) as unknown,
      idDocument: idDocument instanceof File ? idDocument : null,
    };
  }

  return {
    data: await request.json(),
    idDocument: null,
  };
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    let idDocument: File | null;

    try {
      ({ data: body, idDocument } = await parseSubmitRequest(request));
    } catch {
      return NextResponse.json(
        { error: "Ongeldige formulierdata" },
        { status: 400 },
      );
    }

    const parsed = formSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validatie mislukt", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    if (data.honeypot) {
      return NextResponse.json(
        { error: "Formulier geweigerd" },
        { status: 422 },
      );
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { bsn: data.bsn },
      include: {
        _count: { select: { submissions: true } },
        identityDocument: { select: { id: true } },
      },
    });

    const needsIdDocument =
      !existingEmployee || !existingEmployee.identityDocument;

    if (needsIdDocument) {
      const validation = validateIdDocumentFile(idDocument);
      if (!validation.ok) {
        return NextResponse.json(
          { error: idDocumentErrorMessage(validation.error) },
          { status: 400 },
        );
      }
    }

    const eventDate = new Date(data.eventDate);
    const dateOfBirth = new Date(data.dateOfBirth);

    let hourlyRate: number;
    try {
      hourlyRate = calculateHourlyRate(dateOfBirth, eventDate);
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 400 },
      );
    }

    const totalHours = calculateTotalHours(
      data.startTime,
      data.endTime,
      data.breakMinutes,
    );
    const totalPay = calculateTotalPay(hourlyRate, totalHours);

    let uploadedDoc:
      | Awaited<ReturnType<typeof uploadIdentityDocument>>
      | null = null;

    if (needsIdDocument && idDocument) {
      const validation = validateIdDocumentFile(idDocument);
      if (!validation.ok) {
        return NextResponse.json(
          { error: idDocumentErrorMessage(validation.error) },
          { status: 400 },
        );
      }
      try {
        uploadedDoc = await uploadIdentityDocument({
          file: idDocument,
          contentType: validation.contentType,
          bsn: data.bsn,
        });
      } catch (uploadError) {
        console.error("ID document upload failed:", uploadError);
        return NextResponse.json(
          {
            error:
              "Uploaden van het ID-document is mislukt. Probeer het opnieuw.",
          },
          { status: 500 },
        );
      }
    }

    let employee;
    if (existingEmployee) {
      employee = await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth,
          street: data.street,
          houseNumber: data.houseNumber,
          postalCode: data.postalCode,
          city: data.city,
          phone: data.phone,
          email: data.email,
          iban: data.iban,
          ...(uploadedDoc
            ? {
                identityDocument: {
                  create: {
                    blobUrl: uploadedDoc.blobUrl,
                    pathname: uploadedDoc.pathname,
                    contentType: uploadedDoc.contentType,
                    originalName: uploadedDoc.originalName,
                    sizeBytes: uploadedDoc.sizeBytes,
                  },
                },
              }
            : {}),
        },
      });
    } else {
      employee = await prisma.employee.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth,
          bsn: data.bsn,
          street: data.street,
          houseNumber: data.houseNumber,
          postalCode: data.postalCode,
          city: data.city,
          phone: data.phone,
          email: data.email,
          iban: data.iban,
          ...(uploadedDoc
            ? {
                identityDocument: {
                  create: {
                    blobUrl: uploadedDoc.blobUrl,
                    pathname: uploadedDoc.pathname,
                    contentType: uploadedDoc.contentType,
                    originalName: uploadedDoc.originalName,
                    sizeBytes: uploadedDoc.sizeBytes,
                  },
                },
              }
            : {}),
        },
      });
    }

    const submission = await prisma.submission.create({
      data: {
        employeeId: employee.id,
        eventDate,
        department: data.department,
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: data.breakMinutes,
        hourlyRate,
        totalHours,
        totalPay,
        signatureData: data.signatureData,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    });

    const shiftCount = existingEmployee
      ? existingEmployee._count.submissions + 1
      : 1;

    // Soft alerts only — employees can keep submitting; HR retains flexibility.
    if (shiftCount === 3) {
      await prisma.alert.create({
        data: {
          employeeId: employee.id,
          type: "THREE_SHIFTS",
          message: `${employee.firstName} ${employee.lastName} heeft 3 diensten gewerkt. Een arbeidscontract is waarschijnlijk nodig.`,
        },
      });
    } else if (shiftCount === 4) {
      await prisma.alert.create({
        data: {
          employeeId: employee.id,
          type: "FOUR_SHIFTS",
          message: `${employee.firstName} ${employee.lastName} heeft 4 diensten gewerkt. Contractactie vereist.`,
        },
      });
    }

    // Warm PDF generation so first download is faster; ignore failures here.
    try {
      await generateIB47PDF({
        employee: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          dateOfBirth: employee.dateOfBirth.toISOString(),
          bsn: data.bsn,
          street: employee.street,
          houseNumber: employee.houseNumber,
          postalCode: employee.postalCode,
          city: employee.city,
          phone: employee.phone,
          email: employee.email,
          iban: data.iban,
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
    } catch (pdfError) {
      console.error("PDF warm generation failed:", pdfError);
    }

    const downloadToken = createSubmissionDownloadToken(submission.id);

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      downloadToken,
    });
  } catch (error) {
    console.error("Form submission error:", error);
    return NextResponse.json(
      { error: "Er is een onverwachte fout opgetreden. Probeer het opnieuw." },
      { status: 500 },
    );
  }
}
