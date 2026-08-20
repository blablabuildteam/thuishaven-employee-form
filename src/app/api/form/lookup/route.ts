import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const employeeSelect = {
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  bsn: true,
  street: true,
  houseNumber: true,
  postalCode: true,
  city: true,
  phone: true,
  email: true,
  iban: true,
  identityDocument: { select: { id: true } },
} as const;

function employeeResponse(
  employee: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    bsn: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    phone: string;
    email: string;
    iban: string;
    identityDocument: { id: string } | null;
  },
) {
  const { identityDocument, ...profile } = employee;

  return {
    found: true,
    hasIdentityDocument: Boolean(identityDocument),
    employee: {
      ...profile,
      dateOfBirth: profile.dateOfBirth.toISOString().split("T")[0],
    },
  };
}

function notFound() {
  return NextResponse.json({ found: false });
}

export async function GET(request: NextRequest) {
  const bsn = request.nextUrl.searchParams.get("bsn")?.trim() ?? "";
  const firstName = request.nextUrl.searchParams.get("firstName")?.trim() ?? "";
  const lastName = request.nextUrl.searchParams.get("lastName")?.trim() ?? "";

  if (bsn) {
    if (!/^\d{9}$/.test(bsn)) {
      return NextResponse.json(
        { error: "Ongeldig BSN formaat" },
        { status: 400 },
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { bsn },
      select: employeeSelect,
    });

    if (!employee) return notFound();
    return NextResponse.json(employeeResponse(employee));
  }

  if (firstName && lastName) {
    if (firstName.length > 100 || lastName.length > 100) {
      return NextResponse.json(
        { error: "Ongeldige naam" },
        { status: 400 },
      );
    }

    const matches = await prisma.employee.findMany({
      where: {
        firstName: { equals: firstName, mode: "insensitive" },
        lastName: { equals: lastName, mode: "insensitive" },
      },
      take: 2,
      select: employeeSelect,
    });

    // Only prefill when the full name is unique.
    if (matches.length !== 1) return notFound();
    return NextResponse.json(employeeResponse(matches[0]));
  }

  return NextResponse.json(
    { error: "BSN of voor- en achternaam is verplicht" },
    { status: 400 },
  );
}
