import Link from "next/link";
import { Clock3, Upload } from "lucide-react";
import { cancelPendingUploadAction } from "@/app/(workspace)/files/actions";
import { ActionForm, ConfirmSubmitButton } from "@/components/action-ui";
import { FileIcon } from "@/components/file-icon";
import { formatBytes, formatDate, formatDateTime } from "@/lib/format";

type PendingUpload = {
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

type UploadActivityCardProps = {
  uploads: PendingUpload[];
  total: number;
  id?: string;
  linkToFiles?: boolean;
};

export function UploadActivityCard({
  uploads,
  total,
  id,
  linkToFiles = false,
}: UploadActivityCardProps) {
  return (
    <section
      id={id}
      className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
            Uploads
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink-950">
            Upload activity
          </h2>
        </div>
        {linkToFiles ? (
          <Link
            href="/files#upload-activity"
            className="text-sm font-medium text-emerald-800 transition hover:text-emerald-700"
          >
            Open queue →
          </Link>
        ) : null}
      </div>

      <div className="space-y-2">
        {uploads.map((upload) => {
          const destinationHref = upload.folderId
            ? `/files?folder=${upload.folderId}#upload-activity`
            : "/files#upload-activity";

          return (
            <article
              key={upload.uploadId}
              className="flex flex-col gap-3 rounded-[1.25rem] border border-ink-200/60 bg-white/70 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-surface-strong p-2 text-ink-500">
                    <FileIcon mimeType={upload.mimeType} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-ink-950">
                        {upload.fileName}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                        Pending
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      {formatBytes(upload.sizeBytes)}
                      {upload.folderName ? ` • ${upload.folderName}` : " • Root"}
                      {` • ${formatDate(upload.createdAt)}`}
                    </p>
                  </div>
                </div>
                <Upload className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <Clock3 className="h-4 w-4 text-ink-400" />
                  <span>Expires {formatDateTime(upload.expiresAt)}</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={destinationHref}
                    className="rounded-full border border-ink-300 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                  >
                    Open
                  </a>
                  <ActionForm action={cancelPendingUploadAction} pendingLabel="Cancelling upload">
                    <input type="hidden" name="fileId" value={upload.fileId} />
                    <ConfirmSubmitButton
                      title="Cancel upload?"
                      description="This pending upload will be removed."
                      confirmLabel="Cancel upload"
                      pendingLabel="Cancelling..."
                      className="rounded-full border border-ink-300 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                      Cancel
                    </ConfirmSubmitButton>
                  </ActionForm>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {total > uploads.length ? (
        <p className="mt-4 text-sm text-ink-600">
          {total - uploads.length} more on Files.
        </p>
      ) : null}
    </section>
  );
}
