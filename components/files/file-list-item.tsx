"use client";

import Link from "next/link";
import { FolderOpen, Download, Share2 } from "lucide-react";
import { FileIcon } from "@/components/file-icon";
import { formatBytes, formatDate } from "@/lib/format";
import { InlineRename } from "./inline-rename";
import { FileActionsMenu, type FileAction } from "./file-actions-menu";

export type DriveListItem =
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

export function FileListItem({
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
  item: DriveListItem;
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
      className={`group grid cursor-pointer grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-[1.25rem] border px-4 py-3 transition lg:grid-cols-[2rem_1fr_6rem_5rem_8rem_7rem] ${
        isSelected
          ? "border-emerald-300 bg-emerald-50/60"
          : "border-ink-200/60 bg-white/70 hover:border-ink-300 hover:bg-white"
      }`}
    >
      {/* Checkbox */}
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(event) => onToggleSelect(event.shiftKey)}
          onChange={() => undefined}
          className="h-4 w-4 rounded border-ink-300 accent-emerald-700"
        />
      </div>

      {/* Name */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {isFolder ? (
            <FolderOpen className="h-5 w-5 shrink-0 text-emerald-700" />
          ) : (
            <FileIcon mimeType={item.mimeType} className="h-5 w-5 shrink-0 text-ink-500" />
          )}
          {isRenaming ? (
            <div onClick={(e) => e.stopPropagation()} className="min-w-0 flex-1">
              <InlineRename
                defaultValue={name}
                onSubmit={onRename}
                onCancel={onCancelRename}
              />
            </div>
          ) : isFolder ? (
            <Link
              href={`/files?folder=${item.id}`}
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 truncate font-medium text-ink-950 underline-offset-4 hover:underline"
            >
              {name}
            </Link>
          ) : (
            <a
              href={`/api/files/${item.id}/download`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 truncate font-medium text-ink-950 underline-offset-4 hover:underline"
            >
              {name}
            </a>
          )}
        </div>
        <p className="mt-0.5 text-xs text-ink-500 lg:hidden">
          {isFolder
            ? `${formatDate(item.updatedAt)}`
            : `${formatBytes(item.sizeBytes)} \u2022 ${formatDate(item.updatedAt)}`}
        </p>
      </div>

      {/* Size */}
      <span className="hidden text-sm text-ink-500 lg:block">
        {isFolder ? "\u2014" : formatBytes(item.sizeBytes)}
      </span>

      {/* Visibility */}
      <span className="hidden lg:flex lg:justify-center">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            item.visibility === "workspace"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-ink-100 text-ink-700"
          }`}
        >
          {item.visibility}
        </span>
      </span>

      {/* Modified */}
      <span className="hidden text-sm text-ink-500 lg:block">
        {formatDate(item.updatedAt)}
      </span>

      {/* Actions */}
      <div
        className="flex items-center justify-end gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {isFolder ? (
          <Link
            href={`/files?folder=${item.id}`}
            className="inline-flex rounded-full border border-ink-300 p-1.5 text-ink-700 transition hover:border-ink-500 hover:bg-white"
            title="Open"
          >
            <FolderOpen className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <>
            <a
              href={`/api/files/${item.id}/download`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-ink-300 p-1.5 text-ink-700 transition hover:border-ink-500 hover:bg-white"
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => onAction("share")}
              className="inline-flex rounded-full border border-ink-300 p-1.5 text-ink-700 transition hover:border-ink-500 hover:bg-white"
              title="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={() => onAction("delete")}
            className="inline-flex rounded-full border border-ink-300 p-1.5 text-ink-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            title="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        )}

        {menuActions.length > 0 && (
          <FileActionsMenu
            actions={menuActions}
            onAction={(type) => onAction(type as Exclude<FileAction, "open" | "download">)}
            align="right"
          />
        )}
      </div>
    </div>
  );
}
