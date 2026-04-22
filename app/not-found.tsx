import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(25,122,104,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.1),transparent_30%),linear-gradient(180deg,#f7f3ec_0%,#f3efe6_44%,#f7f4ee_100%)]" />
      <div className="absolute inset-x-0 top-20 -z-10 h-64 bg-[radial-gradient(circle,rgba(255,255,255,0.82),transparent_62%)] blur-3xl" />

      <div className="w-full max-w-lg space-y-10 rounded-[2rem] border border-ink-200/80 bg-white/75 p-10 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
        <BrandMark variant="minimal" />
        <div className="space-y-3">
          <p className="font-mono text-sm text-ink-500">404</p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink-950">
            Page not found
          </h1>
          <p className="text-lg leading-8 text-ink-700">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
