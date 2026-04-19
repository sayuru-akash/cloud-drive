import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getFolderAncestors, getFolderContents } from "@/lib/drive";
import {
  createFolderAction,
  softDeleteFileAction,
  softDeleteFolderAction,
} from "@/app/(workspace)/files/actions";
import { ShareLinkForm } from "@/components/share-link-form";
import { UploadPanel } from "@/components/upload-panel";

export const metadata: Metadata = {
  title: "Files",
};

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const session = await requireSession();
  const { folder } = await searchParams;
  const folderId = folder ?? null;
  const breadcrumbs = await getFolderAncestors(folderId);
  const contents = await getFolderContents({
    folderId,
    userId: session.user.id,
    userRole: session.user.role,
  });

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          My files
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
          Folders, uploads, and share links now run from the database.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-700">
          Use this screen to create folders, upload directly to Backblaze B2,
          issue short-lived share links, and delete or recover resources through
          the linked workspace views.
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

        <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <div className="flex items-end justify-between gap-4">
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
                  No folders here yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {contents.folders.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <Link
                            href={`/files?folder=${item.id}`}
                            className="font-medium text-ink-950 underline-offset-4 hover:underline"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-sm text-ink-600">
                            {item.visibility} • Updated{" "}
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
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-ink-800">Files</p>
              {contents.files.length === 0 ? (
                <p className="text-sm leading-7 text-ink-600">
                  No files in this folder yet.
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
                              {file.visibility}
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
