import type { Metadata } from "next";
import { deletedItems } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Deleted Items",
};

export default function DeletedPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Deleted items
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
          Soft delete is visible, recoverable, and time-bounded.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-700">
          The route is ready for retention-based restore and hard-delete
          policies without forcing immediate data loss.
        </p>
      </section>

      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <div className="space-y-5">
          {deletedItems.map((item) => (
            <article key={item.name} className="border-t border-ink-200/80 pt-5 first:border-none first:pt-0">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-ink-950">{item.name}</p>
                  <p className="text-sm text-ink-600">
                    Deleted {item.deletedAt} • {item.reason}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-700/10 px-3 py-1 text-xs font-medium text-emerald-800">
                  {item.remaining} left
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
