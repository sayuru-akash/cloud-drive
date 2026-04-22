import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  FileWarning,
  HardDrive,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getAppSettings } from "@/lib/app-settings";
import { formatBytes } from "@/lib/format";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await requireSession();
  const settings = await getAppSettings();

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
                <p className="mt-0.5 font-medium text-ink-950">
                  {session.user.email}
                </p>
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
                Your account is secured with a password. You can reset it anytime via email.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-ink-200/80 bg-surface-strong p-4">
              <p className="text-sm font-medium text-ink-900">
                Email verification
              </p>
              <p className="mt-1 text-sm text-ink-600">
                {session.user.emailVerified
                  ? "Your email is verified."
                  : "Your email is not verified."}
              </p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
