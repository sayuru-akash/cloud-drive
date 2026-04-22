"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  LayoutGrid,
  LayoutList,
  Search,
} from "lucide-react";

export function FilesToolbar({
  breadcrumbs,
  folderId,
  params,
  availableFileTypes,
  totalItems,
  viewMode,
  onViewModeChange,
  selectAll,
  clearAll,
  selectedCount,
}: {
  breadcrumbs: Array<{ id: string; name: string }>;
  folderId: string | null;
  params: {
    q?: string;
    type?: string;
    visibility?: string;
    sort?: string;
  };
  availableFileTypes: string[];
  totalItems: number;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  selectAll: () => void;
  clearAll: () => void;
  selectedCount: number;
}) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = new URLSearchParams();
    const q = String(formData.get("q") ?? "").trim();
    const type = String(formData.get("type") ?? "all");
    const visibility = String(formData.get("visibility") ?? "all");
    const sort = String(formData.get("sort") ?? "updated-desc");
    if (q) query.set("q", q);
    if (type !== "all") query.set("type", type);
    if (visibility !== "all") query.set("visibility", visibility);
    if (sort !== "updated-desc") query.set("sort", sort);
    if (folderId) query.set("folder", folderId);
    const href = `/files${query.toString() ? `?${query.toString()}` : ""}`;
    // @ts-expect-error Typed routes don't support dynamic query strings
    router.push(href);
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumbs + title */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-ink-600">
          <Link
            href="/files"
            className="inline-flex items-center gap-1 transition hover:text-ink-950"
          >
            <Home className="h-4 w-4" />
            Files
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-ink-400" />
              <Link
                href={`/files?folder=${crumb.id}`}
                className="transition hover:text-ink-950"
              >
                {crumb.name}
              </Link>
            </span>
          ))}
        </nav>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
          {breadcrumbs.length > 0
            ? breadcrumbs[breadcrumbs.length - 1].name
            : "All files"}
        </h1>
        <p className="mt-2 text-lg leading-8 text-ink-700">
          {totalItems === 0
            ? "This folder is empty."
            : `${totalItems} item${totalItems === 1 ? "" : "s"}`}
        </p>
      </section>

      {/* Search + filters */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search files..."
                className="w-full rounded-2xl border border-ink-200 bg-white py-3 pl-10 pr-4 text-sm text-ink-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
            >
              Search
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              name="type"
              defaultValue={params.type ?? "all"}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
            >
              <option value="all">All types</option>
              {availableFileTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              name="visibility"
              defaultValue={params.visibility ?? "all"}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
            >
              <option value="all">All</option>
              <option value="private">Private</option>
              <option value="workspace">Workspace</option>
            </select>
            <select
              name="sort"
              defaultValue={params.sort ?? "updated-desc"}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
            >
              <option value="updated-desc">Newest</option>
              <option value="updated-asc">Oldest</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="size-desc">Largest</option>
              <option value="size-asc">Smallest</option>
            </select>

            <div className="ml-auto flex items-center gap-2">
              {totalItems > 0 && (
                <button
                  type="button"
                  onClick={selectedCount > 0 ? clearAll : selectAll}
                  className="rounded-full border border-ink-300 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                >
                  {selectedCount > 0 ? "Clear selection" : "Select all"}
                </button>
              )}
              <div className="flex overflow-hidden rounded-2xl border border-ink-200 bg-white">
                <button
                  type="button"
                  onClick={() => onViewModeChange("list")}
                  className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm transition ${
                    viewMode === "list"
                      ? "bg-ink-950 text-white"
                      : "text-ink-700 hover:bg-surface-strong"
                  }`}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange("grid")}
                  className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm transition ${
                    viewMode === "grid"
                      ? "bg-ink-950 text-white"
                      : "text-ink-700 hover:bg-surface-strong"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
