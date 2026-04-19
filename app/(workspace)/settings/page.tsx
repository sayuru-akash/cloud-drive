import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

const settingsRows = [
  {
    title: "Upload limits",
    detail:
      "Use env-backed defaults for file size limits while keeping room for admin-managed policy later.",
  },
  {
    title: "Retention policy",
    detail:
      "The starter exposes a 30-day soft-delete assumption that can be overridden per environment.",
  },
  {
    title: "Monitoring",
    detail:
      "Add Sentry once DSN values are present so route failures and upload issues are visible early.",
  },
];

export default function SettingsPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Settings
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
          Configuration surfaces that map cleanly to environment and policy.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-700">
          This route is ready for tenant-safe defaults, upload guardrails,
          retention changes, and eventual admin controls.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
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
    </main>
  );
}
