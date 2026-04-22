"use client";

import { useRef, useState, useCallback } from "react";
import { useActionConfirm } from "@/components/action-ui";

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
  // Retry state
  uploadUrl?: string;
  multipartUploadId?: string;
  partSizeBytes?: number;
  totalParts?: number;
};

export function useUploadQueue(folderId: string | null) {
  const confirm = useActionConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<Record<string, XMLHttpRequest | undefined>>({});
  const abortControllerRef = useRef<Record<string, AbortController | undefined>>({});
  const cancelledIdsRef = useRef<Set<string>>(new Set());
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const updateUpload = useCallback(
    (id: string, updater: (current: UploadState) => UploadState) => {
      setUploads((current) =>
        current.map((item) => (item.id === id ? updater(item) : item)),
      );
    },
    [],
  );

  const uploadChunk = useCallback(
    (
      uploadId: string,
      url: string,
      chunk: Blob,
      onProgress: (loaded: number) => void,
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current[uploadId] = xhr;
        xhr.open("PUT", url, true);
        xhr.setRequestHeader(
          "Content-Type",
          chunk.type || "application/octet-stream",
        );

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(event.loaded);
          }
        };

        xhr.onload = () => {
          delete xhrRef.current[uploadId];
          if (xhr.status >= 200 && xhr.status < 300) {
            const etag = xhr.getResponseHeader("ETag") ?? "";
            resolve(etag.replace(/"/g, ""));
            return;
          }
          reject(new Error(`Part upload failed: ${xhr.status}`));
        };

        xhr.onabort = () => {
          delete xhrRef.current[uploadId];
          reject(new Error("Upload cancelled."));
        };

        xhr.onerror = () => {
          delete xhrRef.current[uploadId];
          reject(new Error("Upload failed."));
        };

        xhr.send(chunk);
      });
    },
    [],
  );

  const startUpload = useCallback(
    async (upload: UploadState) => {
      const uploadId = upload.id;

      if (cancelledIdsRef.current.has(uploadId)) {
        return;
      }

      // Reuse initiated state on retry
      let fileId = upload.fileId;
      let displayName = upload.displayName;
      let uploadUrl = upload.uploadUrl;
      let multipartUploadId = upload.multipartUploadId;
      let partSizeBytes = upload.partSizeBytes;
      let totalParts = upload.totalParts;

      // Step 1: Initiate upload if needed
      if (!fileId) {
        updateUpload(uploadId, (current) => ({
          ...current,
          status: "uploading",
          progress: 0,
          message: "Starting upload...",
        }));

        try {
          const controller = new AbortController();
          abortControllerRef.current[uploadId] = controller;

          const initRes = await fetch("/api/files/initiate-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folderId,
              fileName: upload.file.name,
              contentType: upload.file.type || "application/octet-stream",
              sizeBytes: upload.file.size,
            }),
            signal: controller.signal,
          });

          delete abortControllerRef.current[uploadId];

          const initJson = await initRes.json();
          if (!initRes.ok) {
            throw new Error(initJson.error ?? "Upload could not be started.");
          }

          fileId = initJson.fileId;
          displayName = initJson.displayName ?? upload.file.name;
          uploadUrl = initJson.uploadUrl;
          multipartUploadId = initJson.multipartUploadId;
          partSizeBytes = initJson.partSizeBytes;
          totalParts = initJson.totalParts;

          updateUpload(uploadId, (current) => ({
            ...current,
            fileId,
            displayName,
            uploadUrl,
            multipartUploadId,
            partSizeBytes,
            totalParts,
            message:
              initJson.displayName && initJson.displayName !== current.file.name
                ? `Saved as ${initJson.displayName}`
                : "Uploading...",
          }));
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }
          const message =
            error instanceof Error ? error.message : "Upload initiation failed.";
          updateUpload(uploadId, (current) => ({
            ...current,
            status: "error",
            message,
          }));
          return;
        }
      }

      if (cancelledIdsRef.current.has(uploadId)) {
        return;
      }

      // Step 2: Upload data
      try {
        if (multipartUploadId && partSizeBytes && totalParts) {
          // Multipart upload
          const parts: Array<{ partNumber: number; etag: string }> = [];

          for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            if (cancelledIdsRef.current.has(uploadId)) {
              throw new Error("Upload cancelled.");
            }

            const start = (partNumber - 1) * partSizeBytes;
            const end = Math.min(start + partSizeBytes, upload.file.size);
            const chunk = upload.file.slice(start, end);

            updateUpload(uploadId, (current) => ({
              ...current,
              message: `Uploading part ${partNumber} of ${totalParts}...`,
            }));

            // Get presigned URL for this part
            const controller = new AbortController();
            abortControllerRef.current[uploadId] = controller;

            const partRes = await fetch(
              `/api/files/${fileId}/multipart-part`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ multipartUploadId, partNumber }),
                signal: controller.signal,
              },
            );

            delete abortControllerRef.current[uploadId];

            const partJson = await partRes.json();
            if (!partRes.ok) {
              throw new Error(partJson.error ?? "Part URL failed.");
            }

            // Upload chunk
            const etag = await uploadChunk(
              uploadId,
              partJson.uploadUrl,
              chunk,
              (loaded) => {
                const bytesUploaded = start + loaded;
                const progress = Math.round(
                  (bytesUploaded / upload.file.size) * 100,
                );
                updateUpload(uploadId, (current) => ({
                  ...current,
                  progress,
                }));
              },
            );

            parts.push({ partNumber, etag });
          }

          // Step 3: Complete multipart
          updateUpload(uploadId, (current) => ({
            ...current,
            status: "finalizing",
            progress: 100,
            message: "Finalizing...",
          }));

          const controller = new AbortController();
          abortControllerRef.current[uploadId] = controller;

          const completeRes = await fetch(
            `/api/files/${fileId}/complete-upload`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uploadStrategy: "multipart",
                multipartUploadId,
                parts,
              }),
              signal: controller.signal,
            },
          );

          delete abortControllerRef.current[uploadId];

          const completeJson = await completeRes.json();
          if (!completeRes.ok) {
            throw new Error(completeJson.error ?? "Upload finalization failed.");
          }
        } else if (uploadUrl) {
          // Single upload via XHR
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhrRef.current[uploadId] = xhr;
            xhr.open("PUT", uploadUrl, true);
            xhr.setRequestHeader(
              "Content-Type",
              upload.file.type || "application/octet-stream",
            );

            xhr.upload.onprogress = (event) => {
              if (!event.lengthComputable) return;
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

          // Complete single upload
          updateUpload(uploadId, (current) => ({
            ...current,
            status: "finalizing",
            progress: 100,
            message: "Finalizing...",
          }));

          const controller = new AbortController();
          abortControllerRef.current[uploadId] = controller;

          const completeRes = await fetch(
            `/api/files/${fileId}/complete-upload`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uploadStrategy: "single" }),
              signal: controller.signal,
            },
          );

          delete abortControllerRef.current[uploadId];

          const completeJson = await completeRes.json();
          if (!completeRes.ok) {
            throw new Error(completeJson.error ?? "Upload finalization failed.");
          }
        } else {
          throw new Error("No upload strategy available.");
        }

        updateUpload(uploadId, (current) => ({
          ...current,
          status: "done",
          progress: 100,
          message: "Done",
        }));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Unexpected upload error.";
        updateUpload(uploadId, (current) => ({
          ...current,
          status: message === "Upload cancelled." ? "cancelled" : "error",
          message,
        }));
      }
    },
    [folderId, updateUpload, uploadChunk],
  );

  const cancelUpload = useCallback(
    async (upload: UploadState) => {
      const accepted = await confirm({
        title: "Cancel upload?",
        description:
          "This upload will stop and the pending item will be removed.",
        confirmLabel: "Cancel upload",
        tone: "danger",
      });

      if (!accepted) return;

      cancelledIdsRef.current.add(upload.id);
      xhrRef.current[upload.id]?.abort();
      abortControllerRef.current[upload.id]?.abort();

      if (upload.fileId) {
        await fetch(`/api/files/${upload.fileId}/cancel-upload`, {
          method: "POST",
        }).catch(() => undefined);
      }

      updateUpload(upload.id, (current) => ({
        ...current,
        status: "cancelled",
        message: "Cancelled",
      }));
    },
    [confirm, updateUpload],
  );

  const queueFiles = useCallback(
    (fileList: FileList | File[]) => {
      const selected = Array.from(fileList).filter((file) => file.size > 0);
      if (selected.length === 0) return;

      const nextUploads = selected.map<UploadState>((file) => ({
        id: crypto.randomUUID(),
        file,
        displayName: file.name,
        progress: 0,
        status: "queued",
      }));

      setUploads((current) => [...nextUploads, ...current]);
      nextUploads.forEach((item) => {
        cancelledIdsRef.current.delete(item.id);
        void Promise.resolve().then(() => startUpload(item));
      });
    },
    [startUpload],
  );

  const retryUpload = useCallback(
    (upload: UploadState) => {
      cancelledIdsRef.current.delete(upload.id);
      updateUpload(upload.id, (current) => ({
        ...current,
        status: "queued",
        progress: 0,
        message: "Retrying...",
      }));
      void Promise.resolve().then(() => startUpload(upload));
    },
    [startUpload, updateUpload],
  );

  const clearDone = useCallback(() => {
    setUploads((current) =>
      current.filter((u) => u.status !== "done" && u.status !== "cancelled"),
    );
  }, []);

  const activeCount = uploads.filter(
    (u) => u.status !== "done" && u.status !== "cancelled",
  ).length;

  return {
    uploads,
    isDragActive,
    setIsDragActive,
    fileInputRef,
    queueFiles,
    cancelUpload,
    retryUpload,
    clearDone,
    activeCount,
    hasUploads: uploads.length > 0,
  };
}
