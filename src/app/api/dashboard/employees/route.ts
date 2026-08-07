import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const employees = await prisma.employee.findMany({
    where,
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
  });

  const filtered =
    status === "contract"
      ? employees.filter((e) => e._count.submissions >= 3)
      : status === "under3"
        ? employees.filter((e) => e._count.submissions < 3)
        : employees;

  return NextResponse.json({ employees: filtered });
}
