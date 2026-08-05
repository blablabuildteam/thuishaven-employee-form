/**
 * IBAN helpers — NL format per https://wise.com/gb/iban/netherlands
 * NL91 ABNA 0417 1643 00 → 18 chars: NL + check(2) + bank(4) + account(10)
 */

const IBAN_LENGTHS: Record<string, number> = {
  NL: 18,
  BE: 16,
  DE: 22,
  FR: 27,
  LU: 20,
  AT: 20,
  ES: 24,
  IT: 27,
  PT: 25,
  IE: 22,
};

export type IbanStatus = "empty" | "incomplete" | "invalid" | "valid";

export interface IbanCheckResult {
  status: IbanStatus;
  normalized: string;
  formatted: string;
  country?: string;
  checkDigits?: string;
  bankCode?: string;
  accountNumber?: string;
  message?: string;
}

export function normalizeIban(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/** Print format in groups of 4: NL91 ABNA 0417 1643 00 */
export function formatIban(value: string): string {
  const cleaned = normalizeIban(value);
  return cleaned.replace(/(.{4})/g, "$1 ").trim();
}

function mod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) =>
    (ch.charCodeAt(0) - 55).toString(),
  );
  let remainder = 0;
  for (const char of numeric) {
    remainder = (remainder * 10 + Number(char)) % 97;
  }
  return remainder;
}

export function isValidIbanChecksum(iban: string): boolean {
  const cleaned = normalizeIban(iban);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) return false;
  if (cleaned.length < 15 || cleaned.length > 34) return false;
  return mod97(cleaned) === 1;
}

export function checkIban(value: string): IbanCheckResult {
  const normalized = normalizeIban(value);
  const formatted = formatIban(normalized);

  if (!normalized) {
    return { status: "empty", normalized, formatted };
  }

  const country = normalized.slice(0, 2);
  const expectedLength = IBAN_LENGTHS[country];

  if (!/^[A-Z]{2}/.test(normalized)) {
    return {
      status: "invalid",
      normalized,
      formatted,
      message: "IBAN moet met een landcode beginnen (bijv. NL)",
    };
  }

  if (normalized.length < 4) {
    return {
      status: "incomplete",
      normalized,
      formatted,
      country,
      message: "Voer de landcode en controlecijfers in",
    };
  }

  if (!/^[A-Z]{2}\d{2}/.test(normalized.slice(0, 4))) {
    return {
      status: "invalid",
      normalized,
      formatted,
      country,
      message: "Controlecijfers moeten 2 cijfers zijn",
    };
  }

  const checkDigits = normalized.slice(2, 4);
  const bankCode =
    country === "NL" && normalized.length >= 8
      ? normalized.slice(4, 8)
      : undefined;
  const accountNumber =
    country === "NL" && normalized.length >= 18
      ? normalized.slice(8, 18)
      : undefined;

  if (expectedLength && normalized.length < expectedLength) {
    return {
      status: "incomplete",
      normalized,
      formatted,
      country,
      checkDigits,
      bankCode,
      accountNumber,
      message:
        country === "NL"
          ? `Nederlands IBAN heeft 18 tekens (${normalized.length}/18)`
          : `IBAN is nog niet compleet (${normalized.length}/${expectedLength})`,
    };
  }

  if (expectedLength && normalized.length > expectedLength) {
    return {
      status: "invalid",
      normalized,
      formatted,
      country,
      checkDigits,
      bankCode,
      accountNumber,
      message:
        country === "NL"
          ? "Nederlands IBAN mag maximaal 18 tekens zijn"
          : `IBAN is te lang voor ${country}`,
    };
  }

  if (country === "NL") {
    if (!/^[A-Z]{4}\d{10}$/.test(normalized.slice(4))) {
      return {
        status: "invalid",
        normalized,
        formatted,
        country,
        checkDigits,
        bankCode,
        accountNumber,
        message: "NL-formaat: 4 letters bankcode + 10 cijfers rekeningnummer",
      };
    }
  }

  if (!isValidIbanChecksum(normalized)) {
    return {
      status: "invalid",
      normalized,
      formatted,
      country,
      checkDigits,
      bankCode,
      accountNumber,
      message: "Ongeldige IBAN-controlecijfers",
    };
  }

  return {
    status: "valid",
    normalized,
    formatted,
    country,
    checkDigits,
    bankCode,
    accountNumber,
    message:
      country === "NL"
        ? `Geldig NL-IBAN · ${bankCode} · ${accountNumber}`
        : "Geldig IBAN",
  };
}

/** Strict validator for zod / server submit */
export function validateIban(value: string): boolean {
  return checkIban(value).status === "valid";
}
