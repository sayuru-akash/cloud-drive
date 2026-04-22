"use client";

import Link from "next/link";
import { FolderOpen, Download, Share2 } from "lucide-react";
import { FileIcon } from "@/components/file-icon";
import { formatBytes, formatDate } from "@/lib/format";
import { InlineRename } from "./inline-rename";
import { FileActionsMenu, type FileAction } from "./file-actions-menu";
import { FileThumbnail } from "./file-thumbnail";

export type DriveGridItem =
  | {
      type: "folder";
      id: string;
      name: string;
      ownerUserId: string;
      visibility: string;
      updatedAt: Date;
    }
  | {
      type: "file";
      id: string;
      displayName: string;
      ownerUserId: string;
      visibility: string;
      updatedAt: Date;
      mimeType: string | null;
      sizeBytes: number | null;
    };

export function FileGridCard({
  item,
  isSelected,
  onToggleSelect,
  isRenaming,
  onRename,
  onCancelRename,
  onAction,
  canEdit,
  canDelete,
}: {
  item: DriveGridItem;
  isSelected: boolean;
  onToggleSelect: (shiftKey?: boolean) => void;
  isRenaming: boolean;
  onRename: (value: string) => void;
  onCancelRename: () => void;
  onAction: (action: Exclude<FileAction, "open" | "download">) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const isFolder = item.type === "folder";
  const name = isFolder ? item.name : item.displayName;

  const menuActions: Array<{ type: FileAction; label: string }> = [];
  if (canEdit) {
    menuActions.push({ type: "rename", label: "Rename" });
    menuActions.push({ type: "move", label: "Move" });
    menuActions.push({
      type: "visibility",
      label: item.visibility === "private" ? "Make workspace" : "Make private",
    });
  }
  if (canDelete) {
    menuActions.push({ type: "delete", label: "Delete" });
  }

  return (
    <div
      onClick={() => onToggleSelect()}
      className={`group relative cursor-pointer rounded-[1.25rem] border transition ${
        isSelected
          ? "border-emerald-300 bg-emerald-50/60"
          : "border-ink-200/60 bg-white/70 hover:border-ink-300 hover:bg-white"
      }`}
    >
      {/* Checkbox */}
      <div
        className={`absolute left-3 top-3 z-10 transition ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(event) => onToggleSelect(event.shiftKey)}
          onChange={() => undefined}
          className="h-4 w-4 rounded border-ink-300 accent-emerald-700"
        />
      </div>

      {/* Actions */}
      <div
        className={`absolute right-3 top-3 z-10 flex items-center gap-1 transition ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {!isFolder && (
          <>
            <a
              href={`/api/files/${item.id}/download`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-ink-300 bg-white/80 p-1.5 text-ink-700 backdrop-blur transition hover:border-ink-500 hover:bg-white"
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => onAction("share")}
              className="inline-flex rounded-full border border-ink-300 bg-white/80 p-1.5 text-ink-700 backdrop-blur transition hover:border-ink-500 hover:bg-white"
              title="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {isFolder && (
          <Link
            href={`/files?folder=${item.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex rounded-full border border-ink-300 bg-white/80 p-1.5 text-ink-700 backdrop-blur transition hover:border-ink-500 hover:bg-white"
            title="Open"
          >
            <FolderOpen className="h-3.5 w-3.5" />
          </Link>
        )}
        {menuActions.length > 0 && (
          <FileActionsMenu
            actions={menuActions}
            onAction={(type) => onAction(type as Exclude<FileAction, "open" | "download">)}
            align="left"
          />
        )}
      </div>

      {/* Thumbnail / Icon area */}
      <div className="flex h-36 items-center justify-center overflow-hidden rounded-t-[1.25rem] bg-surface-strong p-4">
        {isFolder ? (
          <FolderOpen className="h-12 w-12 text-emerald-700/60" />
        ) : (
          <FileThumbnail
            mimeType={item.mimeType}
            className="h-full w-full"
          />
        )}
      </div>

      {/* Info bar */}
      <div className="p-3">
        {isRenaming ? (
          <div onClick={(e) => e.stopPropagation()}>
            <InlineRename
              defaultValue={name}
              onSubmit={onRename}
              onCancel={onCancelRename}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isFolder ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-emerald-700" />
            ) : (
              <FileIcon mimeType={item.mimeType} className="h-4 w-4 shrink-0 text-ink-500" />
            )}
            <span className="min-w-0 truncate text-sm font-medium text-ink-950">
              {name}
            </span>
          </div>
        )}
        <p className="mt-1 text-xs text-ink-500">
          {isFolder
            ? `${formatDate(item.updatedAt)}`
            : `${formatBytes(item.sizeBytes)} \u2022 ${formatDate(item.updatedAt)}`}
        </p>
      </div>
    </div>
  );
}
