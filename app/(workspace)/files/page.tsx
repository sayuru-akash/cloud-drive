import type { Metadata } from "next";
import Link from "next/link";
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
import { requireSession } from "@/lib/auth/session";
import {
  getAccessibleFolderOptions,
  getFolderAncestors,
  getFolderContents,
} from "@/lib/drive";

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
    owner?: string;
    sort?: "updated-desc" | "updated-asc" | "name-asc" | "name-desc" | "size-desc" | "size-asc";
    from?: string;
    to?: string;
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
      ownerId: params.owner,
      sort,
      updatedAfter: params.from,
      updatedBefore: params.to,
    }),
    getAccessibleFolderOptions({
      userId: session.user.id,
      userRole: session.user.role,
    }),
  ]);

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          My files
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
          Search, organize, and share files with real metadata controls.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-700 sm:text-base sm:leading-8">
          Folder hierarchy, visibility, move actions, direct uploads, and
          share-link creation all run through the same permission-aware server layer.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-ink-600">
          <Link href="/files" className="rounded-full border border-ink-200 px-3 py-1.5 hover:bg-surface-strong">
            Root
          </Link>
          {breadcrumbs.map((crumb) => (
            <Link
              key={crumb.id}
              href={`/files?folder=${crumb.id}`}
              className="rounded-full border border-ink-200 px-3 py-1.5 hover:bg-surface-strong"
            >
              {crumb.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
        <form className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.2fr_repeat(5,minmax(0,0.72fr))]">
          {folderId ? <input type="hidden" name="folder" value={folderId} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search by file or folder name"
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
          />
          <select
            name="type"
            defaultValue={params.type ?? "all"}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
          >
            <option value="all">All file types</option>
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
            <option value="all">All visibility</option>
            <option value="private">Private</option>
            <option value="workspace">Workspace</option>
          </select>
          <select
            name="owner"
            defaultValue={params.owner ?? "all"}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
          >
            <option value="all">All owners</option>
            {contents.availableOwners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
          >
            <option value="updated-desc">Newest first</option>
            <option value="updated-asc">Oldest first</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="size-desc">Largest first</option>
            <option value="size-asc">Smallest first</option>
          </select>
          <button
            type="submit"
            className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            Apply filters
          </button>
          <input
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
          />
          <input
            type="date"
            name="to"
            defaultValue={params.to ?? ""}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
          />
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
              Create folder
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
                <option value="workspace">Workspace visible</option>
              </select>
              <button
                type="submit"
                className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
              >
                Create folder
              </button>
            </form>
          </section>

          <UploadPanel folderId={folderId} />
        </div>

        <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
                Folder contents
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink-950">
                {folderId ? "Selected folder" : "Root workspace"}
              </h2>
            </div>
            <p className="text-sm text-ink-500">
              {contents.folders.length} folders • {contents.files.length} files
            </p>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-ink-800">Folders</p>
              {contents.folders.length === 0 ? (
                <p className="text-sm leading-7 text-ink-600">
                  No folders matched the current filters.
                </p>
              ) : (
                <div className="space-y-3">
                  {contents.folders.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-4"
                    >
                      <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <Link
                              href={`/files?folder=${item.id}`}
                              className="font-medium text-ink-950 underline-offset-4 hover:underline"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-1 text-sm text-ink-600">
                              {item.visibility} • {item.ownerName ?? "Unknown"} • Updated{" "}
                              {new Date(item.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <form action={softDeleteFolderAction}>
                            <input type="hidden" name="folderId" value={item.id} />
                            <button
                              type="submit"
                              className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                            >
                              Delete
                            </button>
                          </form>
                        </div>

                        <details className="rounded-[1.25rem] border border-ink-200 bg-white p-4">
                          <summary className="cursor-pointer text-sm font-medium text-ink-800">
                            Folder actions
                          </summary>
                          <div className="mt-4 grid gap-4 xl:grid-cols-3">
                            <form action={renameFolderAction} className="space-y-3">
                              <input type="hidden" name="folderId" value={item.id} />
                              <input
                                name="name"
                                defaultValue={item.name}
                                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
                              />
                              <button
                                type="submit"
                                className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700"
                              >
                                Rename
                              </button>
                            </form>

                            <form action={moveFolderAction} className="space-y-3">
                              <input type="hidden" name="folderId" value={item.id} />
                              <select
                                name="targetFolderId"
                                defaultValue=""
                                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
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
                                className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700"
                              >
                                Move
                              </button>
                            </form>

                            <form action={updateFolderVisibilityAction} className="space-y-3">
                              <input type="hidden" name="folderId" value={item.id} />
                              <select
                                name="visibility"
                                defaultValue={item.visibility}
                                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
                              >
                                <option value="private">Private</option>
                                <option value="workspace">Workspace</option>
                              </select>
                              <button
                                type="submit"
                                className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700"
                              >
                                Save visibility
                              </button>
                            </form>
                          </div>
                        </details>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-ink-800">Files</p>
              {contents.files.length === 0 ? (
                <p className="text-sm leading-7 text-ink-600">
                  No files matched the current filters.
                </p>
              ) : (
                <div className="space-y-3">
                  {contents.files.map((file) => (
                    <article
                      key={file.id}
                      className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-4"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium text-ink-950">{file.displayName}</p>
                            <p className="mt-1 text-sm text-ink-600">
                              {file.mimeType} •{" "}
                              {Number(file.sizeBytes).toLocaleString()} bytes •{" "}
                              {file.visibility} • {file.ownerName ?? "Unknown"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/api/files/${file.id}/download`}
                              className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-800"
                            >
                              Download
                            </Link>
                            <form action={softDeleteFileAction}>
                              <input type="hidden" name="fileId" value={file.id} />
                              <button
                                type="submit"
                                className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </div>

                        <details className="rounded-[1.25rem] border border-ink-200 bg-white p-4">
                          <summary className="cursor-pointer text-sm font-medium text-ink-800">
                            File actions
                          </summary>
                          <div className="mt-4 grid gap-4 xl:grid-cols-3">
                            <form action={renameFileAction} className="space-y-3">
                              <input type="hidden" name="fileId" value={file.id} />
                              <input
                                name="name"
                                defaultValue={file.displayName}
                                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
                              />
                              <button
                                type="submit"
                                className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700"
                              >
                                Rename
                              </button>
                            </form>

                            <form action={moveFileAction} className="space-y-3">
                              <input type="hidden" name="fileId" value={file.id} />
                              <select
                                name="targetFolderId"
                                defaultValue={file.folderId ?? ""}
                                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
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
                                className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700"
                              >
                                Move
                              </button>
                            </form>

                            <form action={updateFileVisibilityAction} className="space-y-3">
                              <input type="hidden" name="fileId" value={file.id} />
                              <select
                                name="visibility"
                                defaultValue={file.visibility}
                                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
                              >
                                <option value="private">Private</option>
                                <option value="workspace">Workspace</option>
                              </select>
                              <button
                                type="submit"
                                className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700"
                              >
                                Save visibility
                              </button>
                            </form>
                          </div>
                        </details>

                        <ShareLinkForm fileId={file.id} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
