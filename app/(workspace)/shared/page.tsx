import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { revokeShareLinkAction } from "@/app/(workspace)/files/actions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { files, shareLinks } from "@/lib/db/schema";
import { canManageAdmin } from "@/lib/drive";

export const metadata: Metadata = {
  title: "Shared",
};

export default async function SharedPage() {
  const session = await requireSession();

  const query = db
    .select({
      id: shareLinks.id,
      fileId: shareLinks.resourceId,
      fileName: files.displayName,
      mode: shareLinks.mode,
      expiresAt: shareLinks.expiresAt,
      isRevoked: shareLinks.isRevoked,
      createdAt: shareLinks.createdAt,
      createdByUserId: shareLinks.createdByUserId,
    })
    .from(shareLinks)
    .leftJoin(files, eq(shareLinks.resourceId, files.id));

  const rows = await (canManageAdmin(session.user.role)
    ? query.orderBy(desc(shareLinks.createdAt))
    : query
        .where(eq(shareLinks.createdByUserId, session.user.id))
        .orderBy(desc(shareLinks.createdAt)));

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Shared resources
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
          Public links are revocable, expiring, and private-bucket backed.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-700">
          Links resolve to the public `/s/[token]` route, which validates the
          share record before issuing a short-lived signed object URL.
        </p>
      </section>

      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        {rows.length === 0 ? (
        <p className="text-sm leading-7 text-ink-600">
          No share links yet. Create them from the Files view. Newly created
          links will appear here with revoke controls.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <article key={row.id} className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-ink-950">{row.fileName ?? row.fileId}</p>
                  <p className="mt-1 text-sm text-ink-600">
                    {row.mode} •{" "}
                      {row.expiresAt
                        ? `Expires ${new Date(row.expiresAt).toLocaleString()}`
                        : "No expiry"}{" "}
                      • {row.isRevoked ? "Revoked" : "Active"}
                    </p>
                  </div>
                  {!row.isRevoked ? (
                    <form action={revokeShareLinkAction}>
                      <input type="hidden" name="shareId" value={row.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                      >
                        Revoke
                      </button>
                    </form>
                  ) : null}
                </div>
                <p className="text-xs text-ink-500">
                  Create new links from individual file rows in `/files`.
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
