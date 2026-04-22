import "server-only";
import {
  type SQL,
  and,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  or,
  sql,
} from "drizzle-orm";
import { getAppSettings } from "@/lib/app-settings";
import { db } from "@/lib/db/client";
import { auditLogs, files, shareLinks, users } from "@/lib/db/schema";

export const AUDIT_PAGE_SIZE = 25;

export type AdminAuditFilters = {
  q: string;
  action: string;
  resource: string;
  page: number;
};

function buildAuditWhere(filters: Pick<AdminAuditFilters, "q" | "action" | "resource">) {
  const conditions: SQL[] = [];
  const query = filters.q.trim();

  if (query) {
    conditions.push(
      or(
        ilike(auditLogs.actionType, `%${query}%`),
        ilike(auditLogs.actorEmail, `%${query}%`),
        ilike(auditLogs.resourceType, `%${query}%`),
        ilike(auditLogs.resourceId, `%${query}%`),
      )!,
    );
  }

  if (filters.action && filters.action !== "all") {
    conditions.push(eq(auditLogs.actionType, filters.action));
  }

  if (filters.resource && filters.resource !== "all") {
    conditions.push(eq(auditLogs.resourceType, filters.resource));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function getAdminOverviewData() {
  const now = new Date();
  const [userRows, settings, shareSummaryRow, storageSummaryRow] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt),
    getAppSettings(),
    db
      .select({
        total: count(),
        active: sql<number>`coalesce(sum(case when ${shareLinks.isRevoked} = false and (${shareLinks.expiresAt} is null or ${shareLinks.expiresAt} > ${now}) then 1 else 0 end), 0)`,
      })
      .from(shareLinks)
      .then((rows) => rows[0]),
    db
      .select({
        files: count(),
        bytes: sql<number>`coalesce(sum(${files.sizeBytes}), 0)`,
      })
      .from(files)
      .where(and(eq(files.isDeleted, false), eq(files.status, "ready")))
      .then((rows) => rows[0]),
  ]);

  const totalUsers = userRows.length;
  const disabledUsers = userRows.filter((user) => user.isActive === false).length;
  const activeLinks = Number(shareSummaryRow?.active ?? 0);
  const totalLinks = Number(shareSummaryRow?.total ?? 0);
  const inactiveLinks = Math.max(totalLinks - activeLinks, 0);
  const storageUsedBytes = Number(storageSummaryRow?.bytes ?? 0);
  const storedFiles = Number(storageSummaryRow?.files ?? 0);

  return {
    userRows,
    settings,
    summary: {
      totalUsers,
      disabledUsers,
      activeLinks,
      inactiveLinks,
      totalLinks,
      storageUsedBytes,
      storedFiles,
    },
  };
}

export async function getAdminAuditData(filters: AdminAuditFilters) {
  const whereClause = buildAuditWhere(filters);
  const requestedPage = Number.isFinite(filters.page) ? filters.page : 1;

  const [totalRow, rows, actionRows, resourceRows] = await Promise.all([
    (whereClause
      ? db.select({ value: count() }).from(auditLogs).where(whereClause)
      : db.select({ value: count() }).from(auditLogs)
    ).then((result) => result[0]),
    (whereClause
      ? db
          .select({
            id: auditLogs.id,
            actionType: auditLogs.actionType,
            actorEmail: auditLogs.actorEmail,
            resourceType: auditLogs.resourceType,
            resourceId: auditLogs.resourceId,
            ipAddress: auditLogs.ipAddress,
            userAgent: auditLogs.userAgent,
            createdAt: auditLogs.createdAt,
          })
          .from(auditLogs)
          .where(whereClause)
      : db
          .select({
            id: auditLogs.id,
            actionType: auditLogs.actionType,
            actorEmail: auditLogs.actorEmail,
            resourceType: auditLogs.resourceType,
            resourceId: auditLogs.resourceId,
            ipAddress: auditLogs.ipAddress,
            userAgent: auditLogs.userAgent,
            createdAt: auditLogs.createdAt,
          })
          .from(auditLogs)
    )
      .orderBy(desc(auditLogs.createdAt))
      .limit(AUDIT_PAGE_SIZE)
      .offset(Math.max(requestedPage - 1, 0) * AUDIT_PAGE_SIZE),
    db
      .selectDistinct({
        value: auditLogs.actionType,
      })
      .from(auditLogs)
      .orderBy(auditLogs.actionType),
    db
      .selectDistinct({
        value: auditLogs.resourceType,
      })
      .from(auditLogs)
      .where(isNotNull(auditLogs.resourceType))
      .orderBy(auditLogs.resourceType),
  ]);

  const totalItems = totalRow?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / AUDIT_PAGE_SIZE));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);

  const pagedRows =
    currentPage === requestedPage
      ? rows
      : await (whereClause
          ? db
              .select({
                id: auditLogs.id,
                actionType: auditLogs.actionType,
                actorEmail: auditLogs.actorEmail,
                resourceType: auditLogs.resourceType,
                resourceId: auditLogs.resourceId,
                ipAddress: auditLogs.ipAddress,
                userAgent: auditLogs.userAgent,
                createdAt: auditLogs.createdAt,
              })
              .from(auditLogs)
              .where(whereClause)
          : db
              .select({
                id: auditLogs.id,
                actionType: auditLogs.actionType,
                actorEmail: auditLogs.actorEmail,
                resourceType: auditLogs.resourceType,
                resourceId: auditLogs.resourceId,
                ipAddress: auditLogs.ipAddress,
                userAgent: auditLogs.userAgent,
                createdAt: auditLogs.createdAt,
              })
              .from(auditLogs)
        )
          .orderBy(desc(auditLogs.createdAt))
          .limit(AUDIT_PAGE_SIZE)
          .offset((currentPage - 1) * AUDIT_PAGE_SIZE);

  return {
    rows: pagedRows,
    filters,
    options: {
      actions: actionRows.map((row) => row.value),
      resources: resourceRows
        .map((row) => row.value)
        .filter((value): value is string => Boolean(value)),
    },
    pagination: {
      currentPage,
      totalItems,
      totalPages,
      pageSize: AUDIT_PAGE_SIZE,
      startItem: totalItems === 0 ? 0 : (currentPage - 1) * AUDIT_PAGE_SIZE + 1,
      endItem: Math.min(currentPage * AUDIT_PAGE_SIZE, totalItems),
    },
  };
}
