import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-8 rounded-[2rem] border border-ink-200/80 bg-white/75 p-10 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
        <BrandMark />
        <div className="space-y-3">
          <p className="font-mono text-sm text-ink-500">404</p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink-950">
            This route does not exist in the workspace.
          </h1>
          <p className="text-base leading-8 text-ink-700">
            The application shell is in place, but this path is not part of the
            current foundation.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            Return home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-ink-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:border-ink-500 hover:bg-white"
          >
            Open workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
