type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
};

export async function sendEmail({ to, subject, html, fromName, fromEmail }: SendEmailInput) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const sender = fromEmail || process.env.MAILGUN_FROM || `noreply@${domain || "localhost"}`;

  if (!apiKey || !domain) {
    return {
      ok: true,
      mocked: true,
      providerMessageId: `mock-email-${Date.now()}`,
    };
  }

  const auth = Buffer.from(`api:${apiKey}`).toString("base64");
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: new URLSearchParams({
      from: `${fromName || "Agency"} <${sender}>`,
      to,
      subject,
      html,
    }),
  });

  const data = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) {
    return { ok: false, mocked: false, error: data.message || "Mailgun send failed" };
  }
  return { ok: true, mocked: false, providerMessageId: data.id };
}
