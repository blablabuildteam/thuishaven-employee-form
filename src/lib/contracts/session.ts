import { format } from "date-fns";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { formatIsoDate } from "@/lib/contracts/dates";
import {
  contractSessionCookie,
  hashInviteToken,
  readContractSessionValue,
} from "@/lib/contracts/token";

export async function findContractByInviteToken(rawToken: string) {
  const tokenHash = hashInviteToken(rawToken);
  return prisma.contract.findUnique({
    where: { inviteTokenHash: tokenHash },
    include: { employee: true },
  });
}

export async function requireVerifiedContract(rawToken: string) {
  const contract = await findContractByInviteToken(rawToken);
  if (!contract) {
    return { ok: false as const, status: 404, error: "Ongeldige of verlopen link." };
  }

  const jar = await cookies();
  const session = readContractSessionValue(
    jar.get(contractSessionCookie.name)?.value,
  );
  if (
    !session ||
    session.contractId !== contract.id ||
    session.tokenHash !== contract.inviteTokenHash
  ) {
    return {
      ok: false as const,
      status: 401,
      error: "Bevestig eerst je identiteit.",
      contract,
    };
  }

  return { ok: true as const, contract };
}

export function sameBirthDate(stored: Date, iso: string): boolean {
  return formatIsoDate(stored) === iso || format(stored, "yyyy-MM-dd") === iso;
}
