import type { Metadata } from "next";
import { restoreResourceAction } from "@/app/(workspace)/files/actions";
import { requireSession } from "@/lib/auth/session";
import { getDeletedResources } from "@/lib/drive";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Deleted Items",
};

export default async function DeletedPage() {
  const session = await requireSession();
  const rows = await getDeletedResources(session.user.id, session.user.role);

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Deleted items
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
          Soft delete keeps resources out of circulation without immediate loss.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-700">
          The current retention default is {env.defaultSoftDeleteRetentionDays} days.
        </p>
      </section>

      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        {rows.length === 0 ? (
          <p className="text-sm leading-7 text-ink-600">
            Nothing is currently deleted.
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map((item) => (
              <article key={`${item.type}-${item.id}`} className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-ink-950">{item.name}</p>
                    <p className="mt-1 text-sm text-ink-600">
                      {item.type} • Deleted{" "}
                      {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : "recently"}
                    </p>
                  </div>
                  <form action={restoreResourceAction}>
                    <input type="hidden" name="resourceType" value={item.type} />
                    <input type="hidden" name="resourceId" value={item.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-800"
                    >
                      Restore
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
