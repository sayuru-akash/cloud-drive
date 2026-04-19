import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAppSettings } from "@/lib/app-settings";
import { env, readiness } from "@/lib/env";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await requireSession();
  const settings = await getAppSettings();

  const settingsRows = [
    {
      title: "Upload limits",
      detail: `${settings.maxUploadSizeBytes.toLocaleString()} bytes max upload size.`,
    },
    {
      title: "Retention policy",
      detail: `${settings.defaultSoftDeleteRetentionDays} day soft-delete retention.`,
    },
    {
      title: "Storage bucket",
      detail: env.b2BucketName,
    },
    {
      title: "Default share expiry",
      detail: `${settings.defaultShareExpiryDays} days.`,
    },
  ];

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Settings
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
          Account and workspace configuration.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-700 sm:text-base sm:leading-8">
          Runtime policy is loaded from the database with environment fallbacks.
          Password recovery is available through email for {session.user.email}.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {settingsRows.map((item) => (
          <article
            key={item.title}
            className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur"
          >
            <p className="font-medium text-ink-950">{item.title}</p>
            <p className="mt-3 text-sm leading-7 text-ink-600">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
            Account
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink-950">
            {session.user.name}
          </h2>
          <p className="mt-2 text-sm text-ink-600">{session.user.email}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-emerald-700">
            {session.user.role}
          </p>
          <div className="mt-5">
            <Link
              href="/forgot-password"
              className="inline-flex w-full items-center justify-center rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white sm:w-auto"
            >
              Send password reset email
            </Link>
          </div>
        </article>

        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
            Readiness
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {Object.entries(readiness).map(([key, value]) => (
              <article key={key} className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-4">
                <p className="text-sm font-medium capitalize text-ink-950">
                  {key.replace(/([A-Z])/g, " $1")}
                </p>
                <p className={`mt-3 text-sm ${value ? "text-emerald-700" : "text-amber-700"}`}>
                  {value ? "Configured" : "Pending"}
                </p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
