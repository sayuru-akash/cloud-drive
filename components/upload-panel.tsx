"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UploadPanelProps = {
  folderId: string | null;
};

type UploadState = {
  id: string;
  file: File;
  fileId?: string;
  displayName: string;
  progress: number;
  status:
    | "queued"
    | "uploading"
    | "finalizing"
    | "done"
    | "error"
    | "cancelled";
  message?: string;
};

export function UploadPanel({ folderId }: UploadPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<Record<string, XMLHttpRequest | undefined>>({});
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  function updateUpload(id: string, updater: (current: UploadState) => UploadState) {
    setUploads((current) =>
      current.map((item) => (item.id === id ? updater(item) : item)),
    );
  }

  async function startUpload(upload: UploadState) {
    const uploadId = upload.id;

    updateUpload(uploadId, (current) => ({
      ...current,
      status: "uploading",
      progress: 0,
      message: "Requesting signed upload URL.",
    }));

    try {
      const initRes = await fetch("/api/files/initiate-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId,
          fileName: upload.file.name,
          contentType: upload.file.type || "application/octet-stream",
          sizeBytes: upload.file.size,
        }),
      });

      const initJson = await initRes.json();
      if (!initRes.ok) {
        throw new Error(initJson.error ?? "Upload could not be started.");
      }

      updateUpload(uploadId, (current) => ({
        ...current,
        fileId: initJson.fileId,
        displayName: initJson.displayName ?? current.displayName,
        message:
          initJson.displayName && initJson.displayName !== current.file.name
            ? `Stored as ${initJson.displayName} to avoid a duplicate name.`
            : "Uploading to Backblaze B2.",
      }));

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current[uploadId] = xhr;
        xhr.open("PUT", initJson.uploadUrl, true);
        xhr.setRequestHeader(
          "Content-Type",
          upload.file.type || "application/octet-stream",
        );

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) {
            return;
          }

          const progress = Math.round((event.loaded / event.total) * 100);
          updateUpload(uploadId, (current) => ({
            ...current,
            progress,
            status: "uploading",
          }));
        };

        xhr.onload = () => {
          delete xhrRef.current[uploadId];

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }

          reject(new Error(`Upload failed with status ${xhr.status}.`));
        };

        xhr.onabort = () => {
          delete xhrRef.current[uploadId];
          reject(new Error("Upload cancelled."));
        };

        xhr.onerror = () => {
          delete xhrRef.current[uploadId];
          reject(new Error("Upload failed."));
        };

        xhr.send(upload.file);
      });

      updateUpload(uploadId, (current) => ({
        ...current,
        status: "finalizing",
        progress: 100,
        message: "Verifying object and finalizing metadata.",
      }));

      const completeRes = await fetch(`/api/files/${initJson.fileId}/complete-upload`, {
        method: "POST",
      });
      const completeJson = await completeRes.json();

      if (!completeRes.ok) {
        throw new Error(completeJson.error ?? "Upload finalization failed.");
      }

      updateUpload(uploadId, (current) => ({
        ...current,
        status: "done",
        progress: 100,
        message: "Upload complete.",
      }));

      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected upload error.";

      updateUpload(uploadId, (current) => ({
        ...current,
        status: message === "Upload cancelled." ? "cancelled" : "error",
        message,
      }));
    }
  }

  async function cancelUpload(upload: UploadState) {
    xhrRef.current[upload.id]?.abort();

    if (upload.fileId) {
      await fetch(`/api/files/${upload.fileId}/cancel-upload`, {
        method: "POST",
      }).catch(() => undefined);
    }

    updateUpload(upload.id, (current) => ({
      ...current,
      status: "cancelled",
      message: "Upload cancelled.",
    }));

    router.refresh();
  }

  function queueFiles(fileList: FileList | File[]) {
    const selected = Array.from(fileList).filter((file) => file.size > 0);

    if (selected.length === 0) {
      return;
    }

    const nextUploads = selected.map<UploadState>((file) => ({
      id: crypto.randomUUID(),
      file,
      displayName: file.name,
      progress: 0,
      status: "queued",
    }));

    setUploads((current) => [...nextUploads, ...current]);
    nextUploads.forEach((item) => {
      void Promise.resolve().then(() => startUpload(item));
    });
  }

  return (
    <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
            Uploads
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink-950">
            Direct browser upload to Backblaze B2
          </h2>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
        >
          Select files
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            queueFiles(event.target.files);
          }
          event.currentTarget.value = "";
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragActive(false);
          if (event.dataTransfer.files) {
            queueFiles(event.dataTransfer.files);
          }
        }}
        className={`mt-6 rounded-[1.5rem] border border-dashed p-5 transition ${
          isDragActive
            ? "border-emerald-500 bg-emerald-50"
            : "border-ink-200 bg-surface-strong"
        }`}
      >
        <p className="text-sm leading-7 text-ink-600">
          Drag and drop files here, or use the picker above. Uploads use
          short-lived signed PUT URLs, show live progress, and can be cancelled
          or retried before finalization.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {uploads.length === 0 ? (
          <p className="text-sm leading-7 text-ink-600">
            Your Backblaze B2 bucket must allow your app origin in its CORS
            rules for browser-direct uploads.
          </p>
        ) : null}

        {uploads.map((upload) => (
          <article
            key={upload.id}
            className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-950">{upload.displayName}</p>
                <p className="mt-1 text-xs text-ink-500">
                  {upload.file.name} • {upload.file.size.toLocaleString()} bytes
                </p>
              </div>
              <p className="text-sm text-ink-600">{upload.progress}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-200">
              <div
                className={`h-full rounded-full ${
                  upload.status === "error"
                    ? "bg-red-500"
                    : upload.status === "cancelled"
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                }`}
                style={{ width: `${upload.progress}%` }}
              />
            </div>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-ink-600">
                {upload.message ??
                  (upload.status === "queued"
                    ? "Waiting to start."
                    : upload.status === "finalizing"
                      ? "Verifying upload."
                      : upload.status === "done"
                        ? "Upload complete."
                        : "Uploading.")}
              </p>
              <div className="flex gap-2">
                {upload.status === "uploading" || upload.status === "finalizing" ? (
                  <button
                    type="button"
                    onClick={() => void cancelUpload(upload)}
                    className="rounded-full border border-ink-300 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                  >
                    Cancel
                  </button>
                ) : null}
                {upload.status === "error" || upload.status === "cancelled" ? (
                  <button
                    type="button"
                    onClick={() => void startUpload(upload)}
                    className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-medium text-emerald-800 transition hover:bg-white"
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
