"use client";

import { useRef, useState } from "react";

type UploadPanelProps = {
  folderId: string | null;
};

type UploadState = {
  fileName: string;
  progress: number;
  status: "idle" | "uploading" | "finalizing" | "done" | "error";
  message?: string;
};

export function UploadPanel({ folderId }: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);

  async function startUpload(file: File) {
    setUploads((current) => [
      {
        fileName: file.name,
        progress: 0,
        status: "uploading",
      },
      ...current,
    ]);

    try {
      const initRes = await fetch("/api/files/initiate-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });

      const initJson = await initRes.json();
      if (!initRes.ok) {
        throw new Error(initJson.error ?? "Upload could not be started.");
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", initJson.uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) {
            return;
          }

          const progress = Math.round((event.loaded / event.total) * 100);
          setUploads((current) =>
            current.map((item) =>
              item.fileName === file.name
                ? { ...item, progress, status: "uploading" }
                : item,
            ),
          );
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }

          reject(new Error(`Upload failed with status ${xhr.status}.`));
        };

        xhr.onerror = () => reject(new Error("Upload failed."));
        xhr.send(file);
      });

      setUploads((current) =>
        current.map((item) =>
          item.fileName === file.name
            ? { ...item, status: "finalizing", progress: 100 }
            : item,
        ),
      );

      const completeRes = await fetch(`/api/files/${initJson.fileId}/complete-upload`, {
        method: "POST",
      });
      const completeJson = await completeRes.json();

      if (!completeRes.ok) {
        throw new Error(completeJson.error ?? "Upload finalization failed.");
      }

      setUploads((current) =>
        current.map((item) =>
          item.fileName === file.name
            ? { ...item, status: "done", progress: 100, message: "Upload complete." }
            : item,
        ),
      );

      window.location.reload();
    } catch (error) {
      setUploads((current) =>
        current.map((item) =>
          item.fileName === file.name
            ? {
                ...item,
                status: "error",
                message:
                  error instanceof Error ? error.message : "Unexpected upload error.",
              }
            : item,
        ),
      );
    }
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
          Select file
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) {
            void startUpload(selected);
          }
          event.currentTarget.value = "";
        }}
      />

      <div className="mt-6 space-y-4">
        {uploads.length === 0 ? (
          <p className="text-sm leading-7 text-ink-600">
            Uploads are issued as short-lived signed PUT URLs. Make sure your
            bucket CORS rules allow your app origin for the S3-compatible API.
          </p>
        ) : null}

        {uploads.map((upload) => (
          <article
            key={`${upload.fileName}-${upload.status}`}
            className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="font-medium text-ink-950">{upload.fileName}</p>
              <p className="text-sm text-ink-600">{upload.progress}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-200">
              <div
                className={`h-full rounded-full ${
                  upload.status === "error" ? "bg-red-500" : "bg-emerald-600"
                }`}
                style={{ width: `${upload.progress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-ink-600">
              {upload.message ??
                (upload.status === "finalizing"
                  ? "Verifying object and finalizing metadata."
                  : upload.status === "uploading"
                    ? "Uploading to storage."
                    : upload.status === "done"
                      ? "Upload complete."
                      : "Waiting.")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
