import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findContractByInviteToken, sameBirthDate } from "@/lib/contracts/session";
import { contractVerifySchema } from "@/lib/contracts/schema";
import {
  contractSessionCookie,
  createContractSessionValue,
} from "@/lib/contracts/token";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const parsed = contractVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" },
      { status: 400 },
    );
  }

  const contract = await findContractByInviteToken(token);
  if (!contract || contract.status !== "INVITED") {
    return NextResponse.json(
      { error: "Deze contractlink is ongeldig of al gebruikt." },
      { status: 404 },
    );
  }

  const { bsn, dateOfBirth } = parsed.data;
  if (
    contract.employee.bsn !== bsn ||
    !sameBirthDate(contract.employee.dateOfBirth, dateOfBirth)
  ) {
    return NextResponse.json(
      { error: "BSN en geboortedatum komen niet overeen." },
      { status: 401 },
    );
  }

  await prisma.contract.update({
    where: { id: contract.id },
    data: { verifiedAt: contract.verifiedAt ?? new Date() },
  });

  const value = createContractSessionValue({
    contractId: contract.id,
    tokenHash: contract.inviteTokenHash,
  });
  const jar = await cookies();
  jar.set(contractSessionCookie.name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: contractSessionCookie.maxAge,
  });

  return NextResponse.json({ ok: true });
}
