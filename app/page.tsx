import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileLock2,
  FolderTree,
  History,
  Link2,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { DashboardPreview } from "@/components/dashboard-preview";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  title: "Cloud Drive — Secure file workspace for teams",
  description:
    "Store, organize, and share files with your team. Built-in recovery, admin controls, and audit visibility.",
};

const features = [
  {
    title: "Organize",
    description:
      "Upload and arrange files in folders your whole team can navigate.",
    icon: FolderTree,
  },
  {
    title: "Share securely",
    description:
      "Send password-protected links with expiry dates and view controls.",
    icon: Link2,
  },
  {
    title: "Recover easily",
    description:
      "Deleted something? Get it back within your retention window.",
    icon: History,
  },
  {
    title: "Stay in control",
    description:
      "Manage users, review audit logs, and set workspace policies.",
    icon: ShieldCheck,
  },
];

const trust = [
  {
    title: "Role-based access control",
    icon: Shield,
  },
  {
    title: "Full audit trails for every action",
    icon: ClipboardList,
  },
  {
    title: "Blocked extensions and upload limits",
    icon: FileLock2,
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(circle_at_top_left,rgba(25,122,104,0.22),transparent_38%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.12),transparent_30%),linear-gradient(180deg,#f7f3ec_0%,#f3efe6_44%,#f7f4ee_100%)]" />
      <div className="absolute inset-x-0 top-24 -z-10 h-72 bg-[radial-gradient(circle,rgba(255,255,255,0.82),transparent_62%)] blur-3xl" />

      {/* Header */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <BrandMark variant="minimal" />
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-full border border-ink-300/70 bg-white/70 px-5 py-2.5 text-sm font-medium text-ink-800 backdrop-blur transition hover:border-ink-500 hover:bg-white"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-7xl gap-14 px-6 pb-20 pt-4 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:px-10 lg:pb-28 lg:pt-10">
        <div className="flex max-w-xl flex-col justify-center gap-8">
          <div className="animate-rise space-y-5">
            <h1 className="max-w-lg text-5xl font-semibold tracking-[-0.06em] text-ink-950 sm:text-6xl">
              Your team&apos;s files, in one place.
            </h1>
            <p className="max-w-md text-base leading-8 text-ink-700 sm:text-lg">
              Store, organize, and share company documents with the people who
              need them.
            </p>
          </div>

          <div className="animate-rise-delayed">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <DashboardPreview />
      </section>

      {/* Features */}
      <section className="border-y border-black/5 bg-white/65 py-20 backdrop-blur-sm lg:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:px-10">
          <SectionHeading
            eyebrow="What you can do"
            title="Everything your team needs."
            description="A simple workspace for the way modern teams actually work."
          />

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {features.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="space-y-4 rounded-[1.5rem] border border-ink-200/70 bg-white/70 p-6"
              >
                <Icon className="h-5 w-5 text-emerald-700" />
                <h3 className="text-lg font-semibold text-ink-950">{title}</h3>
                <p className="text-sm leading-7 text-ink-700">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">
            Security by default
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
            Built for teams that take security seriously.
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-3">
          {trust.map(({ title, icon: Icon }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-4 rounded-[1.5rem] border border-ink-200/70 bg-white/70 p-6 text-center"
            >
              <Icon className="h-5 w-5 text-emerald-700" />
              <p className="text-sm font-medium text-ink-950">{title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-black/5 bg-ink-950 py-20 lg:py-28">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 px-6 text-center lg:px-10">
          <h2 className="max-w-xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
            Start organizing your files today.
          </h2>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-medium text-ink-950 transition hover:bg-emerald-300"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-ink-950 py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-white/50 sm:flex-row lg:px-10">
          <p>© 2026 Cloud Drive</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="transition hover:text-white/80">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
