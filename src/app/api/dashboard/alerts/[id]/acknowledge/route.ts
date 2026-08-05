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

  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) {
    return NextResponse.json(
      { error: "Melding niet gevonden" },
      { status: 404 },
    );
  }

  if (alert.acknowledged) {
    return NextResponse.json(
      { error: "Melding is al bevestigd" },
      { status: 400 },
    );
  }

  await prisma.alert.update({
    where: { id },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy: session.user?.email || "unknown",
    },
  });

  return NextResponse.json({ success: true });
}
