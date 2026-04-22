import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, verifications } from "@/lib/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";
import { env } from "@/lib/env";

export const RESET_PASSWORD_TOKEN_EXPIRES_IN_SECONDS = 60 * 60;
const RESET_PASSWORD_TOKEN_TTL_MS =
  RESET_PASSWORD_TOKEN_EXPIRES_IN_SECONDS * 1000;

export const PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE =
  "If this email exists in our system, check your inbox for the reset link.";

function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function buildResetPasswordUrl(
  token: string,
  redirectTo: string,
  appOrigin: string,
) {
  const authBaseUrl = `${stripTrailingSlash(appOrigin)}/api/auth`;
  return `${authBaseUrl}/reset-password/${token}?callbackURL=${encodeURIComponent(redirectTo)}`;
}

export async function requestPasswordResetEmail({
  email,
  redirectTo,
  appOrigin,
}: {
  email: string;
  redirectTo?: string;
  appOrigin?: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const resolvedAppOrigin = stripTrailingSlash(appOrigin?.trim() || env.appBaseUrl);

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
    redirectTo?.trim() || `${resolvedAppOrigin}/reset-password`;
  const expiresAt = new Date(Date.now() + RESET_PASSWORD_TOKEN_TTL_MS);

  await db.insert(verifications).values({
    id: randomUUID(),
    identifier,
    value: user.id,
    expiresAt,
  });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: buildResetPasswordUrl(token, safeRedirectTo, resolvedAppOrigin),
      expiresAt,
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
