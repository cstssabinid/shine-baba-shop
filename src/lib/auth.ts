import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { prisma } from "@/lib/prisma";
import { normalizeRwandaPhone } from "@/lib/phone-number";
import { sendVerificationSms } from "@/lib/sms";

const deploymentOrigin = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;
const baseURL = process.env.VERCEL_ENV === "preview"
  ? deploymentOrigin ?? process.env.BETTER_AUTH_URL
  : process.env.BETTER_AUTH_URL ?? deploymentOrigin;

const trustedOrigins = [
  baseURL,
  "http://localhost:3000",
  "https://shinebabashop.com",
  "https://shine-baba-shop.vercel.app",
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  appName: "Shine Baba Shop",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins,
  user: {
    fields: { name: "fullName" },
    additionalFields: {
      role: {
        type: ["CUSTOMER", "SELLER", "ADMIN"],
        required: false,
        input: false,
        returned: false,
      },
      status: {
        type: ["ACTIVE", "PENDING", "SUSPENDED"],
        required: false,
        input: false,
        returned: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 300, max: 10 },
      "/sign-up/email": { window: 3600, max: 8 },
      "/phone-number/send-otp": { window: 3600, max: 5 },
      "/phone-number/verify": { window: 300, max: 15 },
    },
  },
  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      phoneNumberValidator: (value) => normalizeRwandaPhone(value) === value,
      sendOTP: ({ phoneNumber, code }) => sendVerificationSms(phoneNumber, code),
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => `phone-${phoneNumber.replace(/\D/g, "")}@accounts.shinebabashop.com`,
        getTempName: () => "Shine Baba Shop customer",
      },
      callbackOnVerification: async ({ phoneNumber, user }) => {
        const userId = (user as typeof user & { id: string }).id;
        const account = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, status: true, phone: true } });
        if (!account || account.role !== "CUSTOMER" || account.status !== "ACTIVE" || (account.phone && account.phone !== phoneNumber)) {
          throw new Error("This account cannot sign in.");
        }
        await prisma.user.update({ where: { id: userId }, data: { phone: phoneNumber } });
      },
    }),
    nextCookies(),
  ],
});

