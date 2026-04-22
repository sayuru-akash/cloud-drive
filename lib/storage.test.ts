import { describe, it, expect, vi } from "vitest";

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  HeadObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  CreateMultipartUploadCommand: vi.fn(),
  UploadPartCommand: vi.fn(),
  CompleteMultipartUploadCommand: vi.fn(),
  AbortMultipartUploadCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

import { buildStorageKey, buildDownloadDisposition } from "./storage";

describe("buildStorageKey", () => {
  it("formats a basic key correctly", () => {
    const key = buildStorageKey("file-123", 1, "document.pdf");
    expect(key).toBe("workspace/default/files/file-123/versions/1/document.pdf");
  });

  it("lowercases the filename", () => {
    const key = buildStorageKey("file-123", 2, "MYFILE.PDF");
    expect(key).toBe("workspace/default/files/file-123/versions/2/myfile.pdf");
  });

  it("replaces unsafe characters with hyphens", () => {
    const key = buildStorageKey("file-123", 1, "file@name#test.pdf");
    expect(key).toBe("workspace/default/files/file-123/versions/1/file-name-test.pdf");
  });

  it("trims leading and trailing hyphens", () => {
    const key = buildStorageKey("file-123", 1, "---test---");
    expect(key).toBe("workspace/default/files/file-123/versions/1/test");
  });

  it("uses 'file' fallback for empty safe name", () => {
    const key = buildStorageKey("file-123", 1, "!!!");
    expect(key).toBe("workspace/default/files/file-123/versions/1/file");
  });

  it("trims whitespace before processing", () => {
    const key = buildStorageKey("file-123", 1, "  my file  ");
    expect(key).toBe("workspace/default/files/file-123/versions/1/my-file");
  });
});

describe("buildDownloadDisposition", () => {
  it("returns default disposition when filename is undefined", () => {
    expect(buildDownloadDisposition()).toBe('attachment; filename="file"');
  });

  it("returns default disposition when filename is empty", () => {
    expect(buildDownloadDisposition("")).toBe('attachment; filename="file"');
  });

  it("sanitizes filenames with special characters", () => {
    const result = buildDownloadDisposition("report(2024).pdf");
    expect(result).toContain('filename="report_2024_.pdf"');
  });

  it("removes newlines and quotes", () => {
    const result = buildDownloadDisposition('my"file\nname.pdf');
    expect(result).toContain("myfilename.pdf");
  });

  it("includes UTF-8 filename* for original safe name", () => {
    const result = buildDownloadDisposition("document.pdf");
    expect(result).toBe(
      'attachment; filename="document.pdf"; filename*=UTF-8\'\'document.pdf',
    );
  });

  it("handles unicode characters via NFKD normalization", () => {
    const result = buildDownloadDisposition("café.pdf");
    expect(result).toContain('filename="cafe.pdf"');
    expect(result).toContain("filename*=UTF-8''caf%C3%A9.pdf");
  });

  it("falls back to 'file' when sanitized name is empty", () => {
    const result = buildDownloadDisposition("!!!");
    expect(result).toBe('attachment; filename="file"; filename*=UTF-8\'\'!!!');
  });

  it("preserves allowed characters like dots and underscores", () => {
    const result = buildDownloadDisposition("my_file.v2.pdf");
    expect(result).toContain('filename="my_file.v2.pdf"');
  });

  it("percent-encodes parentheses in filename*", () => {
    const result = buildDownloadDisposition("test (v2).pdf");
    expect(result).toContain('filename="test__v2_.pdf"');
    expect(result).toContain("filename*=UTF-8''test%20%28v2%29.pdf");
  });
});
