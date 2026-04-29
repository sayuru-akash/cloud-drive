import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import type { DriveFileRecord } from "@/lib/drive";

const mockSession = {
  user: { id: "user-1", email: "test@example.com", role: "member" },
};

const mockFile = {
  id: "file-1",
  folderId: null,
  ownerUserId: "user-1",
  createdByUserId: "user-1",
  displayName: "test.pdf",
  originalName: "test.pdf",
  mimeType: "application/pdf",
  sizeBytes: 1024,
  visibility: "private",
  status: "pending",
  isDeleted: false,
  deletedAt: null,
  currentVersionId: null,
} satisfies DriveFileRecord;

const mockUpload = {
  id: "upload-1",
  fileId: "file-1",
  storageKey: "workspace/key",
  providerUploadId: "multipart-123",
  sizeBytes: 1024,
  contentType: "application/pdf",
};

const mockObject = {
  ContentLength: 1024,
  ContentType: "application/pdf",
};

vi.mock("@/lib/auth/session", () => ({
  requireSession: vi.fn(() => Promise.resolve(mockSession)),
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
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([mockUpload])),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  files: {},
  fileVersions: {},
  uploads: {},
}));

vi.mock("@/lib/drive", () => ({
  canEditResource: vi.fn(() => true),
  getFileRecord: vi.fn(() => Promise.resolve(mockFile)),
}));

vi.mock("@/lib/storage", () => ({
  completeMultipartUpload: vi.fn(() => Promise.resolve()),
  getStoredObject: vi.fn(() => Promise.resolve(mockObject)),
}));

describe("POST /api/files/[id]/complete-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes a single upload successfully", async () => {
    const request = new Request("http://localhost/api/files/file-1/complete-upload", {
      method: "POST",
      body: JSON.stringify({ uploadStrategy: "single" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.fileId).toBe("file-1");
    expect(data.versionId).toBe("ver-mock-id");
  });

  it("completes a multipart upload successfully", async () => {
    const request = new Request("http://localhost/api/files/file-1/complete-upload", {
      method: "POST",
      body: JSON.stringify({
        uploadStrategy: "multipart",
        multipartUploadId: "multipart-123",
        parts: [{ partNumber: 1, etag: "etag-1" }],
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("returns 404 when file is not found", async () => {
    const { getFileRecord } = await import("@/lib/drive");
    vi.mocked(getFileRecord).mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/files/file-1/complete-upload", {
      method: "POST",
      body: JSON.stringify({ uploadStrategy: "single" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("File not found.");
  });

  it("returns 403 when user cannot edit the file", async () => {
    const { canEditResource } = await import("@/lib/drive");
    vi.mocked(canEditResource).mockReturnValueOnce(false);

    const request = new Request("http://localhost/api/files/file-1/complete-upload", {
      method: "POST",
      body: JSON.stringify({ uploadStrategy: "single" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden.");
  });

  it("returns 400 when no pending upload exists", async () => {
    const { db } = await import("@/lib/db/client");
    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: () => Promise.resolve([]),
              }),
            }),
          }),
        }) as never,
    );

    const request = new Request("http://localhost/api/files/file-1/complete-upload", {
      method: "POST",
      body: JSON.stringify({ uploadStrategy: "single" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No pending upload found for this file.");
  });

  it("returns 400 when multipart completion data is missing", async () => {
    const request = new Request("http://localhost/api/files/file-1/complete-upload", {
      method: "POST",
      body: JSON.stringify({ uploadStrategy: "multipart" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Multipart upload is missing completion data.");
  });

  it("returns 400 when uploaded object cannot be verified", async () => {
    const { getStoredObject } = await import("@/lib/storage");
    vi.mocked(getStoredObject).mockRejectedValueOnce(new Error("Not found"));

    const request = new Request("http://localhost/api/files/file-1/complete-upload", {
      method: "POST",
      body: JSON.stringify({ uploadStrategy: "single" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Uploaded object could not be verified.");
  });
});
