import { describe, it, expect } from "vitest";
import {
  serverEnvSchema,
  publicEnvSchema,
  normalizeAbsoluteUrl,
} from "./env";

describe("normalizeAbsoluteUrl", () => {
  it("returns undefined for empty input", () => {
    expect(normalizeAbsoluteUrl(undefined)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(normalizeAbsoluteUrl("")).toBeUndefined();
  });

  it("preserves https URLs", () => {
    expect(normalizeAbsoluteUrl("https://example.com")).toBe("https://example.com");
  });

  it("preserves http URLs", () => {
    expect(normalizeAbsoluteUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("prefixes bare domain with https", () => {
    expect(normalizeAbsoluteUrl("example.com")).toBe("https://example.com");
  });

  it("prefixes subdomain with https", () => {
    expect(normalizeAbsoluteUrl("app.example.com")).toBe("https://app.example.com");
  });
});

describe("serverEnvSchema", () => {
  it("accepts valid complete environment", () => {
    const result = serverEnvSchema.parse({
      APP_BASE_URL: "https://app.example.com",
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      BETTER_AUTH_SECRET: "a".repeat(32),
      B2_S3_ENDPOINT: "https://s3.us-west-001.backblazeb2.com",
      B2_KEY_ID: "key-id",
      B2_APPLICATION_KEY: "app-key",
      B2_BUCKET_NAME: "my-bucket",
    });
    expect(result.DATABASE_URL).toBe("postgres://user:pass@localhost:5432/db");
    expect(result.BETTER_AUTH_SECRET).toBe("a".repeat(32));
    expect(result.MAX_UPLOAD_SIZE_BYTES).toBe(10737418240);
    expect(result.DEFAULT_SOFT_DELETE_RETENTION_DAYS).toBe(30);
  });

  it("rejects missing DATABASE_URL", () => {
    expect(() =>
      serverEnvSchema.parse({
        BETTER_AUTH_SECRET: "a".repeat(32),
        B2_S3_ENDPOINT: "https://s3.example.com",
        B2_KEY_ID: "key",
        B2_APPLICATION_KEY: "secret",
        B2_BUCKET_NAME: "bucket",
      }),
    ).toThrow();
  });

  it("rejects BETTER_AUTH_SECRET shorter than 32 chars", () => {
    expect(() =>
      serverEnvSchema.parse({
        DATABASE_URL: "postgres://localhost/db",
        BETTER_AUTH_SECRET: "short",
        B2_S3_ENDPOINT: "https://s3.example.com",
        B2_KEY_ID: "key",
        B2_APPLICATION_KEY: "secret",
        B2_BUCKET_NAME: "bucket",
      }),
    ).toThrow();
  });

  it("rejects invalid B2_S3_ENDPOINT", () => {
    expect(() =>
      serverEnvSchema.parse({
        DATABASE_URL: "postgres://localhost/db",
        BETTER_AUTH_SECRET: "a".repeat(32),
        B2_S3_ENDPOINT: "not-a-url",
        B2_KEY_ID: "key",
        B2_APPLICATION_KEY: "secret",
        B2_BUCKET_NAME: "bucket",
      }),
    ).toThrow();
  });

  it("rejects short B2_BUCKET_NAME", () => {
    expect(() =>
      serverEnvSchema.parse({
        DATABASE_URL: "postgres://localhost/db",
        BETTER_AUTH_SECRET: "a".repeat(32),
        B2_S3_ENDPOINT: "https://s3.example.com",
        B2_KEY_ID: "key",
        B2_APPLICATION_KEY: "secret",
        B2_BUCKET_NAME: "abc",
      }),
    ).toThrow();
  });

  it("coerces MAX_UPLOAD_SIZE_BYTES from string", () => {
    const result = serverEnvSchema.parse({
      DATABASE_URL: "postgres://localhost/db",
      BETTER_AUTH_SECRET: "a".repeat(32),
      B2_S3_ENDPOINT: "https://s3.example.com",
      B2_KEY_ID: "key",
      B2_APPLICATION_KEY: "secret",
      B2_BUCKET_NAME: "mybucket",
      MAX_UPLOAD_SIZE_BYTES: "52428800",
    });
    expect(result.MAX_UPLOAD_SIZE_BYTES).toBe(52428800);
  });

  it("coerces DEFAULT_SOFT_DELETE_RETENTION_DAYS from string", () => {
    const result = serverEnvSchema.parse({
      DATABASE_URL: "postgres://localhost/db",
      BETTER_AUTH_SECRET: "a".repeat(32),
      B2_S3_ENDPOINT: "https://s3.example.com",
      B2_KEY_ID: "key",
      B2_APPLICATION_KEY: "secret",
      B2_BUCKET_NAME: "mybucket",
      DEFAULT_SOFT_DELETE_RETENTION_DAYS: "14",
    });
    expect(result.DEFAULT_SOFT_DELETE_RETENTION_DAYS).toBe(14);
  });

  it("allows optional RESEND fields to be absent", () => {
    const result = serverEnvSchema.parse({
      DATABASE_URL: "postgres://localhost/db",
      BETTER_AUTH_SECRET: "a".repeat(32),
      B2_S3_ENDPOINT: "https://s3.example.com",
      B2_KEY_ID: "key",
      B2_APPLICATION_KEY: "secret",
      B2_BUCKET_NAME: "mybucket",
    });
    expect(result.RESEND_API_KEY).toBeUndefined();
    expect(result.RESEND_FROM_EMAIL).toBeUndefined();
  });
});

describe("publicEnvSchema", () => {
  it("accepts valid public URL", () => {
    const result = publicEnvSchema.parse({
      NEXT_PUBLIC_APP_URL: "https://app.example.com",
    });
    expect(result.NEXT_PUBLIC_APP_URL).toBe("https://app.example.com");
  });

  it("accepts empty object", () => {
    const result = publicEnvSchema.parse({});
    expect(result.NEXT_PUBLIC_APP_URL).toBeUndefined();
  });

  it("rejects invalid URL", () => {
    expect(() =>
      publicEnvSchema.parse({
        NEXT_PUBLIC_APP_URL: "not-a-url",
      }),
    ).toThrow();
  });
});
