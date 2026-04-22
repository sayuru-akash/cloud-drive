import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Download,
  FolderOpen,
  Home,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import {
  createFolderAction,
  moveFileAction,
  moveFolderAction,
  renameFileAction,
  renameFolderAction,
  softDeleteFileAction,
  softDeleteFolderAction,
  updateFileVisibilityAction,
  updateFolderVisibilityAction,
} from "@/app/(workspace)/files/actions";
import { ShareLinkForm } from "@/components/share-link-form";
import { UploadPanel } from "@/components/upload-panel";
import { FileIcon } from "@/components/file-icon";
import { requireSession } from "@/lib/auth/session";
import {
  getAccessibleFolderOptions,
  getFolderAncestors,
  getFolderContents,
} from "@/lib/drive";
import { formatBytes, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Files",
};

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{
    folder?: string;
    q?: string;
    type?: string;
    visibility?: "all" | "private" | "workspace";
    sort?: "updated-desc" | "updated-asc" | "name-asc" | "name-desc" | "size-desc" | "size-asc";
  }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const folderId = params.folder ?? null;
  const sort = params.sort ?? "updated-desc";
  const breadcrumbs = await getFolderAncestors(folderId);
  const [contents, moveTargets] = await Promise.all([
    getFolderContents({
      folderId,
      userId: session.user.id,
      userRole: session.user.role,
      query: params.q,
      fileType: params.type,
      visibility: params.visibility ?? "all",
      sort,
    }),
    getAccessibleFolderOptions({
      userId: session.user.id,
      userRole: session.user.role,
    }),
  ]);

  const totalItems = contents.folders.length + contents.files.length;

  return (
    <main className="space-y-6">
      {/* Header with breadcrumb */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-ink-600">
          <Link href="/files" className="inline-flex items-center gap-1 transition hover:text-ink-950">
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
          {totalItems === 0 ? "This folder is empty." : `${totalItems} item${totalItems === 1 ? "" : "s"}`}
        </p>
      </section>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Sidebar: Create folder + Upload */}
        <div className="w-full shrink-0 space-y-6 lg:w-80">
          <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
              New folder
            </p>
            <form action={createFolderAction} className="mt-4 space-y-4">
              <input type="hidden" name="parentFolderId" value={folderId ?? ""} />
              <input
                name="name"
                required
                placeholder="Folder name"
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
              />
              <select
                name="visibility"
                defaultValue="private"
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
              >
                <option value="private">Private</option>
                <option value="workspace">Workspace</option>
              </select>
              <button
                type="submit"
                className="w-full rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
              >
                Create folder
              </button>
            </form>
          </section>

          <UploadPanel folderId={folderId} />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Search & filters */}
          <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
            <form className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {folderId ? <input type="hidden" name="folder" value={folderId} /> : null}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="Search files..."
                  className="w-full rounded-2xl border border-ink-200 bg-white py-3 pl-10 pr-4 text-sm text-ink-900"
                />
              </div>
              <select
                name="type"
                defaultValue={params.type ?? "all"}
                className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
              >
                <option value="all">All types</option>
                {contents.availableFileTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                name="visibility"
                defaultValue={params.visibility ?? "all"}
                className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
              >
                <option value="all">All</option>
                <option value="private">Private</option>
                <option value="workspace">Workspace</option>
              </select>
              <select
                name="sort"
                defaultValue={sort}
                className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
              >
                <option value="updated-desc">Newest</option>
                <option value="updated-asc">Oldest</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="size-desc">Largest</option>
                <option value="size-asc">Smallest</option>
              </select>
              <button
                type="submit"
                className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
              >
                Search
              </button>
            </form>
          </section>

          {/* File list */}
          <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
            {totalItems === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg font-medium text-ink-950">No files yet</p>
                <p className="mt-2 text-sm text-ink-600">
                  Upload files or create a folder to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Table header */}
                <div className="hidden grid-cols-[1fr_6rem_5rem_8rem_7rem] gap-4 px-4 pb-2 text-xs uppercase tracking-[0.18em] text-ink-500 lg:grid">
                  <span>Name</span>
                  <span>Size</span>
                  <span className="text-center">Visibility</span>
                  <span>Modified</span>
                  <span className="text-right">Actions</span>
                </div>

                {/* Folders */}
                {contents.folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="group grid items-center gap-4 rounded-[1.25rem] border border-ink-200/60 bg-white/70 px-4 py-3 transition hover:border-ink-300 hover:bg-white lg:grid-cols-[1fr_6rem_5rem_8rem_7rem]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderOpen className="h-5 w-5 shrink-0 text-emerald-700" />
                      <Link
                        href={`/files?folder=${folder.id}`}
                        className="min-w-0 truncate font-medium text-ink-950 underline-offset-4 hover:underline"
                      >
                        {folder.name}
                      </Link>
                    </div>
                    <span className="hidden text-sm text-ink-500 lg:block">—</span>
                    <span className="hidden text-center text-sm text-ink-500 lg:block capitalize">
                      {folder.visibility}
                    </span>
                    <span className="hidden text-sm text-ink-500 lg:block">
                      {formatDate(folder.updatedAt)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/files?folder=${folder.id}`}
                        className="rounded-full border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                      >
                        Open
                      </Link>
                      <form action={softDeleteFolderAction} className="inline">
                        <input type="hidden" name="folderId" value={folder.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                      <details className="relative">
                        <summary className="list-none cursor-pointer">
                          <span className="inline-flex rounded-full border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </span>
                        </summary>
                        <div className="absolute right-0 z-10 mt-2 w-64 space-y-3 rounded-[1.25rem] border border-ink-200/80 bg-white p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)]">
                          <form action={renameFolderAction} className="space-y-2">
                            <input type="hidden" name="folderId" value={folder.id} />
                            <input
                              name="name"
                              defaultValue={folder.name}
                              className="w-full rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900"
                            />
                            <button
                              type="submit"
                              className="w-full rounded-full border border-ink-300 px-3 py-2 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                            >
                              Rename
                            </button>
                          </form>
                          <form action={moveFolderAction} className="space-y-2">
                            <input type="hidden" name="folderId" value={folder.id} />
                            <select
                              name="targetFolderId"
                              defaultValue=""
                              className="w-full rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900"
                            >
                              <option value="">Move to root</option>
                              {moveTargets.map((target) => (
                                <option key={target.id} value={target.id}>
                                  {target.path}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="w-full rounded-full border border-ink-300 px-3 py-2 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                            >
                              Move
                            </button>
                          </form>
                          <form action={updateFolderVisibilityAction} className="space-y-2">
                            <input type="hidden" name="folderId" value={folder.id} />
                            <select
                              name="visibility"
                              defaultValue={folder.visibility}
                              className="w-full rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900"
                            >
                              <option value="private">Private</option>
                              <option value="workspace">Workspace</option>
                            </select>
                            <button
                              type="submit"
                              className="w-full rounded-full border border-ink-300 px-3 py-2 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                            >
                              Update visibility
                            </button>
                          </form>
                        </div>
                      </details>
                    </div>
                  </div>
                ))}

                {/* Files */}
                {contents.files.map((file) => (
                  <div
                    key={file.id}
                    className="group grid items-center gap-4 rounded-[1.25rem] border border-ink-200/60 bg-white/70 px-4 py-3 transition hover:border-ink-300 hover:bg-white lg:grid-cols-[1fr_6rem_5rem_8rem_7rem]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileIcon mimeType={file.mimeType} className="h-5 w-5 shrink-0 text-ink-500" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-950">{file.displayName}</p>
                        <p className="text-xs text-ink-500 lg:hidden">
                          {formatBytes(file.sizeBytes)} • {formatDate(file.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <span className="hidden text-sm text-ink-500 lg:block">
                      {formatBytes(file.sizeBytes)}
                    </span>
                    <span className="hidden text-center text-sm text-ink-500 lg:block capitalize">
                      {file.visibility}
                    </span>
                    <span className="hidden text-sm text-ink-500 lg:block">
                      {formatDate(file.updatedAt)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/api/files/${file.id}/download`}
                        className="rounded-full border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Link>
                      <form action={softDeleteFileAction} className="inline">
                        <input type="hidden" name="fileId" value={file.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                      <details className="relative">
                        <summary className="list-none cursor-pointer">
                          <span className="inline-flex rounded-full border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </span>
                        </summary>
                        <div className="absolute right-0 z-10 mt-2 w-72 space-y-4 rounded-[1.25rem] border border-ink-200/80 bg-white p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)]">
                          <ShareLinkForm fileId={file.id} />
                          <div className="space-y-3 border-t border-ink-200/60 pt-3">
                            <form action={renameFileAction} className="space-y-2">
                              <input type="hidden" name="fileId" value={file.id} />
                              <input
                                name="name"
                                defaultValue={file.displayName}
                                className="w-full rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900"
                              />
                              <button
                                type="submit"
                                className="w-full rounded-full border border-ink-300 px-3 py-2 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                              >
                                Rename
                              </button>
                            </form>
                            <form action={moveFileAction} className="space-y-2">
                              <input type="hidden" name="fileId" value={file.id} />
                              <select
                                name="targetFolderId"
                                defaultValue={file.folderId ?? ""}
                                className="w-full rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900"
                              >
                                <option value="">Move to root</option>
                                {moveTargets.map((target) => (
                                  <option key={target.id} value={target.id}>
                                    {target.path}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="w-full rounded-full border border-ink-300 px-3 py-2 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                              >
                                Move
                              </button>
                            </form>
                            <form action={updateFileVisibilityAction} className="space-y-2">
                              <input type="hidden" name="fileId" value={file.id} />
                              <select
                                name="visibility"
                                defaultValue={file.visibility}
                                className="w-full rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900"
                              >
                                <option value="private">Private</option>
                                <option value="workspace">Workspace</option>
                              </select>
                              <button
                                type="submit"
                                className="w-full rounded-full border border-ink-300 px-3 py-2 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                              >
                                Update visibility
                              </button>
                            </form>
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
