"use client";

import { FolderPlus, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { createFolderAction } from "@/app/(workspace)/files/actions";
import { UploadPanel } from "@/components/upload-panel";

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-ink-800 disabled:opacity-60"
      title="Create folder"
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <FolderPlus className="h-4 w-4" />
      )}
    </button>
  );
}

export function FilesSidebar({
  folderId,
}: {
  folderId: string | null;
}) {
  return (
    <div className="w-full shrink-0 lg:w-72">
      <div className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        {/* New folder */}
        <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
          New folder
        </p>
        <form
          action={createFolderAction}
          className="mt-3 flex flex-col gap-2"
        >
          <input
            type="hidden"
            name="parentFolderId"
            value={folderId ?? ""}
          />
          <div className="flex gap-2">
            <input
              name="name"
              required
              placeholder="Folder name"
              className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
            />
            <CreateButton />
          </div>
          <select
            name="visibility"
            defaultValue="private"
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
          >
            <option value="private">Private</option>
            <option value="workspace">Workspace</option>
          </select>
        </form>

        <div className="my-4 h-px bg-ink-200/60" />

        {/* Upload */}
        <UploadPanel folderId={folderId} compact />
      </div>
    </div>
  );
}
