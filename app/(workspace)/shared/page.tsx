import type { Metadata } from "next";
import { shareLinks } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Shared",
};

export default function SharedPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Shared resources
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
          Public links and internal visibility stay explicit.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-700">
          This view is structured for link expiry, download modes, password
          protection, and fast revocation without exposing raw storage URLs.
        </p>
      </section>

      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <div className="grid gap-4 md:grid-cols-3">
          {shareLinks.map((link) => (
            <article key={link.name} className="border-t border-ink-200/80 pt-4 first:border-none">
              <p className="font-medium text-ink-950">{link.name}</p>
              <p className="mt-2 text-sm leading-7 text-ink-600">{link.mode}</p>
              <p className="mt-3 text-sm text-ink-600">Expires {link.expires}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
