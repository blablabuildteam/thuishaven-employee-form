import { brandedEmailHtml } from "@/lib/email/layout";

type EmailAttachment = {
  name: string;
  contentType: string;
  contentBase64: string;
};

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

function senderAddress() {
  return (
    process.env.AUTH_FROM_EMAIL ||
    process.env.BREVO_SENDER_EMAIL ||
    "noreply@thuishaven.nl"
  );
}

export function hrAlertEmails(): string[] {
  return (process.env.HR_ALERT_EMAIL || "")
    .split(/[,;]/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function senderName() {
  return (
    process.env.BREVO_SENDER_NAME ||
    process.env.AUTH_FROM_NAME ||
    "Thuishaven Events"
  );
}

function brevoApiKey() {
  const raw = (
    process.env.BREVO_API_KEY ||
    process.env.BREVO_MCP_TOKEN ||
    ""
  ).trim();
  if (!raw) return "";
  if (raw.startsWith("xkeysib-")) return raw;

  // Cursor/MCP tokens are often base64 of {"api_key":"xkeysib-..."}.
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as { api_key?: unknown };
    if (typeof parsed.api_key === "string" && parsed.api_key.startsWith("xkeysib-")) {
      return parsed.api_key;
    }
  } catch {
    // Fall through and send the raw value; Brevo will reject if invalid.
  }
  return raw;
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<{ sent: boolean; skipped?: string }> {
  const apiKey = brevoApiKey();
  if (!apiKey) {
    console.info("[email] BREVO_API_KEY / BREVO_MCP_TOKEN missing; skipped send.", {
      to: options.to,
      subject: options.subject,
    });
    return { sent: false, skipped: "BREVO_API_KEY ontbreekt" };
  }

  const to = (Array.isArray(options.to) ? options.to : [options.to]).map(
    (email) => ({ email }),
  );

  const body: Record<string, unknown> = {
    sender: { email: senderAddress(), name: senderName() },
    to,
    subject: options.subject,
    htmlContent: options.html,
    textContent: options.text,
  };

  if (options.attachments?.length) {
    body.attachment = options.attachments.map((file) => ({
      name: file.name,
      content: file.contentBase64,
    }));
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`E-mail verzenden mislukt: ${response.status} ${detail}`);
  }

  return { sent: true };
}

export function contractInviteEmail(opts: {
  firstName: string;
  link: string;
}) {
  return {
    subject: "Je arbeidscontract bij Thuishaven",
    html: brandedEmailHtml({
      heading: "Arbeidscontract",
      bodyHtml: `<p>Hoi ${opts.firstName},</p>
<p>Thuishaven heeft een 0-uren oproepovereenkomst voor je klaargezet. Bevestig je identiteit met BSN en geboortedatum, vul de ontbrekende gegevens in en onderteken het contract en het huishoudelijk reglement.</p>`,
      cta: { href: opts.link, label: "Open je contract" },
    }),
    text: `Hoi ${opts.firstName},\n\nThuishaven heeft een 0-uren oproepovereenkomst voor je klaargezet:\n${opts.link}\n\nBevestig je identiteit met BSN en geboortedatum, vul de ontbrekende gegevens in en onderteken beide documenten.\n\nThuishaven Events B.V.`,
  };
}

export function employeeSignedNotifyEmail(opts: {
  fullName: string;
  profileUrl: string;
}) {
  return {
    subject: `${opts.fullName} heeft het contract ondertekend`,
    html: brandedEmailHtml({
      heading: "Handtekening ontvangen",
      bodyHtml: `<p>${opts.fullName} heeft de oproepovereenkomst en het huishoudelijk reglement ondertekend.</p>
<p>Controleer het dossier en onderteken namens Thuishaven.</p>`,
      cta: { href: opts.profileUrl, label: "Open medewerkersprofiel" },
    }),
    text: `${opts.fullName} heeft het contract ondertekend. Onderteken namens Thuishaven: ${opts.profileUrl}`,
  };
}

export function signedCopyEmail(opts: { firstName: string }) {
  return {
    subject: "Je ondertekende arbeidscontract",
    html: brandedEmailHtml({
      heading: "Getekend contract",
      bodyHtml: `<p>Hoi ${opts.firstName},</p>
<p>In de bijlage vind je de door beide partijen ondertekende oproepovereenkomst en het huishoudelijk reglement. Bewaar deze documenten voor je eigen administratie.</p>`,
    }),
    text: `Hoi ${opts.firstName},\n\nIn de bijlage vind je de ondertekende oproepovereenkomst en het huishoudelijk reglement.\n\nThuishaven Events B.V.`,
  };
}
