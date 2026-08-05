import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for PDF download tokens");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Create a time-limited token scoped to one submission. */
export function createSubmissionDownloadToken(
  submissionId: string,
  ttlMs = DEFAULT_TTL_MS,
): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${submissionId}.${expiresAt}`;
  return `${expiresAt}.${sign(payload)}`;
}

export function verifySubmissionDownloadToken(
  submissionId: string,
  token: string,
): boolean {
  try {
    const [expiresAtRaw, signature] = token.split(".");
    if (!expiresAtRaw || !signature) return false;

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

    const payload = `${submissionId}.${expiresAt}`;
    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
