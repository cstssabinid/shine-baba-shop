"use server";

import { prisma } from "@/lib/prisma";
import { normalizeRwandaPhone } from "@/lib/phone-number";
import { isSmsConfigured } from "@/lib/sms";

export async function prepareCustomerPhoneAuth(rawPhone: string) {
  const phoneNumber = normalizeRwandaPhone(rawPhone);
  if (!phoneNumber) return { ok: false as const, reason: "invalid-phone" as const };
  if (!isSmsConfigured()) return { ok: false as const, reason: "sms-unavailable" as const };

  try {
    const [legacyUser, phoneUser] = await Promise.all([
      prisma.user.findUnique({ where: { phone: phoneNumber }, select: { id: true, phoneNumber: true } }),
      prisma.user.findUnique({ where: { phoneNumber }, select: { id: true } }),
    ]);
    if (legacyUser && phoneUser && legacyUser.id !== phoneUser.id) {
      return { ok: false as const, reason: "account-conflict" as const };
    }
    if (legacyUser && !legacyUser.phoneNumber) {
      await prisma.user.update({
        where: { id: legacyUser.id },
        data: { phoneNumber, phoneNumberVerified: false },
      });
    }
    return { ok: true as const, phoneNumber };
  } catch {
    return { ok: false as const, reason: "unavailable" as const };
  }
}
