import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

function originFromHost(host: string | undefined) {
  if (!host) return null;
  const cleaned = host.replace(/\/$/, "");
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
  return `https://${cleaned}`;
}

const trustedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://*.trycloudflare.com",
  "https://*.loca.lt",
  "https://*.vercel.app",
  originFromHost(process.env.BETTER_AUTH_URL),
  originFromHost(process.env.NEXT_PUBLIC_APP_URL),
  originFromHost(process.env.VERCEL_URL),
  originFromHost(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  ...(process.env.TRUSTED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ??
    []),
].filter(Boolean) as string[];

const baseURL =
  originFromHost(process.env.BETTER_AUTH_URL) ??
  originFromHost(process.env.NEXT_PUBLIC_APP_URL) ??
  originFromHost(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  originFromHost(process.env.VERCEL_URL) ??
  "http://localhost:3000";

const onVercel = Boolean(process.env.VERCEL);
const week = 60 * 60 * 24 * 7;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins,
  session: {
    expiresIn: week,
    updateAge: 60 * 60 * 12,
    cookieCache: {
      enabled: true,
      maxAge: week,
      strategy: "jwe",
    },
  },
  advanced: {
    useSecureCookies: onVercel || process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: onVercel || process.env.NODE_ENV === "production",
      path: "/",
      httpOnly: true,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "PROJECT_SUPERVISOR",
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
