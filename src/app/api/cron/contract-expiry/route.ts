import { NextResponse } from "next/server";
import { refreshContractExpiryAlerts } from "@/lib/contracts/expiry";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (secret) {
    if (authHeader !== `Bearer ${secret}` && !isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (!isVercelCron && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await refreshContractExpiryAlerts();
  return NextResponse.json({ ok: true, flagged: count });
}
