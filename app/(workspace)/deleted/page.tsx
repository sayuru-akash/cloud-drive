import type { Metadata } from "next";
import {
  AlertTriangle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  hardDeleteResourceAction,
  restoreResourceAction,
} from "@/app/(workspace)/files/actions";
import { requireSession } from "@/lib/auth/session";
import { getAppSettings } from "@/lib/app-settings";
import { getDeletedResources } from "@/lib/drive";
import { canManageAdmin } from "@/lib/drive";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Deleted Items",
};

export default async function DeletedPage() {
  const session = await requireSession();
  const settings = await getAppSettings();
  const rows = await getDeletedResources(session.user.id, session.user.role);
  const canHardDelete = canManageAdmin(session.user.role);

  return (
    <main className="space-y-6">
      {/* Header */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Trash
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
          Deleted items
        </h1>
        <p className="mt-2 text-lg leading-8 text-ink-700">
          {rows.length === 0
            ? "Trash is empty."
            : `${rows.length} item${rows.length === 1 ? "" : "s"} • Auto-deleted after ${settings.defaultSoftDeleteRetentionDays} days`}
        </p>
      </section>

      {/* Deleted items list */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
        {rows.length === 0 ? (
          <div className="py-12 text-center">
            <Trash2 className="mx-auto h-8 w-8 text-ink-300" />
            <p className="mt-4 text-lg font-medium text-ink-950">
              Nothing here
            </p>
            <p className="mt-2 text-sm text-ink-600">
              Deleted files and folders show up here before they are permanently removed.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table header */}
            <div className="hidden grid-cols-[1fr_6rem_10rem_10rem] gap-4 px-4 pb-2 text-xs uppercase tracking-[0.18em] text-ink-500 lg:grid">
              <span>Name</span>
              <span>Type</span>
              <span>Deleted</span>
              <span className="text-right">Actions</span>
            </div>

            {rows.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="group grid items-center gap-4 rounded-[1.25rem] border border-ink-200/60 bg-white/70 px-4 py-3 transition hover:border-ink-300 hover:bg-white lg:grid-cols-[1fr_6rem_10rem_10rem]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-950">
                    {item.name}
                  </p>
                  <p className="text-xs text-ink-500 lg:hidden capitalize">
                    {item.type} • Deleted {formatDate(item.deletedAt)}
                  </p>
                </div>

                <span className="hidden text-sm capitalize text-ink-500 lg:block">
                  {item.type}
                </span>

                <span className="hidden text-sm text-ink-500 lg:block">
                  {formatDate(item.deletedAt)}
                </span>

                <div className="flex items-center justify-end gap-2">
                  <form action={restoreResourceAction}>
                    <input
                      type="hidden"
                      name="resourceType"
                      value={item.type}
                    />
                    <input
                      type="hidden"
                      name="resourceId"
                      value={item.id}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </button>
                  </form>

                  {canHardDelete && (
                    <form action={hardDeleteResourceAction}>
                      <input
                        type="hidden"
                        name="resourceType"
                        value={item.type}
                      />
                      <input
                        type="hidden"
                        name="resourceId"
                        value={item.id}
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
