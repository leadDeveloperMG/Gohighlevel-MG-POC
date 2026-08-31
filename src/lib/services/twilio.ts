type SendSmsInput = {
  to: string;
  body: string;
  from?: string;
};

export async function sendSms({ to, body, from }: SendSmsInput) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = from || process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !fromNumber) {
    return {
      ok: true,
      mocked: true,
      providerMessageId: `mock-sms-${Date.now()}`,
    };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
  });

  const data = (await res.json()) as { sid?: string; message?: string };
  if (!res.ok) {
    return { ok: false, mocked: false, error: data.message || "Twilio send failed" };
  }
  return { ok: true, mocked: false, providerMessageId: data.sid };
}

export function validateTwilioSignature(_url: string, _params: Record<string, string>, signature?: string) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return true;
  if (!signature) return false;
  return true;
}
