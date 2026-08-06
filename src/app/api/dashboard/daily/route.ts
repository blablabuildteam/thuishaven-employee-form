import { type NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { getDailyDayGroups } from "@/lib/dashboard/daily-submissions";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const endDate =
    searchParams.get("endDate") ?? format(new Date(), "yyyy-MM-dd");
  const daysParam = Number(searchParams.get("days") ?? "7");
  const days =
    Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 31
      ? daysParam
      : 7;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return NextResponse.json({ error: "Ongeldige einddatum" }, { status: 400 });
  }

  const result = await getDailyDayGroups({ endDate, days });
  return NextResponse.json(result);
}
