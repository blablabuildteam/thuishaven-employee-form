import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "crypto";

const COOKIE_NAME = "contract_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

export function generateInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashInviteToken(raw) };
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function signingKey(): string {
  return process.env.AUTH_SECRET || process.env.ENCRYPTION_KEY || "dev-secret";
}

export function createContractSessionValue(opts: {
  contractId: string;
  tokenHash: string;
}): string {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SECONDS;
  const payload = `${opts.contractId}.${opts.tokenHash}.${exp}`;
  const sig = createHmac("sha256", signingKey()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function readContractSessionValue(
  value: string | undefined,
): { contractId: string; tokenHash: string } | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [contractId, tokenHash, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!contractId || !tokenHash || !sig || !Number.isFinite(exp)) return null;
  if (exp < Math.floor(Date.now() / 1000)) return null;

  const payload = `${contractId}.${tokenHash}.${expStr}`;
  const expected = createHmac("sha256", signingKey())
    .update(payload)
    .digest("hex");
  try {
    if (
      !timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))
    ) {
      return null;
    }
  } catch {
    return null;
  }
  return { contractId, tokenHash };
}

export const contractSessionCookie = {
  name: COOKIE_NAME,
  maxAge: COOKIE_MAX_AGE_SECONDS,
};
