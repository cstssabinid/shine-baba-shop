import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { normalizeRwandaPhone, maskPhoneNumber } from "@/lib/phone-number";
import { isSmsConfigured } from "@/lib/sms";

const cookieName = "sbs_manager_session";
const sessionLifetimeSeconds = 60 * 60 * 12;

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isManagerLoginConfigured() {
  return Boolean(getManagerPhoneNumber() && sessionSecret().length >= 32 && isSmsConfigured());
}

export function getManagerPhoneNumber() {
  return normalizeRwandaPhone(process.env.ADMIN_PHONE_NUMBER ?? "");
}

export function getManagerPhoneHint() {
  const phoneNumber = getManagerPhoneNumber();
  return phoneNumber ? maskPhoneNumber(phoneNumber) : null;
}

export async function hasManagerSession() {
  if (!isManagerLoginConfigured()) return false;
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return false;
  const [encodedPayload, signature, extra] = value.split(".");
  if (!encodedPayload || !signature || extra) return false;
  if (!constantTimeEqual(signature, sign(encodedPayload))) return false;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as { exp?: number; role?: string };
    return payload.role === "manager" && typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function setManagerSession() {
  const payload = Buffer.from(JSON.stringify({ role: "manager", exp: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds })).toString("base64url");
  (await cookies()).set(cookieName, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: sessionLifetimeSeconds,
  });
}

export async function clearManagerSession() {
  (await cookies()).delete(cookieName);
}
