import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  FileWarning,
  HardDrive,
  Mail,
  Send,
  Shield,
  User,
} from "lucide-react";
import { sendVerificationEmailAction } from "@/app/(workspace)/settings/actions";
import { ActionForm, ActionSubmitButton } from "@/components/action-ui";
import { requireSession } from "@/lib/auth/session";
import { getAppSettings } from "@/lib/app-settings";
import { formatBytes } from "@/lib/format";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; verified?: string }>;
}) {
  const session = await requireSession();
  const settings = await getAppSettings();
  const params = await searchParams;
  const showSent = params.sent === "1";
  const showVerified = params.verified === "1";

  const workspaceCards = [
    {
      icon: HardDrive,
      label: "Upload limit",
      value: formatBytes(settings.maxUploadSizeBytes),
    },
    {
      icon: Clock,
      label: "Trash retention",
      value: `${settings.defaultSoftDeleteRetentionDays} days`,
    },
    {
      icon: Clock,
      label: "Default link expiry",
      value: `${settings.defaultShareExpiryDays} days`,
    },
    {
      icon: FileWarning,
      label: "Blocked types",
      value: `${settings.blockedFileExtensions.length} extensions`,
    },
  ];

  return (
    <main className="space-y-6">
      {/* Header */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Settings
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
          Your account and workspace
        </h1>
        <p className="mt-2 text-lg leading-8 text-ink-700">
          Manage your profile and view workspace policies.
        </p>
      </section>

      {/* Alerts */}
      {showSent && (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-sm font-medium text-emerald-900">
            Verification email sent
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Check your inbox for the verification link.
          </p>
        </div>
      )}
      {showVerified && (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-sm font-medium text-emerald-900">
            Email verified
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Your email address has been confirmed.
          </p>
        </div>
      )}

      {/* Workspace info */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {workspaceCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur"
          >
            <card.icon className="h-5 w-5 text-ink-400" />
            <p className="mt-3 text-sm text-ink-500">{card.label}</p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink-950">
              {card.value}
            </p>
          </article>
        ))}
      </section>

      {/* Account */}
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
            Profile
          </p>

          <div className="mt-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-ink-200 bg-surface-strong">
                <User className="h-5 w-5 text-ink-500" />
              </div>
              <div>
                <p className="text-sm text-ink-500">Name</p>
                <p className="mt-0.5 font-medium text-ink-950">
                  {session.user.name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-ink-200 bg-surface-strong">
                <Mail className="h-5 w-5 text-ink-500" />
              </div>
              <div>
                <p className="text-sm text-ink-500">Email</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="font-medium text-ink-950">
                    {session.user.email}
                  </p>
                  {session.user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-ink-200 bg-surface-strong">
                <Shield className="h-5 w-5 text-ink-500" />
              </div>
              <div>
                <p className="text-sm text-ink-500">Role</p>
                <p className="mt-0.5 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-800">
                  {session.user.role ?? "member"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center rounded-full border border-ink-300 px-5 py-2.5 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
            >
              Send password reset email
            </Link>
          </div>
        </article>

        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
            Security
          </p>
          <div className="mt-6 space-y-4">
            <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-sm font-medium text-emerald-900">
                Password protected
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                Your account is secured with a password. You can reset it
                anytime via email.
              </p>
            </div>

            <div
              className={`rounded-[1.25rem] border p-4 ${
                session.user.emailVerified
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-amber-200 bg-amber-50/60"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  session.user.emailVerified
                    ? "text-emerald-900"
                    : "text-amber-900"
                }`}
              >
                Email verification
              </p>
              <p
                className={`mt-1 text-sm ${
                  session.user.emailVerified
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {session.user.emailVerified
                  ? "Your email is verified."
                  : "Your email is not verified. Verify it to secure your account."}
              </p>
              {!session.user.emailVerified && (
                <ActionForm
                  action={sendVerificationEmailAction}
                  pendingLabel="Sending verification email"
                  className="mt-3"
                >
                  <ActionSubmitButton
                    pendingLabel="Sending..."
                    className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-800"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Resend verification email
                  </ActionSubmitButton>
                </ActionForm>
              )}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
