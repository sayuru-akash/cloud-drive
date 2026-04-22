import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db/client", () => ({
  db: {},
}));

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual("drizzle-orm");
  return {
    ...(actual as object),
    and: vi.fn(),
    or: vi.fn(),
    eq: vi.fn(),
    isNull: vi.fn(),
    desc: vi.fn(),
    count: vi.fn(),
    gt: vi.fn(),
  };
});

import {
  canManageAdmin,
  canViewResource,
  canManageResource,
  sortItems,
  isWithinDateRange,
  resolveUniqueName,
} from "./drive";

describe("canManageAdmin", () => {
  it("returns true for admin", () => {
    expect(canManageAdmin("admin")).toBe(true);
  });

  it("returns true for super_admin", () => {
    expect(canManageAdmin("super_admin")).toBe(true);
  });

  it("returns false for member", () => {
    expect(canManageAdmin("member")).toBe(false);
  });

  it("returns false for null", () => {
    expect(canManageAdmin(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(canManageAdmin(undefined)).toBe(false);
  });
});

describe("canViewResource", () => {
  const baseArgs = {
    userId: "user-1",
    userRole: "member" as const,
    ownerUserId: "user-2",
    visibility: "private" as const,
  };

  it("allows owner to view private resource", () => {
    expect(
      canViewResource({ ...baseArgs, ownerUserId: "user-1", visibility: "private" }),
    ).toBe(true);
  });

  it("allows admin to view any resource", () => {
    expect(
      canViewResource({ ...baseArgs, userRole: "admin", visibility: "private" }),
    ).toBe(true);
  });

  it("allows super_admin to view any resource", () => {
    expect(
      canViewResource({ ...baseArgs, userRole: "super_admin", visibility: "private" }),
    ).toBe(true);
  });

  it("denies non-owner viewing private resource", () => {
    expect(
      canViewResource({ ...baseArgs, ownerUserId: "user-2", visibility: "private" }),
    ).toBe(false);
  });

  it("allows anyone to view workspace resource", () => {
    expect(
      canViewResource({ ...baseArgs, ownerUserId: "user-2", visibility: "workspace" }),
    ).toBe(true);
  });
});

describe("canManageResource", () => {
  it("allows owner to manage", () => {
    expect(
      canManageResource({ userId: "user-1", userRole: "member", ownerUserId: "user-1" }),
    ).toBe(true);
  });

  it("allows admin to manage any resource", () => {
    expect(
      canManageResource({ userId: "user-1", userRole: "admin", ownerUserId: "user-2" }),
    ).toBe(true);
  });

  it("denies non-owner member", () => {
    expect(
      canManageResource({ userId: "user-1", userRole: "member", ownerUserId: "user-2" }),
    ).toBe(false);
  });
});

describe("sortItems", () => {
  const items = [
    { updatedAt: new Date("2024-01-01"), name: "B", sizeBytes: 200 },
    { updatedAt: new Date("2024-03-01"), name: "A", sizeBytes: 100 },
    { updatedAt: new Date("2024-02-01"), name: "C", sizeBytes: 300 },
  ];

  it("sorts by updated-desc (newest first)", () => {
    const sorted = sortItems(items, "updated-desc");
    expect(sorted.map((i) => i.name)).toEqual(["A", "C", "B"]);
  });

  it("sorts by updated-asc (oldest first)", () => {
    const sorted = sortItems(items, "updated-asc");
    expect(sorted.map((i) => i.name)).toEqual(["B", "C", "A"]);
  });

  it("sorts by name-asc", () => {
    const sorted = sortItems(items, "name-asc");
    expect(sorted.map((i) => i.name)).toEqual(["A", "B", "C"]);
  });

  it("sorts by name-desc", () => {
    const sorted = sortItems(items, "name-desc");
    expect(sorted.map((i) => i.name)).toEqual(["C", "B", "A"]);
  });

  it("sorts by size-desc", () => {
    const sorted = sortItems(items, "size-desc");
    expect(sorted.map((i) => i.name)).toEqual(["C", "B", "A"]);
  });

  it("sorts by size-asc", () => {
    const sorted = sortItems(items, "size-asc");
    expect(sorted.map((i) => i.name)).toEqual(["A", "B", "C"]);
  });

  it("defaults to updated-desc for unknown sort", () => {
    const sorted = sortItems(items, "unknown" as unknown as import("@/lib/constants").FileSortValue);
    expect(sorted.map((i) => i.name)).toEqual(["A", "C", "B"]);
  });

  it("does not mutate original array", () => {
    const original = [...items];
    sortItems(items, "name-asc");
    expect(items).toEqual(original);
  });
});

describe("isWithinDateRange", () => {
  const date = new Date("2024-06-15T10:00:00Z");

  it("returns true when no range is specified", () => {
    expect(isWithinDateRange(date)).toBe(true);
  });

  it("returns true when within from date", () => {
    expect(isWithinDateRange(date, "2024-06-01")).toBe(true);
  });

  it("returns false when before from date", () => {
    expect(isWithinDateRange(date, "2024-07-01")).toBe(false);
  });

  it("returns true when within to date", () => {
    expect(isWithinDateRange(date, undefined, "2024-06-30")).toBe(true);
  });

  it("returns false when after to date", () => {
    expect(isWithinDateRange(date, undefined, "2024-06-01")).toBe(false);
  });

  it("returns true when within both dates", () => {
    expect(isWithinDateRange(date, "2024-06-01", "2024-06-30")).toBe(true);
  });

  it("handles to date as end of day", () => {
    const localNoon = new Date("2024-06-15T12:00:00");
    expect(isWithinDateRange(localNoon, undefined, "2024-06-15")).toBe(true);
  });

  it("ignores invalid from date", () => {
    expect(isWithinDateRange(date, "invalid")).toBe(true);
  });

  it("ignores invalid to date", () => {
    expect(isWithinDateRange(date, undefined, "invalid")).toBe(true);
  });
});

describe("resolveUniqueName", () => {
  it("returns trimmed name when no conflicts", () => {
    expect(resolveUniqueName(["a", "b"], "c")).toBe("c");
  });

  it("appends (1) when name conflicts", () => {
    expect(resolveUniqueName(["file"], "file")).toBe("file (1)");
  });

  it("increments counter until unique", () => {
    expect(resolveUniqueName(["file", "file (1)", "file (2)"], "file")).toBe("file (3)");
  });

  it("preserves extension when resolving conflicts", () => {
    expect(resolveUniqueName(["doc.pdf"], "doc.pdf")).toBe("doc (1).pdf");
  });

  it("increments counter with extension", () => {
    expect(resolveUniqueName(["doc.pdf", "doc (1).pdf"], "doc.pdf")).toBe("doc (2).pdf");
  });

  it("is case-insensitive for conflicts", () => {
    expect(resolveUniqueName(["File"], "file")).toBe("file (1)");
  });

  it("returns empty string for empty desired name", () => {
    expect(resolveUniqueName(["a"], "")).toBe("");
  });

  it("returns empty string for whitespace-only desired name", () => {
    expect(resolveUniqueName(["a"], "   ")).toBe("");
  });

  it("handles names with dots but no extension correctly", () => {
    expect(resolveUniqueName(["my.file"], "my.file")).toBe("my (1).file");
  });
});
