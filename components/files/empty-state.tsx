"use client";

import { FolderOpen, Search, Upload } from "lucide-react";
import Link from "next/link";

export function EmptyState({
  variant,
  query,
  onClear,
}: {
  variant: "empty-folder" | "no-results" | "no-files";
  query?: string;
  onClear?: () => void;
}) {
  if (variant === "no-results") {
    return (
      <div className="py-12 text-center">
        <Search className="mx-auto h-8 w-8 text-ink-300" />
        <p className="mt-4 text-lg font-medium text-ink-950">
          No results{query ? ` for "${query}"` : ""}
        </p>
        <p className="mt-2 text-sm text-ink-600">
          Try a different search term or clear filters.
        </p>
        {onClear && (
          <button
            onClick={onClear}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
          >
            Clear search
          </button>
        )}
      </div>
    );
  }

  if (variant === "empty-folder") {
    return (
      <div className="py-12 text-center">
        <FolderOpen className="mx-auto h-8 w-8 text-ink-300" />
        <p className="mt-4 text-lg font-medium text-ink-950">This folder is empty</p>
        <p className="mt-2 text-sm text-ink-600">
          Upload files or create a folder to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      <Upload className="mx-auto h-8 w-8 text-ink-300" />
      <p className="mt-4 text-lg font-medium text-ink-950">No files yet</p>
      <p className="mt-2 text-sm text-ink-600">
        Head to{" "}
        <Link href="/files" className="text-emerald-800 underline underline-offset-4">
          Files
        </Link>{" "}
        to upload your first document.
      </p>
    </div>
  );
}
