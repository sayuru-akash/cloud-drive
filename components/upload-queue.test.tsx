import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UploadQueue } from "./upload-queue";

function createUpload(props: Partial<Parameters<typeof UploadQueue>[0]["uploads"][0]> = {}) {
  return {
    id: "upload-1",
    file: new File(["test"], "test.txt", { type: "text/plain" }),
    displayName: "test.txt",
    progress: 50,
    status: "uploading" as const,
    message: "Uploading...",
    ...props,
  };
}

describe("UploadQueue", () => {
  it("renders nothing when uploads array is empty", () => {
    const { container } = render(
      <UploadQueue uploads={[]} onCancel={vi.fn()} onRetry={vi.fn()} onClearDone={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows active upload count in header", () => {
    render(
      <UploadQueue
        uploads={[createUpload()]}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onClearDone={vi.fn()}
      />,
    );
    expect(screen.getByText("1 uploading")).toBeInTheDocument();
  });

  it("shows done count when no active uploads", () => {
    render(
      <UploadQueue
        uploads={[createUpload({ status: "done", progress: 100, message: "Done" })]}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onClearDone={vi.fn()}
      />,
    );
    expect(screen.getByText("1 done")).toBeInTheDocument();
  });

  it("displays upload name and progress", () => {
    render(
      <UploadQueue
        uploads={[createUpload({ displayName: "document.pdf", progress: 75 })]}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onClearDone={vi.fn()}
      />,
    );
    expect(screen.getByText("document.pdf")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    const upload = createUpload({ status: "uploading" });

    render(
      <UploadQueue uploads={[upload]} onCancel={onCancel} onRetry={vi.fn()} onClearDone={vi.fn()} />,
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledWith(upload);
  });

  it("shows retry button for errored uploads", () => {
    const onRetry = vi.fn();
    const upload = createUpload({ status: "error", message: "Failed" });

    render(
      <UploadQueue uploads={[upload]} onCancel={vi.fn()} onRetry={onRetry} onClearDone={vi.fn()} />,
    );

    fireEvent.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledWith(upload);
  });

  it("shows retry button for cancelled uploads", () => {
    const onRetry = vi.fn();
    const upload = createUpload({ status: "cancelled", message: "Cancelled" });

    render(
      <UploadQueue uploads={[upload]} onCancel={vi.fn()} onRetry={onRetry} onClearDone={vi.fn()} />,
    );

    fireEvent.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledWith(upload);
  });

  it("calls onClearDone when clear button is clicked", () => {
    const onClearDone = vi.fn();
    render(
      <UploadQueue
        uploads={[createUpload({ status: "done", progress: 100 })]}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onClearDone={onClearDone}
      />,
    );

    const clearBtn = screen.getByText("1 done").closest("[role='button']")!.querySelector("button");
    fireEvent.click(clearBtn!);
    expect(onClearDone).toHaveBeenCalled();
  });

  it("shows finalizing status message", () => {
    render(
      <UploadQueue
        uploads={[createUpload({ status: "finalizing", message: "Finalizing..." })]}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onClearDone={vi.fn()}
      />,
    );
    expect(screen.getByText("Finalizing...")).toBeInTheDocument();
  });

  it("toggles expanded state on header click", () => {
    render(
      <UploadQueue
        uploads={[createUpload()]}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onClearDone={vi.fn()}
      />,
    );

    const header = screen.getByText("1 uploading").closest("[role='button']");
    expect(screen.getByText("test.txt")).toBeInTheDocument();

    fireEvent.click(header!);
    expect(screen.queryByText("test.txt")).not.toBeInTheDocument();

    fireEvent.click(header!);
    expect(screen.getByText("test.txt")).toBeInTheDocument();
  });
});
