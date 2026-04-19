import type { Metadata } from "next";
import { adminChecks } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Admin controls
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
          Policy, auditing, and file-governance checks.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-700">
          The admin surface is framed around the controls defined in the spec:
          user roles, audit logs, share visibility, retention, and upload
          guardrails.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {adminChecks.map((item) => (
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
