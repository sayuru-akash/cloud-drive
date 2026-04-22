import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilesContent } from "./files-content";

vi.mock("./empty-state", () => ({
  EmptyState: ({ variant, query }: { variant: string; query?: string }) => (
    <div data-testid="empty-state" data-variant={variant} data-query={query}>
      Empty
    </div>
  ),
}));

vi.mock("./file-list-item", () => ({
  FileListItem: ({ item, isSelected, onToggleSelect, isRenaming, onRename, onAction }: {
    item: { type: string; id: string; name?: string; displayName?: string };
    isSelected: boolean;
    onToggleSelect: (shift?: boolean) => void;
    isRenaming: boolean;
    onRename: (value: string) => void;
    onAction: (action: string) => void;
  }) => (
    <div
      data-testid={`list-item-${item.id}`}
      data-selected={isSelected}
      data-renaming={isRenaming}
      data-type={item.type}
      onClick={() => onToggleSelect()}
    >
      {item.type === "folder" ? item.name : item.displayName}
      {isRenaming && (
        <button data-testid={`rename-submit-${item.id}`} onClick={() => onRename("renamed")}>
          Submit
        </button>
      )}
      <button data-testid={`action-share-${item.id}`} onClick={() => onAction("share")}>
        Share
      </button>
    </div>
  ),
}));

vi.mock("./file-grid-card", () => ({
  FileGridCard: ({ item, isSelected, onToggleSelect }: {
    item: { type: string; id: string; name?: string; displayName?: string };
    isSelected: boolean;
    onToggleSelect: (shift?: boolean) => void;
  }) => (
    <div
      data-testid={`grid-card-${item.id}`}
      data-selected={isSelected}
      data-type={item.type}
      onClick={() => onToggleSelect()}
    >
      {item.type === "folder" ? item.name : item.displayName}
    </div>
  ),
}));

const mockFolders = [
  { id: "folder-1", name: "Documents", ownerUserId: "user-1", visibility: "private", updatedAt: new Date() },
];

const mockFiles = [
  { id: "file-1", displayName: "report.pdf", ownerUserId: "user-1", visibility: "private", updatedAt: new Date(), mimeType: "application/pdf", sizeBytes: 1024 },
];

describe("FilesContent", () => {
  it("renders empty state for empty folder", () => {
    render(
      <FilesContent
        folders={[]}
        files={[]}
        viewMode="list"
        isSelected={() => false}
        onToggleSelect={vi.fn()}
        renamingId={null}
        onRename={vi.fn()}
        onCancelRename={vi.fn()}
        onAction={vi.fn()}
        canManage={() => true}
      />,
    );

    expect(screen.getByTestId("empty-state")).toHaveAttribute("data-variant", "empty-folder");
  });

  it("renders empty state for no search results", () => {
    render(
      <FilesContent
        folders={[]}
        files={[]}
        viewMode="list"
        query="nonexistent"
        isSelected={() => false}
        onToggleSelect={vi.fn()}
        renamingId={null}
        onRename={vi.fn()}
        onCancelRename={vi.fn()}
        onAction={vi.fn()}
        canManage={() => true}
      />,
    );

    expect(screen.getByTestId("empty-state")).toHaveAttribute("data-variant", "no-results");
    expect(screen.getByTestId("empty-state")).toHaveAttribute("data-query", "nonexistent");
  });

  it("renders list items in list view", () => {
    render(
      <FilesContent
        folders={mockFolders}
        files={mockFiles}
        viewMode="list"
        isSelected={() => false}
        onToggleSelect={vi.fn()}
        renamingId={null}
        onRename={vi.fn()}
        onCancelRename={vi.fn()}
        onAction={vi.fn()}
        canManage={() => true}
      />,
    );

    expect(screen.getByTestId("list-item-folder-1")).toHaveAttribute("data-type", "folder");
    expect(screen.getByTestId("list-item-file-1")).toHaveAttribute("data-type", "file");
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("renders grid cards in grid view", () => {
    render(
      <FilesContent
        folders={mockFolders}
        files={mockFiles}
        viewMode="grid"
        isSelected={() => false}
        onToggleSelect={vi.fn()}
        renamingId={null}
        onRename={vi.fn()}
        onCancelRename={vi.fn()}
        onAction={vi.fn()}
        canManage={() => true}
      />,
    );

    expect(screen.getByTestId("grid-card-folder-1")).toHaveAttribute("data-type", "folder");
    expect(screen.getByTestId("grid-card-file-1")).toHaveAttribute("data-type", "file");
  });

  it("passes selection state to items", () => {
    render(
      <FilesContent
        folders={mockFolders}
        files={mockFiles}
        viewMode="list"
        isSelected={(id) => id === "file-1"}
        onToggleSelect={vi.fn()}
        renamingId={null}
        onRename={vi.fn()}
        onCancelRename={vi.fn()}
        onAction={vi.fn()}
        canManage={() => true}
      />,
    );

    expect(screen.getByTestId("list-item-folder-1")).toHaveAttribute("data-selected", "false");
    expect(screen.getByTestId("list-item-file-1")).toHaveAttribute("data-selected", "true");
  });

  it("calls onToggleSelect when item is clicked", () => {
    const onToggleSelect = vi.fn();
    render(
      <FilesContent
        folders={mockFolders}
        files={[]}
        viewMode="list"
        isSelected={() => false}
        onToggleSelect={onToggleSelect}
        renamingId={null}
        onRename={vi.fn()}
        onCancelRename={vi.fn()}
        onAction={vi.fn()}
        canManage={() => true}
      />,
    );

    fireEvent.click(screen.getByTestId("list-item-folder-1"));
    expect(onToggleSelect).toHaveBeenCalledWith("folder-1", undefined);
  });

  it("shows rename input for renaming item", () => {
    render(
      <FilesContent
        folders={mockFolders}
        files={[]}
        viewMode="list"
        isSelected={() => false}
        onToggleSelect={vi.fn()}
        renamingId="folder-1"
        onRename={vi.fn()}
        onCancelRename={vi.fn()}
        onAction={vi.fn()}
        canManage={() => true}
      />,
    );

    expect(screen.getByTestId("list-item-folder-1")).toHaveAttribute("data-renaming", "true");
  });

  it("calls onAction when action button is clicked", () => {
    const onAction = vi.fn();
    render(
      <FilesContent
        folders={[]}
        files={mockFiles}
        viewMode="list"
        isSelected={() => false}
        onToggleSelect={vi.fn()}
        renamingId={null}
        onRename={vi.fn()}
        onCancelRename={vi.fn()}
        onAction={onAction}
        canManage={() => true}
      />,
    );

    fireEvent.click(screen.getByTestId("action-share-file-1"));
    expect(onAction).toHaveBeenCalledWith("file-1", "file", "share");
  });
});
