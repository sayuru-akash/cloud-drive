import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email";
import { env } from "@/lib/env";
import { RESET_PASSWORD_TOKEN_EXPIRES_IN_SECONDS } from "@/lib/password-reset";

const authAllowedHosts = Array.from(
  new Set(
    [
      ...env.trustedOrigins.map((origin) => new URL(origin).host),
      "*.vercel.app",
    ],
  ),
);

export const auth = betterAuth({
  baseURL: {
    fallback: env.appBaseUrl,
    allowedHosts: authAllowedHosts,
    protocol: "auto",
  },
  secret: env.betterAuthSecret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  trustedOrigins: env.trustedOrigins,
  advanced: {
    trustedProxyHeaders: true,
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: RESET_PASSWORD_TOKEN_EXPIRES_IN_SECONDS,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: url,
        expiresAt: new Date(
          Date.now() + RESET_PASSWORD_TOKEN_EXPIRES_IN_SECONDS * 1000,
        ),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verifyUrl: url,
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
      },
      isActive: {
        type: "boolean",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const [{ value: userCount }] = await db
            .select({ value: count() })
            .from(schema.users);

          return {
            data: {
              ...user,
              role: userCount === 0 ? "super_admin" : "member",
              isActive: true,
            },
          };
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/sign-in/email" &&
        typeof ctx.body?.email === "string"
      ) {
        const [user] = await db
          .select({
            isActive: schema.users.isActive,
          })
          .from(schema.users)
          .where(eq(schema.users.email, ctx.body.email.toLowerCase()))
          .limit(1);

        if (user?.isActive === false) {
          throw new APIError("FORBIDDEN", {
            message: "This account has been disabled.",
          });
        }
      }

      if (
        ctx.path !== "/sign-up/email" ||
        !env.internalEmailDomain ||
        typeof ctx.body?.email !== "string"
      ) {
        return;
      }

      const email = ctx.body.email.toLowerCase();

      if (!email.endsWith(`@${env.internalEmailDomain}`)) {
        throw new APIError("FORBIDDEN", {
          message: `Only @${env.internalEmailDomain} email addresses can sign up.`,
        });
      }
    }),
  },
});
