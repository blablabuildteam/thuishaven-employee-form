const CREAM = "#F2F1E6";
const INK = "#000000";

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_URL || "https://form.thuishaven.nl").replace(
    /\/$/,
    "",
  );
}

export function brandedEmailHtml(opts: {
  heading: string;
  bodyHtml: string;
  cta?: { href: string; label: string };
}) {
  const logo = `${appBaseUrl()}/thuishaven-logo.png`;
  const cta = opts.cta
    ? `<p style="margin:28px 0 8px;">
        <a href="${opts.cta.href}"
           style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;padding:14px 28px;font-size:14px;">
          ${opts.cta.label}
        </a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="nl">
<body style="margin:0;padding:0;background:${CREAM};color:${INK};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${INK};">
          <tr>
            <td style="padding:32px 32px 12px;text-align:center;">
              <img src="${logo}" alt="THUISHAVEN" width="220" style="width:220px;max-width:80%;height:auto;" />
              <div style="margin:18px auto 0;width:64px;height:1px;background:${INK};"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 36px;font-size:16px;line-height:1.55;">
              <h1 style="font-size:22px;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 16px;">${opts.heading}</h1>
              ${opts.bodyHtml}
              ${cta}
              <p style="margin:28px 0 0;font-size:13px;color:#444;">Thuishaven Events B.V.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
