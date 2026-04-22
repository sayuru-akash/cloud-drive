import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { BrandMark } from "@/components/brand-mark";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Cloud Drive workspace.",
};

export default async function LoginPage() {
  const session = await getSession();

  if (session?.session) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative flex items-center justify-center px-6 py-16 lg:px-10">
        <div className="w-full max-w-md space-y-10">
          <BrandMark variant="minimal" />
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink-950">
              Welcome back
            </h1>
            <p className="text-lg leading-8 text-ink-700">
              Sign in to access your workspace.
            </p>
          </div>
          <AuthPanel />
        </div>
      </section>

      <section className="hidden bg-[radial-gradient(circle_at_top_left,rgba(25,122,104,0.2),transparent_28%),linear-gradient(180deg,#111827_0%,#18212f_100%)] px-6 py-16 text-white lg:flex lg:items-center lg:px-10">
        <div className="mx-auto w-full max-w-md space-y-8">
          <p className="text-sm uppercase tracking-[0.26em] text-emerald-300">
            Cloud Drive
          </p>
          <h2 className="text-4xl font-semibold tracking-[-0.05em] xl:text-5xl">
            Your files, organized and secure.
          </h2>
          <div className="space-y-4 text-base leading-8 text-white/72">
            <p className="flex gap-3">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
              Upload and share files with your team in seconds.
            </p>
            <p className="flex gap-3">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
              Recover deleted files anytime within your retention window.
            </p>
            <p className="flex gap-3">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
              Admin controls and audit logs keep your workspace safe.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
