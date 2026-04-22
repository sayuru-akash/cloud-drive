"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  Eye,
  FolderInput,
  Link2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

export type FileAction =
  | "open"
  | "download"
  | "share"
  | "rename"
  | "move"
  | "visibility"
  | "delete";

export function FileActionsMenu({
  actions,
  onAction,
  align = "right",
}: {
  actions: Array<{ type: FileAction; label: string }>;
  onAction: (type: FileAction) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const iconMap: Record<FileAction, React.ReactNode> = {
    open: <Eye className="h-3.5 w-3.5" />,
    download: <Download className="h-3.5 w-3.5" />,
    share: <Link2 className="h-3.5 w-3.5" />,
    rename: <Pencil className="h-3.5 w-3.5" />,
    move: <FolderInput className="h-3.5 w-3.5" />,
    visibility: <Eye className="h-3.5 w-3.5" />,
    delete: <Trash2 className="h-3.5 w-3.5" />,
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex rounded-full border border-ink-300 p-1.5 text-ink-700 transition hover:border-ink-500 hover:bg-white"
        aria-label="Actions"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className={`absolute top-full z-20 mt-1 w-48 overflow-hidden rounded-[1.25rem] border border-ink-200/80 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] ${align === "right" ? "right-0" : "left-0"}`}
        >
          {actions.map((action, index) => (
            <button
              key={action.type}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onAction(action.type);
              }}
              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink-700 transition hover:bg-surface-strong ${action.type === "delete" ? "text-red-700 hover:bg-red-50" : ""} ${index > 0 ? "border-t border-ink-100" : ""}`}
            >
              {iconMap[action.type]}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
