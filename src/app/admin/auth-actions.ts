"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { clearManagerSession, getManagerPhoneNumber, isManagerLoginConfigured, setManagerSession } from "@/lib/admin-auth";

export async function sendManagerOtp() {
  const phoneNumber = getManagerPhoneNumber();
  if (!isManagerLoginConfigured() || !phoneNumber) return { ok: false as const, reason: "not-configured" as const };
  try {
    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber }, headers: await headers() });
    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "send-failed" as const };
  }
}

export async function verifyManagerOtp(code: string) {
  const phoneNumber = getManagerPhoneNumber();
  if (!isManagerLoginConfigured() || !phoneNumber || !/^\d{6}$/.test(code)) {
    return { ok: false as const, reason: "invalid-code" as const };
  }
  try {
    const result = await auth.api.consumePhoneNumberOTP({ body: { phoneNumber, code }, headers: await headers() });
    if (!result.status) return { ok: false as const, reason: "invalid-code" as const };
    await setManagerSession();
    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "invalid-code" as const };
  }
}

export async function managerLogout() {
  await clearManagerSession();
  redirect("/admin");
}
