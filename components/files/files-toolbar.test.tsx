import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilesToolbar } from "./files-toolbar";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/files",
}));

describe("FilesToolbar", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  const defaultProps = {
    breadcrumbs: [],
    folderId: null,
    params: {},
    availableFileTypes: ["application/pdf", "image/png"],
    totalItems: 5,
    viewMode: "list" as const,
    onViewModeChange: vi.fn(),
    selectAll: vi.fn(),
    clearAll: vi.fn(),
    selectedCount: 0,
    onNewFolder: vi.fn(),
    onUpload: vi.fn(),
    onRefresh: vi.fn(),
    isRefreshing: false,
  };

  it("renders title and item count", () => {
    render(<FilesToolbar {...defaultProps} />);

    expect(screen.getByText("All files")).toBeInTheDocument();
    expect(screen.getByText("5 items")).toBeInTheDocument();
  });

  it("renders breadcrumbs", () => {
    render(
      <FilesToolbar
        {...defaultProps}
        breadcrumbs={[
          { id: "folder-1", name: "Documents" },
          { id: "folder-2", name: "Projects" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument();
  });

  it("submits search query", () => {
    render(<FilesToolbar {...defaultProps} />);

    const input = screen.getByPlaceholderText("Search files...");
    fireEvent.change(input, { target: { value: "report" } });

    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(mockPush).toHaveBeenCalledWith("/files?q=report");
  });

  it("submits search with folder context", () => {
    render(<FilesToolbar {...defaultProps} folderId="folder-1" />);

    const input = screen.getByPlaceholderText("Search files...");
    fireEvent.change(input, { target: { value: "budget" } });

    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(mockPush).toHaveBeenCalledWith("/files?q=budget&folder=folder-1");
  });

  it("toggles view mode", () => {
    const onViewModeChange = vi.fn();
    render(<FilesToolbar {...defaultProps} onViewModeChange={onViewModeChange} />);

    // View-mode toggle buttons are the only ones with SVGs and no text
    const iconOnlyButtons = screen
      .getAllByRole("button")
      .filter((b) => b.querySelector("svg") && !b.textContent?.trim());
    const gridBtn = iconOnlyButtons[1];
    fireEvent.click(gridBtn);

    expect(onViewModeChange).toHaveBeenCalledWith("grid");
  });

  it("calls select all when no items selected", () => {
    const selectAll = vi.fn();
    render(<FilesToolbar {...defaultProps} selectAll={selectAll} />);

    const selectButton = screen.getByText("Select all");
    fireEvent.click(selectButton);

    expect(selectAll).toHaveBeenCalled();
  });

  it("calls clear all when items are selected", () => {
    const clearAll = vi.fn();
    render(<FilesToolbar {...defaultProps} selectedCount={3} clearAll={clearAll} />);

    const clearButton = screen.getByText("Clear selection");
    fireEvent.click(clearButton);

    expect(clearAll).toHaveBeenCalled();
  });

  it("calls onRefresh when refresh button is clicked", () => {
    const onRefresh = vi.fn();
    render(<FilesToolbar {...defaultProps} onRefresh={onRefresh} />);

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(onRefresh).toHaveBeenCalled();
  });

  it("opens new dropdown and triggers new folder", () => {
    const onNewFolder = vi.fn();
    render(<FilesToolbar {...defaultProps} onNewFolder={onNewFolder} />);

    const newButton = screen.getByText("New");
    fireEvent.click(newButton);

    const newFolderButton = screen.getByText("New folder");
    fireEvent.click(newFolderButton);

    expect(onNewFolder).toHaveBeenCalled();
  });

  it("opens new dropdown and triggers upload", () => {
    const onUpload = vi.fn();
    render(<FilesToolbar {...defaultProps} onUpload={onUpload} />);

    const newButton = screen.getByText("New");
    fireEvent.click(newButton);

    const uploadButton = screen.getByText("Upload files");
    fireEvent.click(uploadButton);

    expect(onUpload).toHaveBeenCalled();
  });

  it("disables refresh button while refreshing", () => {
    render(<FilesToolbar {...defaultProps} isRefreshing />);

    const refreshButton = screen.getByText("Refresh");
    expect(refreshButton).toBeDisabled();
  });
});
