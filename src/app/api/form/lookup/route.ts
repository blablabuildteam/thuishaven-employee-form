import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const bsn = request.nextUrl.searchParams.get("bsn");

  if (!bsn || !/^\d{9}$/.test(bsn)) {
    return NextResponse.json(
      { error: "Ongeldig BSN formaat" },
      { status: 400 },
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { bsn },
    select: {
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      street: true,
      houseNumber: true,
      postalCode: true,
      city: true,
      phone: true,
      email: true,
      iban: true,
    },
  });

  if (!employee) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    employee: {
      ...employee,
      dateOfBirth: employee.dateOfBirth.toISOString().split("T")[0],
    },
  });
}
