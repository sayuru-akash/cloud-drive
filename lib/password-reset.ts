import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, verifications } from "@/lib/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";
import { env } from "@/lib/env";

const RESET_PASSWORD_TOKEN_TTL_MS = 60 * 60 * 1000;

export const PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE =
  "If this email exists in our system, check your inbox for the reset link.";

function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function buildResetPasswordUrl(token: string, redirectTo: string) {
  const authBaseUrl = `${stripTrailingSlash(env.appBaseUrl)}/api/auth`;
  return `${authBaseUrl}/reset-password/${token}?callbackURL=${encodeURIComponent(redirectTo)}`;
}

export async function requestPasswordResetEmail({
  email,
  redirectTo,
}: {
  email: string;
  redirectTo?: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || user.isActive === false) {
    randomBytes(18).toString("base64url");

    return {
      status: true as const,
      message: PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE,
    };
  }

  const token = randomBytes(18).toString("base64url");
  const identifier = `reset-password:${token}`;
  const safeRedirectTo =
    redirectTo?.trim() || `${stripTrailingSlash(env.appBaseUrl)}/reset-password`;

  await db.insert(verifications).values({
    id: randomUUID(),
    identifier,
    value: user.id,
    expiresAt: new Date(Date.now() + RESET_PASSWORD_TOKEN_TTL_MS),
  });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: buildResetPasswordUrl(token, safeRedirectTo),
    });
  } catch (error) {
    await db.delete(verifications).where(eq(verifications.identifier, identifier));
    throw error;
  }

  return {
    status: true as const,
    message: PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE,
  };
}
