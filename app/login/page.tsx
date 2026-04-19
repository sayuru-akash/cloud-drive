import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { BrandMark } from "@/components/brand-mark";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to Cloud Drive with your internal account.",
};

export default async function LoginPage() {
  const session = await getSession();

  if (session?.session) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-8">
          <BrandMark />
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
              Internal access
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink-950">
              Sign in to the company file workspace.
            </h1>
            <p className="text-base leading-8 text-ink-700">
              Email and password authentication is live. The first registered
              account becomes `super_admin`; later accounts default to `member`.
              Password recovery is available through email.
            </p>
          </div>
          <AuthPanel />
        </div>
      </section>

      <section className="hidden bg-[radial-gradient(circle_at_top_left,rgba(25,122,104,0.2),transparent_28%),linear-gradient(180deg,#111827_0%,#18212f_100%)] px-10 py-16 text-white lg:flex lg:items-center">
        <div className="mx-auto max-w-xl space-y-6">
          <p className="text-sm uppercase tracking-[0.26em] text-emerald-300">
            Production posture
          </p>
          <h2 className="text-5xl font-semibold tracking-[-0.05em]">
            Auth, storage, and audit now run through real server flows.
          </h2>
          <div className="space-y-4 text-base leading-8 text-white/72">
            <p className="flex gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
              Session validation happens in protected layouts and route handlers,
              not only in the client.
            </p>
            <p className="flex gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
              Uploads are brokered through short-lived signed URLs while file
              metadata and permissions stay in Postgres.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
