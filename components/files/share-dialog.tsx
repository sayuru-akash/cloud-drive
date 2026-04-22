"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ShareLinkForm } from "@/components/share-link-form";

export function ShareDialog({
  fileId,
  open,
  onClose,
}: {
  fileId: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
    }
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-ink-200/80 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink-950">
            Share file
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 transition hover:bg-surface-strong hover:text-ink-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">
          <ShareLinkForm fileId={fileId} />
        </div>
      </div>
    </div>
  );
}
