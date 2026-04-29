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
  status: "pending",
  visibility: "private",
  isDeleted: false,
  deletedAt: null,
  currentVersionId: null,
} satisfies DriveFileRecord;

const mockUpload = {
  id: "upload-1",
  fileId: "file-1",
  storageKey: "workspace/key",
  providerUploadId: "multipart-123",
};

vi.mock("@/lib/auth/session", () => ({
  requireSession: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: vi.fn(() => Promise.resolve()),
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
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  files: {},
  uploads: {},
}));

vi.mock("@/lib/drive", () => ({
  canEditResource: vi.fn(() => true),
  getFileRecord: vi.fn(() => Promise.resolve(mockFile)),
}));

vi.mock("@/lib/storage", () => ({
  abortMultipartUpload: vi.fn(() => Promise.resolve()),
}));

describe("POST /api/files/[id]/cancel-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels an upload successfully", async () => {
    const request = new Request("http://localhost/api/files/file-1/cancel-upload", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("returns 404 when file is not found", async () => {
    const { getFileRecord } = await import("@/lib/drive");
    vi.mocked(getFileRecord).mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/files/file-1/cancel-upload", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("File not found.");
  });

  it("returns 403 when user cannot edit the file", async () => {
    const { canEditResource } = await import("@/lib/drive");
    vi.mocked(canEditResource).mockReturnValueOnce(false);

    const request = new Request("http://localhost/api/files/file-1/cancel-upload", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden.");
  });

  it("returns ok when no pending upload exists", async () => {
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

    const request = new Request("http://localhost/api/files/file-1/cancel-upload", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
