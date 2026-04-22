import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Link2,
  XCircle,
} from "lucide-react";
import { revokeShareLinkAction } from "@/app/(workspace)/files/actions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { files, shareLinks } from "@/lib/db/schema";
import { canManageAdmin } from "@/lib/drive";
import { formatDate } from "@/lib/format";
import { getShareLinkStatus } from "@/lib/share-links";

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

  const activeCount = rows.filter(
    (r) =>
      getShareLinkStatus({
        expiresAt: r.expiresAt,
        isRevoked: r.isRevoked,
      }) === "active",
  ).length;
  const expiredCount = rows.filter(
    (r) =>
      getShareLinkStatus({
        expiresAt: r.expiresAt,
        isRevoked: r.isRevoked,
      }) === "expired",
  ).length;

  return (
    <main className="space-y-6">
      {/* Header */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Shared links
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
          Manage your shared links
        </h1>
        <p className="mt-2 text-lg leading-8 text-ink-700">
          {rows.length === 0
            ? "No links yet. Share files from the Files page."
            : `${rows.length} link${rows.length === 1 ? "" : "s"} • ${activeCount} active${expiredCount > 0 ? ` • ${expiredCount} expired` : ""}`}
        </p>
      </section>

      {/* Links list */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
        {rows.length === 0 ? (
          <div className="py-12 text-center">
            <Link2 className="mx-auto h-8 w-8 text-ink-300" />
            <p className="mt-4 text-lg font-medium text-ink-950">
              No shared links
            </p>
            <p className="mt-2 text-sm text-ink-600">
              Share files from the Files page and they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table header */}
            <div className="hidden grid-cols-[1fr_6rem_8rem_10rem_7rem] gap-4 px-4 pb-2 text-xs uppercase tracking-[0.18em] text-ink-500 lg:grid">
              <span>File</span>
              <span>Mode</span>
              <span>Status</span>
              <span>Created</span>
              <span className="text-right">Actions</span>
            </div>

            {rows.map((row) => {
              const status = getShareLinkStatus({
                expiresAt: row.expiresAt,
                isRevoked: row.isRevoked,
              });

              return (
                <div
                  key={row.id}
                  className="group grid items-center gap-4 rounded-[1.25rem] border border-ink-200/60 bg-white/70 px-4 py-3 transition hover:border-ink-300 hover:bg-white lg:grid-cols-[1fr_6rem_8rem_10rem_7rem]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-950">
                      {row.fileName ?? "Unknown file"}
                    </p>
                    <p className="text-xs text-ink-500 lg:hidden">
                      {row.mode} • {status}
                    </p>
                  </div>

                  <span className="hidden items-center gap-1.5 text-sm text-ink-600 lg:inline-flex">
                    {row.mode === "download" ? (
                      <Download className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {row.mode}
                  </span>

                  <span className="hidden lg:block">
                    {status === "active" && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active
                      </span>
                    )}
                    {status === "revoked" && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
                        <XCircle className="h-3.5 w-3.5" />
                        Revoked
                      </span>
                    )}
                    {status === "expired" && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
                        <Clock className="h-3.5 w-3.5" />
                        Expired
                      </span>
                    )}
                  </span>

                  <span className="hidden text-sm text-ink-500 lg:block">
                    {formatDate(row.createdAt)}
                    {row.expiresAt && (
                      <span className="block text-xs text-ink-400">
                        Expires {formatDate(row.expiresAt)}
                      </span>
                    )}
                  </span>

                  <div className="flex items-center justify-end gap-2">
                    {status === "active" && (
                      <form action={revokeShareLinkAction}>
                        <input
                          type="hidden"
                          name="shareId"
                          value={row.id}
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-ink-300 px-4 py-1.5 text-xs font-medium text-ink-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                        >
                          Revoke
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
