"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FolderNode } from "@/lib/drive";
import {
  renameFileAction,
  renameFolderAction,
  softDeleteFileAction,
  softDeleteFolderAction,
  updateFileVisibilityAction,
  updateFolderVisibilityAction,
  bulkDeleteFilesAction,
  bulkMoveFilesAction,
} from "@/app/(workspace)/files/actions";
import { useSelection } from "./selection-hooks";
import { FilesToolbar } from "./files-toolbar";
import { FilesSidebar, type PendingUpload } from "./files-sidebar";
import { FilesContent } from "./files-content";
import { BulkActionBar } from "./bulk-action-bar";
import { MoveDialog } from "./move-dialog";
import { ShareDialog } from "./share-dialog";
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

export function FilesShell({
  userId,
  userRole,
  folderId,
  breadcrumbs,
  folders,
  files,
  availableFileTypes,
  folderTree,
  pendingUploads,
  params,
}: {
  userId: string;
  userRole: string | null;
  folderId: string | null;
  breadcrumbs: Array<{ id: string; name: string }>;
  folders: FolderItem[];
  files: FileItem[];
  availableFileTypes: string[];
  folderTree: FolderNode[];
  pendingUploads: PendingUpload[];
  params: {
    q?: string;
    type?: string;
    visibility?: string;
    sort?: string;
  };
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [shareFileId, setShareFileId] = useState<string | null>(null);

  const items = useMemo(
    () => [
      ...folders.map((f) => ({ id: f.id, type: "folder" as const })),
      ...files.map((f) => ({ id: f.id, type: "file" as const })),
    ],
    [folders, files],
  );

  const selection = useSelection(items);

  const canManage = useCallback(
    (ownerUserId: string) => {
      return (
        userId === ownerUserId ||
        ["admin", "super_admin"].includes(userRole ?? "")
      );
    },
    [userId, userRole],
  );

  async function handleRename(
    id: string,
    type: "file" | "folder",
    value: string,
  ) {
    try {
      const formData = new FormData();
      formData.append(type === "file" ? "fileId" : "folderId", id);
      formData.append("name", value);
      if (type === "file") {
        await renameFileAction(formData);
      } else {
        await renameFolderAction(formData);
      }
      setRenamingId(null);
      router.refresh();
    } catch (e) {
      console.error("Rename failed:", e);
    }
  }

  async function handleVisibility(id: string, type: "file" | "folder") {
    try {
      const item =
        type === "file"
          ? files.find((f) => f.id === id)
          : folders.find((f) => f.id === id);
      if (!item) return;
      const next = item.visibility === "private" ? "workspace" : "private";
      const formData = new FormData();
      formData.append(type === "file" ? "fileId" : "folderId", id);
      formData.append("visibility", next);
      if (type === "file") {
        await updateFileVisibilityAction(formData);
      } else {
        await updateFolderVisibilityAction(formData);
      }
      router.refresh();
    } catch (e) {
      console.error("Visibility update failed:", e);
    }
  }

  async function handleDelete(id: string, type: "file" | "folder") {
    try {
      const formData = new FormData();
      formData.append(type === "file" ? "fileId" : "folderId", id);
      if (type === "file") {
        await softDeleteFileAction(formData);
      } else {
        await softDeleteFolderAction(formData);
      }
      router.refresh();
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }

  async function handleBulkDelete() {
    try {
      const formData = new FormData();
      for (const id of selection.selectedFileIds) formData.append("fileId", id);
      for (const id of selection.selectedFolderIds)
        formData.append("folderId", id);
      await bulkDeleteFilesAction(formData);
      selection.clearAll();
      router.refresh();
    } catch (e) {
      console.error("Bulk delete failed:", e);
    }
  }

  async function handleBulkMove(targetFolderId: string | null) {
    try {
      const formData = new FormData();
      for (const id of selection.selectedFileIds) formData.append("fileId", id);
      for (const id of selection.selectedFolderIds)
        formData.append("folderId", id);
      formData.append("targetFolderId", targetFolderId ?? "");
      await bulkMoveFilesAction(formData);
      setMoveOpen(false);
      selection.clearAll();
      router.refresh();
    } catch (e) {
      console.error("Bulk move failed:", e);
    }
  }

  function handleItemAction(
    id: string,
    type: "file" | "folder",
    action: Exclude<FileAction, "open" | "download">,
  ) {
    switch (action) {
      case "share":
        setShareFileId(id);
        break;
      case "rename":
        setRenamingId(id);
        break;
      case "move":
        selection.clearAll();
        selection.selectOne(id);
        setMoveOpen(true);
        break;
      case "visibility":
        void handleVisibility(id, type);
        break;
      case "delete":
        void handleDelete(id, type);
        break;
    }
  }

  const totalItems = folders.length + files.length;

  return (
    <main className="space-y-6">
      <FilesToolbar
        breadcrumbs={breadcrumbs}
        folderId={folderId}
        params={params}
        availableFileTypes={availableFileTypes}
        totalItems={totalItems}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectAll={selection.selectAll}
        clearAll={selection.clearAll}
        selectedCount={selection.selectedCount}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <FilesSidebar
          folderId={folderId}
          pendingUploads={pendingUploads}
        />
        <div className="min-w-0 flex-1">
          <FilesContent
            folders={folders}
            files={files}
            viewMode={viewMode}
            query={params.q}
            isSelected={selection.isSelected}
            onToggleSelect={selection.toggle}
            renamingId={renamingId}
            onRename={handleRename}
            onCancelRename={() => setRenamingId(null)}
            onAction={handleItemAction}
            canManage={canManage}
          />
        </div>
      </div>

      {selection.selectedCount > 0 && (
        <BulkActionBar
          count={selection.selectedCount}
          onClear={selection.clearAll}
          onMove={() => setMoveOpen(true)}
          onDelete={handleBulkDelete}
        />
      )}

      <MoveDialog
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        title={
          selection.selectedCount > 1
            ? `Move ${selection.selectedCount} items`
            : "Move item"
        }
        folderTree={folderTree}
        currentFolderId={folderId}
        onConfirm={handleBulkMove}
      />

      <ShareDialog
        fileId={shareFileId ?? ""}
        open={!!shareFileId}
        onClose={() => setShareFileId(null)}
      />
    </main>
  );
}
