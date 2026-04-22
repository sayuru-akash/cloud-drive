"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function NewFolderDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, visibility: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
    }
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsPending(true);
    onConfirm(trimmed, visibility);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[2rem] border border-ink-200/80 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink-950">
            New folder
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 transition hover:bg-surface-strong hover:text-ink-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            disabled={isPending}
            autoFocus
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 disabled:opacity-50"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            disabled={isPending}
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 disabled:opacity-50"
          >
            <option value="private">Private</option>
            <option value="workspace">Workspace</option>
          </select>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-800 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
