import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) {
    return NextResponse.json(
      { error: "Medewerker niet gevonden" },
      { status: 404 },
    );
  }

  if (!employee.isBlocked) {
    return NextResponse.json(
      { error: "Medewerker is niet geblokkeerd" },
      { status: 400 },
    );
  }

  await prisma.employee.update({
    where: { id },
    data: { isBlocked: false },
  });

  await prisma.alert.create({
    data: {
      employeeId: id,
      type: "CONTRACT_NEEDED",
      message: `${employee.firstName} ${employee.lastName} is gedeblokkeerd door ${session.user?.email}. Arbeidscontract vereist.`,
    },
  });

  return NextResponse.json({ success: true });
}
