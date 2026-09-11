import { NextResponse } from "next/server";
import { parseIsoDate } from "@/lib/contracts/dates";
import { getPayRatesForDate } from "@/lib/pay-rates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  let date = new Date();
  if (dateParam) {
    try {
      date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
        ? parseIsoDate(dateParam)
        : new Date(dateParam);
    } catch {
      return NextResponse.json({ error: "Ongeldige datum" }, { status: 400 });
    }
  }

  const rates = await getPayRatesForDate(date);
  return NextResponse.json(rates);
}
