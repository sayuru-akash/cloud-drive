import type { Metadata } from "next";
import { fileRows, folderRows } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Files",
};

export default function FilesPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          My files
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
          Folder hierarchy, visibility, and recency at a glance.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-700">
          The route structure is prepared for folder detail pages, breadcrumbs,
          upload flows, and server-enforced file actions.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
            Folders
          </h2>
          <div className="mt-5 space-y-4">
            {folderRows.map((folder) => (
              <div key={folder.name} className="border-t border-ink-200/80 pt-4 first:border-none first:pt-0">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink-950">{folder.name}</p>
                    <p className="text-sm text-ink-600">
                      {folder.owner} • {folder.items} items
                    </p>
                  </div>
                  <span className="rounded-full bg-ink-950/6 px-3 py-1 text-xs font-medium text-ink-700">
                    {folder.visibility}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
            Current file index
          </h2>
          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-ink-200/80">
            {fileRows.map((file) => (
              <div
                key={file.name}
                className="grid gap-2 border-t border-ink-200/80 px-5 py-4 first:border-none md:grid-cols-[minmax(0,1.2fr)_0.7fr_0.7fr]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-950">{file.name}</p>
                  <p className="text-sm text-ink-600">
                    {file.type} • {file.size}
                  </p>
                </div>
                <p className="text-sm text-ink-700">{file.owner}</p>
                <p className="text-sm text-ink-700">{file.modified}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
