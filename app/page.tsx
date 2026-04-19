import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileLock2,
  FolderTree,
  History,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { DashboardPreview } from "@/components/dashboard-preview";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  title: "Internal File Operations, Without the Overhead",
  description:
    "A production-grade foundation for secure internal file storage, controlled sharing, auditability, and Backblaze-powered delivery.",
};

const principles = [
  {
    title: "Direct uploads, controlled access",
    description:
      "Large files move straight to storage through signed upload flows while permission checks stay in the app layer where they belong.",
    icon: Upload,
  },
  {
    title: "Folders that stay understandable",
    description:
      "Nested hierarchy, breadcrumbs, deleted-item recovery, and visibility states are designed into the workspace from the first pass.",
    icon: FolderTree,
  },
  {
    title: "Sharing with limits",
    description:
      "Workspace access, public view links, download controls, expiry windows, and revoke paths are represented in the product surface up front.",
    icon: FileLock2,
  },
];

const guarantees = [
  "Server-rendered routes with static metadata, sitemap, robots, manifest, and a health endpoint.",
  "Strict TypeScript, typed routes, hardened response headers, and env scaffolding aligned to the spec.",
  "A light-first product shell built for dashboard, files, deleted items, shared links, and admin workflows.",
  "No unnecessary infrastructure additions: no Redis, no Docker boilerplate, no ornamental dependency sprawl.",
];

const flow = [
  {
    step: "01",
    title: "Request signed upload session",
    description:
      "Metadata is registered before bytes move so the system can track status, size limits, and owner context from the start.",
  },
  {
    step: "02",
    title: "Stream file directly to storage",
    description:
      "The browser talks to the object store through short-lived credentials instead of routing large payloads through the app server.",
  },
  {
    step: "03",
    title: "Verify, activate, and audit",
    description:
      "Completion updates state, makes the record visible, and creates an auditable event trail for recovery and review.",
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(circle_at_top_left,rgba(25,122,104,0.22),transparent_38%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.12),transparent_30%),linear-gradient(180deg,#f7f3ec_0%,#f3efe6_44%,#f7f4ee_100%)]" />
      <div className="absolute inset-x-0 top-24 -z-10 h-72 bg-[radial-gradient(circle,rgba(255,255,255,0.82),transparent_62%)] blur-3xl" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <BrandMark />
        <nav className="hidden items-center gap-8 text-sm text-ink-600 md:flex">
          <Link href="#architecture" className="transition hover:text-ink-950">
            Architecture
          </Link>
          <Link href="#workflow" className="transition hover:text-ink-950">
            Workflow
          </Link>
          <Link href="/dashboard" className="transition hover:text-ink-950">
            Workspace
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-14 px-6 pb-20 pt-4 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:px-10 lg:pb-28 lg:pt-10">
        <div className="flex max-w-xl flex-col justify-center gap-8">
          <div className="animate-rise space-y-5">
            <p className="text-sm font-medium uppercase tracking-[0.26em] text-emerald-700">
              Cloud Drive
            </p>
            <h1 className="max-w-lg text-5xl font-semibold tracking-[-0.06em] text-ink-950 sm:text-6xl">
              Internal file operations with cleaner control.
            </h1>
            <p className="max-w-md text-base leading-8 text-ink-700 sm:text-lg">
              A refined Next.js 16 foundation for secure uploads, predictable
              sharing, recovery workflows, and audit-ready admin surfaces.
            </p>
          </div>

          <div className="animate-rise-delayed flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
            >
              Open workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/api/health"
              className="inline-flex items-center justify-center rounded-full border border-ink-300/70 bg-white/70 px-6 py-3 text-sm font-medium text-ink-800 backdrop-blur transition hover:border-ink-500 hover:bg-white"
            >
              Review readiness endpoint
            </Link>
          </div>

          <ul className="animate-rise-delayed grid gap-3 text-sm text-ink-700">
            {guarantees.map((item) => (
              <li key={item} className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <DashboardPreview />
      </section>

      <section
        id="architecture"
        className="border-y border-black/5 bg-white/65 py-20 backdrop-blur-sm"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:px-10">
          <SectionHeading
            eyebrow="Product shape"
            title="The UI starts from the operating model, not a template."
            description="Each surface maps to a real requirement from the spec: uploads, visibility, recovery, and admin oversight."
          />

          <div className="grid gap-10 md:grid-cols-3">
            {principles.map(({ title, description, icon: Icon }) => (
              <article key={title} className="space-y-4 border-l border-ink-200 pl-5">
                <Icon className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-ink-950">{title}</h2>
                <p className="text-sm leading-7 text-ink-700">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <SectionHeading
            eyebrow="Critical path"
            title="The upload lifecycle is already modeled around safe defaults."
            description="The product shell and supporting utilities are prepared for the signed URL flow described in the spec."
          />

          <div className="grid gap-8">
            {flow.map((item) => (
              <article
                key={item.step}
                className="grid gap-5 border-t border-ink-200 py-6 md:grid-cols-[5rem_minmax(0,1fr)]"
              >
                <p className="font-mono text-sm text-ink-500">{item.step}</p>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
                    {item.title}
                  </h2>
                  <p className="max-w-2xl text-base leading-8 text-ink-700">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-black/5 bg-ink-950 py-20 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm uppercase tracking-[0.26em] text-emerald-300">
              Production baseline
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              The starter is ready for real integrations, not a rewrite.
            </h2>
            <p className="text-base leading-8 text-white/72">
              Next steps can layer Better Auth, Neon, Drizzle, Backblaze B2,
              Resend, and Sentry into the structure already in place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/files"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:border-white/35 hover:bg-white/6"
            >
              View file index
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-medium text-ink-950 transition hover:bg-emerald-300"
            >
              Inspect admin surface
              <History className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
