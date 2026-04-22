import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useUploadQueue } from "./use-upload-queue";

// Mock useActionConfirm to always confirm
vi.mock("@/components/action-ui", () => ({
  useActionConfirm: () => () => Promise.resolve(true),
}));

describe("useUploadQueue", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let xhrMock: {
    open: ReturnType<typeof vi.fn>;
    setRequestHeader: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
    upload: { onprogress: ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null };
    onload: (() => void) | null;
    onerror: (() => void) | null;
    onabort: (() => void) | null;
    status: number;
    getResponseHeader: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock crypto.randomUUID
    let uuidCounter = 0;
    vi.stubGlobal("crypto", {
      randomUUID: () => `uuid-${uuidCounter++}`,
    });

    // Mock fetch
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    // Mock XMLHttpRequest
    xhrMock = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
      abort: vi.fn(),
      upload: { onprogress: null },
      onload: null,
      onerror: null,
      onabort: null,
      status: 200,
      getResponseHeader: vi.fn(() => '"etag-123"'),
    };

    vi.stubGlobal(
      "XMLHttpRequest",
      vi.fn(function () {
        return xhrMock;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("initializes with empty uploads", () => {
    const { result } = renderHook(() => useUploadQueue(null));

    expect(result.current.uploads).toEqual([]);
    expect(result.current.hasUploads).toBe(false);
    expect(result.current.activeCount).toBe(0);
  });

  it("queues files and starts upload", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          fileId: "file-1",
          displayName: "test.txt",
          uploadUrl: "https://b2.example.com/upload",
        }),
    });

    const { result } = renderHook(() => useUploadQueue(null));
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.queueFiles([file]);
    });

    expect(result.current.uploads).toHaveLength(1);
    expect(result.current.uploads[0].status).toBe("queued");
    expect(result.current.hasUploads).toBe(true);

    // Wait for upload to start
    await waitFor(() => {
      expect(result.current.uploads[0]?.status).toBe("uploading");
    });
  });

  it("handles single upload success", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            fileId: "file-1",
            displayName: "test.txt",
            uploadUrl: "https://b2.example.com/upload",
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

    const { result } = renderHook(() => useUploadQueue(null));
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.queueFiles([file]);
    });

    // Allow async upload initiation to create XHR
    await new Promise((resolve) => setTimeout(resolve, 50));

    act(() => {
      if (xhrMock.onload) xhrMock.onload();
    });

    await waitFor(() => {
      expect(result.current.uploads[0]?.status).toBe("done");
    });
  });

  it("handles upload initiation error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Upload blocked" }),
    });

    const { result } = renderHook(() => useUploadQueue(null));
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.queueFiles([file]);
    });

    await waitFor(() => {
      expect(result.current.uploads[0]?.status).toBe("error");
    });

    expect(result.current.uploads[0]?.message).toBe("Upload blocked");
  });

  it("handles XHR upload error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          fileId: "file-1",
          displayName: "test.txt",
          uploadUrl: "https://b2.example.com/upload",
        }),
    });

    const { result } = renderHook(() => useUploadQueue(null));
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.queueFiles([file]);
    });

    await waitFor(() => {
      expect(xhrMock.onerror).not.toBeNull();
    });

    act(() => {
      if (xhrMock.onerror) xhrMock.onerror();
    });

    await waitFor(() => {
      expect(result.current.uploads[0]?.status).toBe("error");
    });
  });

  it("cancels an upload", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          fileId: "file-1",
          displayName: "test.txt",
          uploadUrl: "https://b2.example.com/upload",
        }),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useUploadQueue(null));
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.queueFiles([file]);
    });

    await waitFor(() => {
      expect(result.current.uploads[0]?.status).toBe("uploading");
    });

    const upload = result.current.uploads[0];

    await act(async () => {
      await result.current.cancelUpload(upload);
    });

    expect(result.current.uploads[0]?.status).toBe("cancelled");
    expect(xhrMock.abort).toHaveBeenCalled();
  });

  it("retries an errored upload", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          fileId: "file-1",
          displayName: "test.txt",
          uploadUrl: "https://b2.example.com/upload",
        }),
    });

    const { result } = renderHook(() => useUploadQueue(null));
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.queueFiles([file]);
    });

    await waitFor(() => {
      expect(xhrMock.onerror).not.toBeNull();
    });

    act(() => {
      if (xhrMock.onerror) xhrMock.onerror();
    });

    await waitFor(() => {
      expect(result.current.uploads[0]?.status).toBe("error");
    });

    const upload = result.current.uploads[0];

    act(() => {
      result.current.retryUpload(upload);
    });

    expect(result.current.uploads[0]?.status).toBe("queued");
  });

  it("clears done and cancelled uploads", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          fileId: "file-1",
          displayName: "test.txt",
          uploadUrl: "https://b2.example.com/upload",
        }),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useUploadQueue(null));
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.queueFiles([file]);
    });

    // Allow async upload initiation to create XHR
    await new Promise((resolve) => setTimeout(resolve, 50));

    act(() => {
      if (xhrMock.onload) xhrMock.onload();
    });

    await waitFor(() => {
      expect(result.current.uploads[0]?.status).toBe("done");
    });

    act(() => {
      result.current.clearDone();
    });

    expect(result.current.uploads).toHaveLength(0);
    expect(result.current.hasUploads).toBe(false);
  });

  it("handles multipart upload flow", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            fileId: "file-1",
            displayName: "large.zip",
            multipartUploadId: "mp-123",
            partSizeBytes: 5,
            totalParts: 2,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ uploadUrl: "https://b2.example.com/part1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ uploadUrl: "https://b2.example.com/part2" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

    const { result } = renderHook(() => useUploadQueue(null));
    const file = new File(["0123456789"], "large.zip", { type: "application/zip" });

    act(() => {
      result.current.queueFiles([file]);
    });

    // Allow async upload initiation to create XHR for first part
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Complete first part upload
    act(() => {
      if (xhrMock.onload) xhrMock.onload();
    });

    // Wait for second part XHR to be created
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    // Complete second part upload
    act(() => {
      if (xhrMock.onload) xhrMock.onload();
    });

    await waitFor(() => {
      expect(result.current.uploads[0]?.status).toBe("done");
    });
  });
});
