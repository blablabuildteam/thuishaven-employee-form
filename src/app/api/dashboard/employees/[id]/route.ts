import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      submissions: { orderBy: { eventDate: "desc" } },
      alerts: { orderBy: { createdAt: "desc" } },
      _count: { select: { submissions: true } },
    },
  });

  if (!employee) {
    return NextResponse.json(
      { error: "Medewerker niet gevonden" },
      { status: 404 },
    );
  }

  return NextResponse.json({ employee });
}
