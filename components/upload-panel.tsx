"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useActionConfirm } from "@/components/action-ui";

type UploadPanelProps = {
  folderId: string | null;
  compact?: boolean;
};

type UploadState = {
  id: string;
  file: File;
  fileId?: string;
  displayName: string;
  progress: number;
  uploadedBytes: number;
  uploadStrategy?: "single" | "multipart";
  multipartUploadId?: string;
  status:
    | "queued"
    | "uploading"
    | "finalizing"
    | "done"
    | "error"
    | "cancelled";
  message?: string;
};

type InitiateUploadResponse =
  | {
      fileId: string;
      uploadId: string;
      displayName: string;
      method: "PUT";
      uploadStrategy: "single";
      uploadUrl: string;
    }
  | {
      fileId: string;
      uploadId: string;
      displayName: string;
      method: "PUT";
      uploadStrategy: "multipart";
      multipartUploadId: string;
      partSizeBytes: number;
      totalParts: number;
    };

const PART_RETRY_LIMIT = 3;

export function UploadPanel({ folderId, compact }: UploadPanelProps) {
  const router = useRouter();
  const confirm = useActionConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<Record<string, XMLHttpRequest | undefined>>({});
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  function updateUpload(id: string, updater: (current: UploadState) => UploadState) {
    setUploads((current) =>
      current.map((item) => (item.id === id ? updater(item) : item)),
    );
  }

  function parseEtag(raw: string | null) {
    if (!raw) {
      return null;
    }

    return raw.replace(/^"+|"+$/g, "");
  }

  async function uploadSinglePart(
    upload: UploadState,
    initJson: Extract<InitiateUploadResponse, { uploadStrategy: "single" }>,
  ) {
    const uploadId = upload.id;

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

        const loaded = event.loaded;
        const progress = Math.round((loaded / event.total) * 100);
        updateUpload(uploadId, (current) => ({
          ...current,
          uploadedBytes: loaded,
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
  }

  async function uploadMultipartFile(
    upload: UploadState,
    initJson: Extract<InitiateUploadResponse, { uploadStrategy: "multipart" }>,
  ) {
    const parts: Array<{ partNumber: number; etag: string }> = [];

    for (let partNumber = 1; partNumber <= initJson.totalParts; partNumber += 1) {
      const start = (partNumber - 1) * initJson.partSizeBytes;
      const end = Math.min(start + initJson.partSizeBytes, upload.file.size);
      const chunk = upload.file.slice(start, end);
      let completed = false;

      for (let attempt = 1; attempt <= PART_RETRY_LIMIT; attempt += 1) {
        try {
          const partRes = await fetch(`/api/files/${initJson.fileId}/multipart-part`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              multipartUploadId: initJson.multipartUploadId,
              partNumber,
            }),
          });
          const partJson = await partRes.json();

          if (!partRes.ok) {
            throw new Error(partJson.error ?? "Part upload could not be prepared.");
          }

          const baseUploadedBytes = start;

          const etag = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhrRef.current[upload.id] = xhr;
            xhr.open("PUT", partJson.uploadUrl, true);
            xhr.setRequestHeader(
              "Content-Type",
              upload.file.type || "application/octet-stream",
            );

            xhr.upload.onprogress = (event) => {
              if (!event.lengthComputable) {
                return;
              }

              const uploadedBytes = baseUploadedBytes + event.loaded;
              const progress = Math.min(
                100,
                Math.round((uploadedBytes / upload.file.size) * 100),
              );

              updateUpload(upload.id, (current) => ({
                ...current,
                uploadedBytes,
                progress,
                status: "uploading",
                message: `Uploading part ${partNumber} of ${initJson.totalParts}...`,
              }));
            };

            xhr.onload = () => {
              delete xhrRef.current[upload.id];

              if (xhr.status < 200 || xhr.status >= 300) {
                reject(new Error(`Part upload failed with status ${xhr.status}.`));
                return;
              }

              const responseEtag = parseEtag(xhr.getResponseHeader("ETag"));

              if (!responseEtag) {
                reject(new Error("Part upload did not return an ETag."));
                return;
              }

              resolve(responseEtag);
            };

            xhr.onabort = () => {
              delete xhrRef.current[upload.id];
              reject(new Error("Upload cancelled."));
            };

            xhr.onerror = () => {
              delete xhrRef.current[upload.id];
              reject(new Error("Part upload failed."));
            };

            xhr.send(chunk);
          });

          parts.push({ partNumber, etag });
          updateUpload(upload.id, (current) => ({
            ...current,
            uploadedBytes: end,
            progress: Math.min(100, Math.round((end / upload.file.size) * 100)),
            status: "uploading",
            message:
              partNumber === initJson.totalParts
                ? "Finalizing..."
                : `Uploaded ${partNumber} of ${initJson.totalParts} parts`,
          }));
          completed = true;
          break;
        } catch (error) {
          if (error instanceof Error && error.message === "Upload cancelled.") {
            throw error;
          }

          if (attempt === PART_RETRY_LIMIT) {
            throw error;
          }

          updateUpload(upload.id, (current) => ({
            ...current,
            message: `Retrying part ${partNumber}...`,
          }));

          await new Promise((resolve) =>
            window.setTimeout(resolve, attempt * 1000),
          );
        }
      }

      if (!completed) {
        throw new Error("Multipart upload could not be completed.");
      }
    }

    return {
      multipartUploadId: initJson.multipartUploadId,
      parts,
    };
  }

  async function startUpload(upload: UploadState) {
    const uploadId = upload.id;

    updateUpload(uploadId, (current) => ({
      ...current,
      status: "uploading",
      progress: 0,
      message: "Starting upload...",
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

      const initJson = (await initRes.json()) as
        | InitiateUploadResponse
        | { error?: string };
      if (!initRes.ok) {
        const errorMessage =
          "error" in initJson
            ? initJson.error
            : undefined;
        throw new Error(errorMessage ?? "Upload could not be started.");
      }

      if (!("uploadStrategy" in initJson)) {
        throw new Error("Upload setup is invalid.");
      }

      updateUpload(uploadId, (current) => ({
        ...current,
        fileId: initJson.fileId,
        displayName: initJson.displayName ?? current.displayName,
        uploadStrategy: initJson.uploadStrategy,
        multipartUploadId:
          initJson.uploadStrategy === "multipart"
            ? initJson.multipartUploadId
            : undefined,
        message:
          initJson.displayName && initJson.displayName !== current.file.name
            ? `Saved as ${initJson.displayName}`
            : "Uploading...",
      }));

      let completePayload:
        | { uploadStrategy: "single" }
        | {
            uploadStrategy: "multipart";
            multipartUploadId: string;
            parts: Array<{ partNumber: number; etag: string }>;
          } = { uploadStrategy: "single" };

      if (initJson.uploadStrategy === "multipart") {
        completePayload = {
          uploadStrategy: "multipart",
          ...(await uploadMultipartFile(upload, initJson)),
        };
      } else {
        await uploadSinglePart(upload, initJson);
      }

      updateUpload(uploadId, (current) => ({
        ...current,
        status: "finalizing",
        progress: 100,
        uploadedBytes: upload.file.size,
        message: "Finalizing...",
      }));

      const completeRes = await fetch(`/api/files/${initJson.fileId}/complete-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completePayload),
      });
      const completeJson = await completeRes.json();

      if (!completeRes.ok) {
        throw new Error(completeJson.error ?? "Upload finalization failed.");
      }

      updateUpload(uploadId, (current) => ({
        ...current,
        status: "done",
        progress: 100,
        message: "Done",
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
    const accepted = await confirm({
      title: "Cancel upload?",
      description: "This upload will stop and the pending item will be removed.",
      confirmLabel: "Cancel upload",
      tone: "danger",
    });

    if (!accepted) {
      return;
    }

    xhrRef.current[upload.id]?.abort();

    if (upload.fileId) {
      await fetch(`/api/files/${upload.fileId}/cancel-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          multipartUploadId: upload.multipartUploadId,
        }),
      }).catch(() => undefined);
    }

    updateUpload(upload.id, (current) => ({
      ...current,
      status: "cancelled",
      message: "Cancelled",
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
      uploadedBytes: 0,
      status: "queued",
    }));

    setUploads((current) => [...nextUploads, ...current]);
    nextUploads.forEach((item) => {
      void Promise.resolve().then(() => startUpload(item));
    });
  }

  const uploadContent = (
    <>
      <div id="live-upload-queue" />
      <div className={`flex items-center gap-2 ${compact ? "" : "flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"}`}>
        {!compact && (
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
              Uploads
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink-950">
              Live queue
            </h2>
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`inline-flex items-center justify-center gap-2 rounded-full bg-ink-950 text-sm font-medium text-white transition hover:bg-ink-800 ${compact ? "px-4 py-2" : "px-5 py-3"}`}
        >
          <Upload className="h-4 w-4" />
          {compact ? "Upload" : "Select files"}
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
        className={`border border-dashed text-center transition ${
          isDragActive
            ? "border-emerald-500 bg-emerald-50"
            : "border-ink-200 bg-surface-strong"
        } ${compact ? "mt-2 rounded-xl p-2" : "mt-6 rounded-[1.5rem] p-6"}`}
      >
        <p className={`text-ink-600 ${compact ? "text-xs" : "text-sm"}`}>
          {compact ? "Drop files here" : "Drop files here or use Select files."}
        </p>
      </div>

      <div className={`space-y-4 ${compact ? "mt-3" : "mt-6"}`}>
        {uploads.map((upload) => (
          <article
            key={upload.id}
            className={`border border-ink-200/80 bg-surface-strong ${compact ? "rounded-xl p-2.5" : "rounded-[1.5rem] p-4"}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className={`truncate font-medium text-ink-950 ${compact ? "text-xs" : "text-sm"}`}>{upload.displayName}</p>
                <p className={`text-ink-500 ${compact ? "text-[10px]" : "mt-1 text-xs"}`}>
                  {upload.file.name} • {(upload.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <p className={`text-ink-600 ${compact ? "text-xs" : "text-sm"}`}>{upload.progress}%</p>
            </div>
            <div className={`h-2 overflow-hidden rounded-full bg-ink-200 ${compact ? "mt-1.5" : "mt-3"}`}>
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
            <div className={`flex items-center justify-between ${compact ? "mt-1.5 gap-2" : "mt-3 flex-col gap-3 md:flex-row md:items-center"}`}>
              <p className={`text-ink-600 ${compact ? "text-[10px]" : "text-sm"}`}>
                {upload.message ??
                  (upload.status === "queued"
                    ? "Waiting..."
                    : upload.status === "finalizing"
                      ? "Finalizing..."
                      : upload.status === "done"
                        ? "Done"
                        : "Uploading...")}
              </p>
              <div className="flex gap-2">
                {upload.status === "uploading" || upload.status === "finalizing" ? (
                  <button
                    type="button"
                    onClick={() => void cancelUpload(upload)}
                    className={`rounded-full border border-ink-300 font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white ${compact ? "px-2.5 py-1 text-[10px]" : "px-4 py-2 text-xs"}`}
                  >
                    Cancel
                  </button>
                ) : null}
                {upload.status === "error" || upload.status === "cancelled" ? (
                  <button
                    type="button"
                    onClick={() => void startUpload(upload)}
                    className={`rounded-full border border-emerald-300 font-medium text-emerald-800 transition hover:bg-white ${compact ? "px-2.5 py-1 text-[10px]" : "px-4 py-2 text-xs"}`}
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );

  if (compact) {
    return uploadContent;
  }

  return (
    <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
      {uploadContent}
    </section>
  );
}
