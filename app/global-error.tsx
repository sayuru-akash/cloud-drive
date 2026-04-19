"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
        <main className="w-full max-w-xl space-y-8 rounded-[2rem] border border-ink-200/80 bg-white/80 p-10 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="space-y-3">
            <p className="font-mono text-sm text-ink-500">Unhandled error</p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink-950">
              The app hit a boundary it could not recover from automatically.
            </h1>
            <p className="text-base leading-8 text-ink-700">
              Retry the render, or return to a stable route while the failing
              path is investigated.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
            >
              Retry render
            </button>
            <Link
              href="/"
              className="rounded-full border border-ink-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:border-ink-500 hover:bg-white"
            >
              Return home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
