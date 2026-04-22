"use client";

import { X, FolderInput, Trash2 } from "lucide-react";

export function BulkActionBar({
  count,
  onClear,
  onMove,
  onDelete,
}: {
  count: number;
  onClear: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-[2rem] border border-ink-200/80 bg-white/90 px-6 py-3 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
      <span className="text-sm font-medium text-ink-950">
        {count} selected
      </span>
      <div className="h-4 w-px bg-ink-200" />
      <button
        type="button"
        onClick={onMove}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
      >
        <FolderInput className="h-3.5 w-3.5" />
        Move
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
      <div className="h-4 w-px bg-ink-200" />
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-1.5 text-ink-400 transition hover:bg-surface-strong hover:text-ink-700"
        title="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
