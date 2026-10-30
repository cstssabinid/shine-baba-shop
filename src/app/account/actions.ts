"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { normalizeRwandaPhone, customerPhoneAuthEmail } from "@/lib/phone-number";
import { prisma } from "@/lib/prisma";

type CustomerAuthInput = {
  mode: "signin" | "signup";
  phoneNumber: string;
  password: string;
  name?: string;
};

export async function authenticateCustomerWithPhone(input: CustomerAuthInput) {
  if (!input || (input.mode !== "signin" && input.mode !== "signup") || typeof input.phoneNumber !== "string" || typeof input.password !== "string") {
    return { ok: false as const, reason: "authentication-failed" as const };
  }
  const phoneNumber = normalizeRwandaPhone(input.phoneNumber);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const password = input.password;

  if (!phoneNumber) return { ok: false as const, reason: "invalid-phone" as const };
  if (password.length < 10 || password.length > 128) return { ok: false as const, reason: "invalid-password" as const };
  if (input.mode === "signup" && (name.length < 2 || name.length > 120)) {
    return { ok: false as const, reason: "invalid-name" as const };
  }

  try {
    const phoneMatchedUser = await prisma.user.findFirst({
      where: { OR: [{ phoneNumber }, { phone: phoneNumber }] },
      select: { id: true, email: true, role: true, status: true, phone: true, phoneNumber: true, phoneNumberVerified: true },
    });

    const generatedEmail = customerPhoneAuthEmail(phoneNumber);
    const generatedEmailOwner = await prisma.user.findUnique({
      where: { email: generatedEmail },
      select: { id: true, email: true, role: true, status: true, phone: true, phoneNumber: true, phoneNumberVerified: true },
    });
    if (generatedEmailOwner) {
      const ownerPhone = generatedEmailOwner.phoneNumber ?? generatedEmailOwner.phone;
      if (
        !ownerPhone ||
        normalizeRwandaPhone(ownerPhone) !== phoneNumber ||
        generatedEmailOwner.role !== "CUSTOMER" ||
        generatedEmailOwner.status !== "ACTIVE" ||
        (phoneMatchedUser && phoneMatchedUser.id !== generatedEmailOwner.id)
      ) {
        return { ok: false as const, reason: "account-exists" as const };
      }
    }

    const existing = phoneMatchedUser ?? generatedEmailOwner;
    if (input.mode === "signup" && existing) {
      return { ok: false as const, reason: "account-exists" as const };
    }
    if (input.mode === "signin" && existing && (existing.role !== "CUSTOMER" || existing.status !== "ACTIVE")) {
      return { ok: false as const, reason: "authentication-failed" as const };
    }

    const email = input.mode === "signin" && existing?.email
      ? existing.email
      : generatedEmail;
    const requestHeaders = await headers();
    const result = input.mode === "signup"
      ? await auth.api.signUpEmail({
          body: { email, name, password },
          headers: requestHeaders,
        })
      : await auth.api.signInEmail({
          body: { email, password },
          headers: requestHeaders,
        });

    const userId = result.user?.id;
    if (!userId) return { ok: false as const, reason: "authentication-failed" as const };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true, phone: true, phoneNumber: true, phoneNumberVerified: true },
    });
    if (!user || user.role !== "CUSTOMER" || user.status !== "ACTIVE") {
      return { ok: false as const, reason: "authentication-failed" as const };
    }
    if (
      (user.phone && normalizeRwandaPhone(user.phone) !== phoneNumber) ||
      (user.phoneNumber && normalizeRwandaPhone(user.phoneNumber) !== phoneNumber)
    ) {
      return { ok: false as const, reason: "authentication-failed" as const };
    }

    const phoneOwner = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber }, { phone: phoneNumber }],
        NOT: { id: userId },
      },
      select: { id: true },
    });
    if (phoneOwner) return { ok: false as const, reason: "account-exists" as const };

    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber,
        phone: phoneNumber,
        phoneNumberVerified: user.phoneNumber === phoneNumber ? user.phoneNumberVerified : false,
      },
    });

    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "authentication-failed" as const };
  }
}
