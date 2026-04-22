"use client";

import { FolderPlus } from "lucide-react";
import { createFolderAction } from "@/app/(workspace)/files/actions";
import { ActionForm, ActionSubmitButton } from "@/components/action-ui";
import { UploadPanel } from "@/components/upload-panel";
import { UploadActivityCard } from "@/components/upload-activity-card";

export type PendingUpload = {
  uploadId: string;
  fileId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  folderId: string | null;
  folderName: string | null;
  sizeBytes: number;
  createdAt: Date;
  expiresAt: Date;
};

export function FilesSidebar({
  folderId,
  pendingUploads,
}: {
  folderId: string | null;
  pendingUploads: PendingUpload[];
}) {
  return (
    <div className="w-full shrink-0 space-y-6 lg:w-80">
      {/* New folder */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          New folder
        </p>
        <ActionForm action={createFolderAction} pendingLabel="Creating folder" className="mt-4 space-y-4">
          <input
            type="hidden"
            name="parentFolderId"
            value={folderId ?? ""}
          />
          <input
            name="name"
            required
            placeholder="Folder name"
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
          />
          <select
            name="visibility"
            defaultValue="private"
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
          >
            <option value="private">Private</option>
            <option value="workspace">Workspace</option>
          </select>
          <ActionSubmitButton
            pendingLabel="Creating..."
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            <FolderPlus className="h-4 w-4" />
            Create folder
          </ActionSubmitButton>
        </ActionForm>
      </section>

      {pendingUploads.length > 0 ? (
        <UploadActivityCard
          id="upload-activity"
          uploads={pendingUploads}
          total={pendingUploads.length}
        />
      ) : null}

      <UploadPanel folderId={folderId} />
    </div>
  );
}
