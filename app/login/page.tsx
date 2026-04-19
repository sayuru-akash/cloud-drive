import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Login",
  description: "Prepared auth entry point for the Cloud Drive workspace.",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-8 rounded-[2rem] border border-ink-200/80 bg-white/82 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
          <BrandMark />
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
              Auth entry
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink-950">
              Sign in surface, ready for Better Auth wiring.
            </h1>
            <p className="text-base leading-8 text-ink-700">
              The UI is in place, but credentials are intentionally not mocked.
              Wire this route to Better Auth once your database and session
              secret are configured.
            </p>
          </div>
          <div className="space-y-4 rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-800" htmlFor="email">
                Work email
              </label>
              <input
                id="email"
                disabled
                placeholder="name@company.com"
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-800" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                disabled
                placeholder="Authentication not wired yet"
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-500"
              />
            </div>
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white opacity-60"
            >
              <LockKeyhole className="h-4 w-4" />
              Configure auth to enable sign in
            </button>
          </div>
        </div>
      </section>

      <section className="hidden bg-[radial-gradient(circle_at_top_left,rgba(25,122,104,0.2),transparent_28%),linear-gradient(180deg,#111827_0%,#18212f_100%)] px-10 py-16 text-white lg:flex lg:items-center">
        <div className="mx-auto max-w-xl space-y-6">
          <p className="text-sm uppercase tracking-[0.26em] text-emerald-300">
            Security posture
          </p>
          <h2 className="text-5xl font-semibold tracking-[-0.05em]">
            Sessions, protected routes, and file policy should converge here.
          </h2>
          <div className="space-y-4 text-base leading-8 text-white/72">
            <p className="flex gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
              Use `BETTER_AUTH_SECRET`, secure cookies, and server-side
              permission checks before unlocking workspace access.
            </p>
            <p className="flex gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
              Keep all public sharing flows separate from authenticated session
              access so internal permissions remain explicit.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/35 hover:bg-white/6"
          >
            Inspect workspace shell
          </Link>
        </div>
      </section>
    </main>
  );
}
