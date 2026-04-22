"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

type UploadState = {
  id: string;
  file: File;
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

export function UploadQueue({
  uploads,
  onCancel,
  onRetry,
  onClearDone,
}: {
  uploads: UploadState[];
  onCancel: (upload: UploadState) => void;
  onRetry: (upload: UploadState) => void;
  onClearDone: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const active = uploads.filter(
    (u) => u.status !== "done" && u.status !== "cancelled",
  );
  const done = uploads.filter(
    (u) => u.status === "done" || u.status === "cancelled",
  );

  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-[1.5rem] border border-ink-200/80 bg-white/95 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-medium text-ink-950">
          {active.length > 0
            ? `${active.length} uploading`
            : `${done.length} done`}
        </span>
        <div className="flex items-center gap-1">
          {done.length > 0 && active.length === 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearDone();
              }}
              className="rounded-full p-1 text-ink-400 transition hover:bg-surface-strong hover:text-ink-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-ink-500" />
          ) : (
            <ChevronUp className="h-4 w-4 text-ink-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="max-h-72 space-y-2 overflow-y-auto border-t border-ink-200/60 px-4 pb-4 pt-2">
          {uploads.map((upload) => (
            <div key={upload.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-medium text-ink-950">
                  {upload.displayName}
                </p>
                <span className="shrink-0 text-[10px] text-ink-500">
                  {upload.progress}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-200">
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
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-ink-500">
                  {upload.message ??
                    (upload.status === "queued"
                      ? "Waiting..."
                      : upload.status === "finalizing"
                        ? "Finalizing..."
                        : upload.status === "done"
                          ? "Done"
                          : "Uploading...")}
                </p>
                <div className="flex gap-1">
                  {upload.status === "uploading" ||
                  upload.status === "finalizing" ? (
                    <button
                      type="button"
                      onClick={() => onCancel(upload)}
                      className="rounded-full border border-ink-300 px-2 py-0.5 text-[10px] font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                    >
                      Cancel
                    </button>
                  ) : null}
                  {upload.status === "error" ||
                  upload.status === "cancelled" ? (
                    <button
                      type="button"
                      onClick={() => onRetry(upload)}
                      className="rounded-full border border-emerald-300 px-2 py-0.5 text-[10px] font-medium text-emerald-800 transition hover:bg-white"
                    >
                      Retry
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
