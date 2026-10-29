import { normalizeRwandaPhone } from "@/lib/phone-number";

export function isSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_MESSAGING_SERVICE_SID?.trim(),
  );
}

export async function sendVerificationSms(phoneNumber: string, code: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const normalizedPhone = normalizeRwandaPhone(phoneNumber);

  if (!accountSid || !authToken || !messagingServiceSid || !normalizedPhone || normalizedPhone !== phoneNumber) {
    throw new Error("SMS delivery is not configured for this phone number.");
  }

  const body = new URLSearchParams({
    To: normalizedPhone,
    MessagingServiceSid: messagingServiceSid,
    Body: `Your Shine Baba Shop verification code is ${code}. It expires in 5 minutes. Do not share it.`,
  });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) throw new Error("The SMS provider could not deliver the verification code.");
}
