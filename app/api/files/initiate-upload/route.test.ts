import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const mockSession = {
  user: { id: "user-1", email: "test@example.com", role: "member" },
};

const mockSettings = {
  blockedFileExtensions: ["exe"],
  maxUploadSizeBytes: 10 * 1024 * 1024 * 1024,
};

const mockFolder = {
  id: "folder-1",
  ownerUserId: "user-1",
  visibility: "private",
  isDeleted: false,
};

vi.mock("@/lib/auth/session", () => ({
  requireSession: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock("@/lib/app-settings", () => ({
  getAppSettings: vi.fn(() => Promise.resolve(mockSettings)),
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/ids", () => ({
  createId: vi.fn((prefix: string) => `${prefix}-mock-id`),
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([mockFolder])),
        })),
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  files: {},
  folders: {},
  uploads: {},
}));

vi.mock("@/lib/drive", () => ({
  canEditResource: vi.fn(() => true),
  ensureUniqueFileName: vi.fn(() => Promise.resolve("test-file.pdf")),
}));

vi.mock("@/lib/storage", () => ({
  buildStorageKey: vi.fn(() => "workspace/default/files/file-mock-id/versions/1/test-file.pdf"),
  createUploadUrl: vi.fn(() => Promise.resolve("https://b2.example.com/presigned-url")),
  createMultipartUpload: vi.fn(() =>
    Promise.resolve({ UploadId: "multipart-mock-id" }),
  ),
}));

describe("POST /api/files/initiate-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initiates single upload for small files", async () => {
    const request = new Request("http://localhost/api/files/initiate-upload", {
      method: "POST",
      body: JSON.stringify({
        fileName: "test.pdf",
        contentType: "application/pdf",
        sizeBytes: 1024,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.uploadStrategy).toBe("single");
    expect(data.uploadUrl).toBe("https://b2.example.com/presigned-url");
    expect(data.fileId).toBe("file-mock-id");
    expect(data.displayName).toBe("test-file.pdf");
  });

  it("initiates multipart upload for large files", async () => {
    const request = new Request("http://localhost/api/files/initiate-upload", {
      method: "POST",
      body: JSON.stringify({
        fileName: "large.zip",
        contentType: "application/zip",
        sizeBytes: 600 * 1024 * 1024,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.uploadStrategy).toBe("multipart");
    expect(data.multipartUploadId).toBe("multipart-mock-id");
    expect(data.partSizeBytes).toBe(500 * 1024 * 1024);
    expect(data.totalParts).toBe(2);
  });

  it("rejects blocked file extensions", async () => {
    const request = new Request("http://localhost/api/files/initiate-upload", {
      method: "POST",
      body: JSON.stringify({
        fileName: "virus.exe",
        contentType: "application/x-msdownload",
        sizeBytes: 1024,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("This file type is blocked by policy.");
  });

  it("rejects files exceeding size limit", async () => {
    const request = new Request("http://localhost/api/files/initiate-upload", {
      method: "POST",
      body: JSON.stringify({
        fileName: "huge.zip",
        contentType: "application/zip",
        sizeBytes: 20 * 1024 * 1024 * 1024,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("File exceeds the configured upload limit.");
  });

  it("rejects invalid JSON body", async () => {
    const request = new Request("http://localhost/api/files/initiate-upload", {
      method: "POST",
      body: JSON.stringify({
        fileName: "",
        contentType: "application/pdf",
        sizeBytes: -1,
      }),
    });

    await expect(POST(request)).rejects.toThrow();
  });
});
