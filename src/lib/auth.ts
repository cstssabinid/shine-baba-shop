import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

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
    },
  },
  plugins: [nextCookies()],
});

