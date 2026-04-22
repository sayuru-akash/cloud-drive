"use client";

import { EmptyState } from "./empty-state";
import { FileListItem } from "./file-list-item";
import { FileGridCard } from "./file-grid-card";
import type { FileAction } from "./file-actions-menu";

type FolderItem = {
  id: string;
  name: string;
  ownerUserId: string;
  visibility: string;
  updatedAt: Date;
};

type FileItem = {
  id: string;
  displayName: string;
  ownerUserId: string;
  visibility: string;
  updatedAt: Date;
  mimeType: string | null;
  sizeBytes: number | null;
};

export function FilesContent({
  folders,
  files,
  viewMode,
  query,
  isSelected,
  onToggleSelect,
  renamingId,
  onRename,
  onCancelRename,
  onAction,
  canManage,
}: {
  folders: FolderItem[];
  files: FileItem[];
  viewMode: "list" | "grid";
  query?: string;
  isSelected: (id: string) => boolean;
  onToggleSelect: (id: string, shiftKey?: boolean) => void;
  renamingId: string | null;
  onRename: (id: string, type: "file" | "folder", value: string) => void;
  onCancelRename: () => void;
  onAction: (
    id: string,
    type: "file" | "folder",
    action: Exclude<FileAction, "open" | "download">,
  ) => void;
  canManage: (ownerUserId: string) => boolean;
}) {
  const totalItems = folders.length + files.length;

  if (totalItems === 0) {
    return (
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
        <EmptyState
          variant={query ? "no-results" : "empty-folder"}
          query={query}
          onClear={
            query
              ? () => {
                  window.location.href = window.location.pathname;
                }
              : undefined
          }
        />
      </section>
    );
  }

  if (viewMode === "grid") {
    return (
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
          {folders.map((folder) => (
            <FileGridCard
              key={folder.id}
              item={{ type: "folder", ...folder }}
              isSelected={isSelected(folder.id)}
              onToggleSelect={(shift) => onToggleSelect(folder.id, shift)}
              isRenaming={renamingId === folder.id}
              onRename={(value) => onRename(folder.id, "folder", value)}
              onCancelRename={onCancelRename}
              onAction={(action) => onAction(folder.id, "folder", action)}
              canEdit={canManage(folder.ownerUserId)}
              canDelete={canManage(folder.ownerUserId)}
            />
          ))}
          {files.map((file) => (
            <FileGridCard
              key={file.id}
              item={{ type: "file", ...file }}
              isSelected={isSelected(file.id)}
              onToggleSelect={(shift) => onToggleSelect(file.id, shift)}
              isRenaming={renamingId === file.id}
              onRename={(value) => onRename(file.id, "file", value)}
              onCancelRename={onCancelRename}
              onAction={(action) => onAction(file.id, "file", action)}
              canEdit={canManage(file.ownerUserId)}
              canDelete={canManage(file.ownerUserId)}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
      <div className="hidden grid-cols-[2rem_1fr_6rem_5rem_8rem_7rem] gap-3 px-4 pb-2 text-xs uppercase tracking-[0.18em] text-ink-500 lg:grid">
        <span />
        <span>Name</span>
        <span>Size</span>
        <span className="text-center">Visibility</span>
        <span>Modified</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="flex flex-col gap-2">
        {folders.map((folder) => (
          <FileListItem
            key={folder.id}
            item={{ type: "folder", ...folder }}
            isSelected={isSelected(folder.id)}
            onToggleSelect={(shift) => onToggleSelect(folder.id, shift)}
            isRenaming={renamingId === folder.id}
            onRename={(value) => onRename(folder.id, "folder", value)}
            onCancelRename={onCancelRename}
            onAction={(action) => onAction(folder.id, "folder", action)}
            canEdit={canManage(folder.ownerUserId)}
            canDelete={canManage(folder.ownerUserId)}
          />
        ))}
        {files.map((file) => (
          <FileListItem
            key={file.id}
            item={{ type: "file", ...file }}
            isSelected={isSelected(file.id)}
            onToggleSelect={(shift) => onToggleSelect(file.id, shift)}
            isRenaming={renamingId === file.id}
            onRename={(value) => onRename(file.id, "file", value)}
            onCancelRename={onCancelRename}
            onAction={(action) => onAction(file.id, "file", action)}
            canEdit={canManage(file.ownerUserId)}
            canDelete={canManage(file.ownerUserId)}
          />
        ))}
      </div>
    </section>
  );
}
