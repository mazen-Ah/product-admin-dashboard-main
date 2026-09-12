import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const trustedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://*.trycloudflare.com",
  "https://*.loca.lt",
  process.env.BETTER_AUTH_URL,
  ...(process.env.TRUSTED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ??
    []),
].filter(Boolean) as string[];

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins,
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
