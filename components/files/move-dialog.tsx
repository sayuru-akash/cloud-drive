"use client";

import { useEffect, useRef, useState } from "react";
import { Folder, X } from "lucide-react";
import type { FolderNode } from "@/lib/drive";

function FolderTreeItem({
  node,
  selectedId,
  onSelect,
  disabledId,
  depth = 0,
}: {
  node: FolderNode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  disabledId?: string | null;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isDisabled = disabledId === node.id;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => !isDisabled && onSelect(node.id)}
        disabled={isDisabled}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
          isSelected
            ? "bg-emerald-50 font-medium text-emerald-900"
            : isDisabled
              ? "cursor-not-allowed text-ink-300"
              : "text-ink-700 hover:bg-surface-strong"
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center text-ink-400"
          >
            {expanded ? "−" : "+"}
          </span>
        )}
        {!hasChildren && <span className="h-4 w-4 shrink-0" />}
        <Folder className="h-4 w-4 shrink-0 text-ink-400" />
        <span className="truncate">{node.name}</span>
      </button>
      {expanded &&
        node.children.map((child) => (
          <FolderTreeItem
            key={child.id}
            node={child}
            selectedId={selectedId}
            onSelect={onSelect}
            disabledId={disabledId}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

function MoveDialogContent({
  onClose,
  title,
  folderTree,
  currentFolderId,
  onConfirm,
}: {
  onClose: () => void;
  title: string;
  folderTree: FolderNode[];
  currentFolderId?: string | null;
  onConfirm: (targetFolderId: string | null) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-[2rem] border border-ink-200/80 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)]"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink-950">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 transition hover:bg-surface-strong hover:text-ink-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto rounded-[1.25rem] border border-ink-200/60 bg-surface-strong p-2">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
              selectedId === null
                ? "bg-emerald-50 font-medium text-emerald-900"
                : "text-ink-700 hover:bg-white"
            }`}
          >
            <Folder className="h-4 w-4 shrink-0 text-ink-400" />
            Root
          </button>
          {folderTree.map((node) => (
            <FolderTreeItem
              key={node.id}
              node={node}
              selectedId={selectedId}
              onSelect={setSelectedId}
              disabledId={currentFolderId ?? undefined}
            />
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedId)}
            className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}

export function MoveDialog({
  open,
  onClose,
  title,
  folderTree,
  currentFolderId,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  folderTree: FolderNode[];
  currentFolderId?: string | null;
  onConfirm: (targetFolderId: string | null) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <MoveDialogContent
      onClose={onClose}
      title={title}
      folderTree={folderTree}
      currentFolderId={currentFolderId}
      onConfirm={onConfirm}
    />
  );
}
