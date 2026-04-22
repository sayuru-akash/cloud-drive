import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockSession = {
  user: { id: "user-1", email: "test@example.com", role: "member" },
};

const mockFile = {
  id: "file-1",
  ownerUserId: "user-1",
  visibility: "private",
  status: "ready",
  isDeleted: false,
  displayName: "test.pdf",
};

const mockVersion = {
  id: "ver-1",
  fileId: "file-1",
  storageKey: "workspace/key",
};

vi.mock("@/lib/auth/session", () => ({
  requireSession: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/drive", () => ({
  canViewResource: vi.fn(() => true),
  getCurrentFileVersion: vi.fn(() => Promise.resolve(mockVersion)),
  getFileRecord: vi.fn(() => Promise.resolve(mockFile)),
}));

vi.mock("@/lib/storage", () => ({
  createDownloadUrlWithOptions: vi.fn(() => Promise.resolve("https://b2.example.com/download-url")),
}));

describe("GET /api/files/[id]/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to presigned download url", async () => {
    const request = new Request("http://localhost/api/files/file-1/download");

    const response = await GET(request, { params: Promise.resolve({ id: "file-1" }) });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://b2.example.com/download-url");
  });

  it("returns 404 when file is not found", async () => {
    const { getFileRecord } = await import("@/lib/drive");
    vi.mocked(getFileRecord).mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/files/file-1/download");

    const response = await GET(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("File unavailable.");
  });

  it("returns 404 when file is deleted", async () => {
    const { getFileRecord } = await import("@/lib/drive");
    vi.mocked(getFileRecord).mockResolvedValueOnce({ ...mockFile, isDeleted: true });

    const request = new Request("http://localhost/api/files/file-1/download");

    const response = await GET(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("File unavailable.");
  });

  it("returns 403 when user cannot view the file", async () => {
    const { canViewResource } = await import("@/lib/drive");
    vi.mocked(canViewResource).mockReturnValueOnce(false);

    const request = new Request("http://localhost/api/files/file-1/download");

    const response = await GET(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden.");
  });

  it("returns 404 when file version is missing", async () => {
    const { getCurrentFileVersion } = await import("@/lib/drive");
    vi.mocked(getCurrentFileVersion).mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/files/file-1/download");

    const response = await GET(request, { params: Promise.resolve({ id: "file-1" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("File version missing.");
  });
});
