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
    include: { _count: { select: { submissions: true } } },
  });

  if (!employee) {
    return NextResponse.json({
      exists: false,
      blocked: false,
      shiftCount: 0,
    });
  }

  return NextResponse.json({
    exists: true,
    blocked: employee.isBlocked,
    shiftCount: employee._count.submissions,
  });
}
