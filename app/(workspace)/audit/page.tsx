import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { requireAdminSession } from "@/lib/auth/session";
import { getAdminAuditData } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Audit",
};

function normalizePage(value: string | undefined) {
  const page = Number(value);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function buildAuditHref({
  q,
  action,
  resource,
  page,
}: {
  q?: string;
  action?: string;
  resource?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (q?.trim()) {
    params.set("q", q.trim());
  }

  if (action && action !== "all") {
    params.set("action", action);
  }

  if (resource && resource !== "all") {
    params.set("resource", resource);
  }

  if (page && page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/audit?${query}` : "/audit";
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    action?: string;
    resource?: string;
    page?: string;
  }>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const auditData = await getAdminAuditData({
    q: String(params.q ?? "").trim(),
    action: String(params.action ?? "all"),
    resource: String(params.resource ?? "all"),
    page: normalizePage(params.page),
  });
  const visiblePages = getVisiblePages(
    auditData.pagination.currentPage,
    auditData.pagination.totalPages,
  );

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Administration
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
          Audit log
        </h1>
        <p className="mt-2 text-lg leading-8 text-ink-700">
          {auditData.pagination.totalItems} event{auditData.pagination.totalItems === 1 ? "" : "s"}
        </p>
      </section>

      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
        <form className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              name="q"
              defaultValue={auditData.filters.q}
              placeholder="Search action, actor, or resource"
              className="w-full rounded-2xl border border-ink-200 bg-white py-3 pl-10 pr-4 text-sm text-ink-900"
            />
          </div>
          <select
            name="action"
            defaultValue={auditData.filters.action}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
          >
            <option value="all">All actions</option>
            {auditData.options.actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <select
            name="resource"
            defaultValue={auditData.filters.resource}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
          >
            <option value="all">All resources</option>
            {auditData.options.resources.map((resource) => (
              <option key={resource} value={resource}>
                {resource}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            Apply
          </button>
          <a
            href="/audit"
            className="rounded-full border border-ink-300 px-5 py-3 text-center text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
          >
            Clear
          </a>
        </form>
      </section>

      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
              Audit
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink-950">
              Event log
            </h2>
          </div>
          <p className="text-sm text-ink-600">
            {auditData.pagination.startItem}-{auditData.pagination.endItem} of{" "}
            {auditData.pagination.totalItems}
          </p>
        </div>

        {auditData.rows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg font-medium text-ink-950">No events found</p>
            <p className="mt-2 text-sm text-ink-600">
              Try a broader search or reset the filters.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            <div className="hidden grid-cols-[1.25fr_1fr_1fr_9rem] gap-4 px-4 pb-2 text-xs uppercase tracking-[0.18em] text-ink-500 lg:grid">
              <span>Action</span>
              <span>Actor</span>
              <span>Resource</span>
              <span className="text-right">When</span>
            </div>

            {auditData.rows.map((row) => (
              <article
                key={row.id}
                className="grid gap-3 rounded-[1.25rem] border border-ink-200/60 bg-white/70 px-4 py-3 lg:grid-cols-[1.25fr_1fr_1fr_9rem] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-950">
                    {row.actionType}
                  </p>
                  {row.resourceId ? (
                    <p className="mt-1 truncate text-xs text-ink-500 lg:hidden">
                      {row.resourceType ?? "resource"} • {row.resourceId}
                    </p>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-700">
                    {row.actorEmail ?? "system"}
                  </p>
                  {row.ipAddress ? (
                    <p className="mt-1 truncate text-xs text-ink-500">
                      {row.ipAddress}
                    </p>
                  ) : null}
                </div>
                <div className="min-w-0 text-sm text-ink-700">
                  <p className="truncate">
                    {row.resourceType ?? "resource"}
                  </p>
                  {row.resourceId ? (
                    <p className="mt-1 truncate text-xs text-ink-500">
                      {row.resourceId}
                    </p>
                  ) : null}
                </div>
                <div className="text-sm text-ink-500 lg:text-right">
                  {formatDateTime(row.createdAt)}
                </div>
              </article>
            ))}
          </div>
        )}

        {auditData.pagination.totalPages > 1 ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-ink-200/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={buildAuditHref({
                  q: auditData.filters.q,
                  action: auditData.filters.action,
                  resource: auditData.filters.resource,
                  page: Math.max(auditData.pagination.currentPage - 1, 1),
                })}
                aria-disabled={auditData.pagination.currentPage === 1}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  auditData.pagination.currentPage === 1
                    ? "pointer-events-none border-ink-200 text-ink-400"
                    : "border-ink-300 text-ink-700 hover:border-ink-500 hover:bg-white"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </a>

              {visiblePages.map((page) => (
                <a
                  key={page}
                  href={buildAuditHref({
                    q: auditData.filters.q,
                    action: auditData.filters.action,
                    resource: auditData.filters.resource,
                    page,
                  })}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-medium transition ${
                    page === auditData.pagination.currentPage
                      ? "border-ink-950 bg-ink-950 text-white"
                      : "border-ink-300 text-ink-700 hover:border-ink-500 hover:bg-white"
                  }`}
                >
                  {page}
                </a>
              ))}

              <a
                href={buildAuditHref({
                  q: auditData.filters.q,
                  action: auditData.filters.action,
                  resource: auditData.filters.resource,
                  page: Math.min(
                    auditData.pagination.currentPage + 1,
                    auditData.pagination.totalPages,
                  ),
                })}
                aria-disabled={
                  auditData.pagination.currentPage === auditData.pagination.totalPages
                }
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  auditData.pagination.currentPage === auditData.pagination.totalPages
                    ? "pointer-events-none border-ink-200 text-ink-400"
                    : "border-ink-300 text-ink-700 hover:border-ink-500 hover:bg-white"
                }`}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <p className="text-sm text-ink-600">
              Page {auditData.pagination.currentPage} of{" "}
              {auditData.pagination.totalPages}
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
