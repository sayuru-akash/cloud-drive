import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!env.resendFromEmail) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  const result = await resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject,
    html,
    text,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name?: string | null;
  resetUrl: string;
}) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi,";

  await sendEmail({
    to,
    subject: "Reset your Cloud Drive password",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#f6f3ed;padding:32px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e7e1d7;">
          <p style="margin:0 0 16px;color:#475569;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;">Cloud Drive</p>
          <h1 style="margin:0 0 16px;color:#0f172a;font-size:30px;line-height:1.1;">Reset your password</h1>
          <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.8;">${greeting} We received a request to reset the password for your internal workspace account.</p>
          <p style="margin:24px 0;">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;">Reset password</a>
          </p>
          <p style="margin:0;color:#64748b;font-size:14px;line-height:1.8;">This link expires automatically. If you did not request a reset, you can ignore this email.</p>
        </div>
      </div>
    `,
    text: `${greeting}\n\nReset your Cloud Drive password:\n${resetUrl}\n\nIf you did not request this email, you can ignore it.`,
  });
}

export async function sendShareLinkEmail({
  to,
  fileName,
  shareUrl,
  expiresAt,
  senderName,
  mode,
}: {
  to: string;
  fileName: string;
  shareUrl: string;
  expiresAt?: Date | null;
  senderName?: string | null;
  mode: "view" | "download";
}) {
  const expiryText = expiresAt
    ? `This link expires on ${expiresAt.toLocaleString()}.`
    : "This link does not have an expiry date.";

  await sendEmail({
    to,
    subject: `${senderName ?? "A teammate"} shared ${fileName} with you`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#f6f3ed;padding:32px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e7e1d7;">
          <p style="margin:0 0 16px;color:#475569;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;">Cloud Drive</p>
          <h1 style="margin:0 0 16px;color:#0f172a;font-size:30px;line-height:1.1;">${fileName}</h1>
          <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.8;">${senderName ?? "A teammate"} shared a ${mode === "download" ? "download-enabled" : "view-only"} link with you.</p>
          <p style="margin:24px 0;">
            <a href="${shareUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;">Open shared file</a>
          </p>
          <p style="margin:0;color:#64748b;font-size:14px;line-height:1.8;">${expiryText}</p>
        </div>
      </div>
    `,
    text: `${senderName ?? "A teammate"} shared ${fileName} with you.\n\nOpen it here:\n${shareUrl}\n\n${expiryText}`,
  });
}
