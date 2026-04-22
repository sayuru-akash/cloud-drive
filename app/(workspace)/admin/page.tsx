import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import {
  Activity,
  CheckCircle2,
  Link2,
  Users,
  XCircle,
} from "lucide-react";
import {
  updateAppSettingsAction,
  updateUserRoleAction,
  updateUserStatusAction,
} from "@/app/(workspace)/admin/actions";
import { requireAdminSession } from "@/lib/auth/session";
import { getAppSettings } from "@/lib/app-settings";
import { db } from "@/lib/db/client";
import { auditLogs, shareLinks, users } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  await requireAdminSession();

  const [userRows, auditRows, settings, shareRows] = await Promise.all([
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
    db
      .select({
        id: auditLogs.id,
        actionType: auditLogs.actionType,
        actorEmail: auditLogs.actorEmail,
        resourceType: auditLogs.resourceType,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(20),
    getAppSettings(),
    db
      .select({
        id: shareLinks.id,
        mode: shareLinks.mode,
        isRevoked: shareLinks.isRevoked,
        expiresAt: shareLinks.expiresAt,
        createdAt: shareLinks.createdAt,
      })
      .from(shareLinks)
      .orderBy(desc(shareLinks.createdAt))
      .limit(10),
  ]);

  const activeUsers = userRows.filter((u) => u.isActive !== false).length;
  const activeLinks = shareRows.filter((s) => !s.isRevoked).length;

  return (
    <main className="space-y-6">
      {/* Header */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Administration
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
          Workspace management
        </h1>
        <p className="mt-2 text-lg leading-8 text-ink-700">
          {userRows.length} users • {activeLinks} active links
        </p>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <Users className="h-5 w-5 text-ink-400" />
          <p className="mt-3 text-sm text-ink-500">Total users</p>
          <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink-950">
            {userRows.length}
          </p>
        </article>
        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="mt-3 text-sm text-ink-500">Active users</p>
          <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink-950">
            {activeUsers}
          </p>
        </article>
        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <Link2 className="h-5 w-5 text-ink-400" />
          <p className="mt-3 text-sm text-ink-500">Active links</p>
          <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink-950">
            {activeLinks}
          </p>
        </article>
        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <Activity className="h-5 w-5 text-ink-400" />
          <p className="mt-3 text-sm text-ink-500">Recent events</p>
          <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink-950">
            {auditRows.length}
          </p>
        </article>
      </section>

      {/* Users table */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-ink-950">
          Users
        </h2>

        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[44rem]">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_7rem_6rem_8rem] gap-4 px-4 pb-2 text-xs uppercase tracking-[0.18em] text-ink-500">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span className="text-right">Joined</span>
            </div>

            <div className="space-y-2">
              {userRows.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[1fr_1fr_7rem_6rem_8rem] items-center gap-4 rounded-[1.25rem] border border-ink-200/60 bg-white/70 px-4 py-3"
                >
                  <p className="truncate font-medium text-ink-950">
                    {user.name}
                  </p>
                  <p className="truncate text-sm text-ink-600">{user.email}</p>

                  <form
                    action={updateUserRoleAction}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role ?? "member"}
                      className="rounded-xl border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-900"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super admin</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-full border border-ink-300 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-ink-600 transition hover:border-ink-500 hover:bg-white"
                    >
                      Save
                    </button>
                  </form>

                  <form
                    action={updateUserStatusAction}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="isActive"
                      defaultValue={
                        user.isActive === false ? "false" : "true"
                      }
                      className="rounded-xl border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-900"
                    >
                      <option value="true">Active</option>
                      <option value="false">Disabled</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-full border border-ink-300 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-ink-600 transition hover:border-ink-500 hover:bg-white"
                    >
                      Save
                    </button>
                  </form>

                  <span className="text-right text-sm text-ink-500">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Settings + Audit + Shares */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* System settings */}
        <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-ink-950">
            Workspace settings
          </h2>
          <form
            action={updateAppSettingsAction}
            className="mt-5 space-y-4"
          >
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-ink-800"
                htmlFor="maxUploadSizeBytes"
              >
                Max upload size (bytes)
              </label>
              <input
                id="maxUploadSizeBytes"
                name="maxUploadSizeBytes"
                type="number"
                min={1}
                defaultValue={settings.maxUploadSizeBytes}
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-ink-800"
                htmlFor="defaultSoftDeleteRetentionDays"
              >
                Trash retention (days)
              </label>
              <input
                id="defaultSoftDeleteRetentionDays"
                name="defaultSoftDeleteRetentionDays"
                type="number"
                min={1}
                max={365}
                defaultValue={settings.defaultSoftDeleteRetentionDays}
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-ink-800"
                htmlFor="defaultShareExpiryDays"
              >
                Default share expiry (days)
              </label>
              <input
                id="defaultShareExpiryDays"
                name="defaultShareExpiryDays"
                type="number"
                min={1}
                max={90}
                defaultValue={settings.defaultShareExpiryDays}
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-ink-800"
                htmlFor="blockedFileExtensions"
              >
                Blocked file extensions
              </label>
              <textarea
                id="blockedFileExtensions"
                name="blockedFileExtensions"
                defaultValue={settings.blockedFileExtensions.join(", ")}
                rows={4}
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
            >
              Save settings
            </button>
          </form>
        </section>

        <div className="space-y-6">
          {/* Audit trail */}
          <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-ink-950">
              Audit trail
            </h2>
            <div className="mt-5 space-y-2">
              {auditRows.length === 0 ? (
                <p className="text-sm text-ink-600">No events yet.</p>
              ) : (
                auditRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-ink-200/60 bg-white/70 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-950">
                        {row.actionType}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {row.actorEmail ?? "system"} •{" "}
                        {row.resourceType ?? "resource"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-400">
                      {formatDate(row.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recent share links */}
          <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-ink-950">
              Recent share links
            </h2>
            <div className="mt-5 space-y-2">
              {shareRows.length === 0 ? (
                <p className="text-sm text-ink-600">No links yet.</p>
              ) : (
                shareRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-ink-200/60 bg-white/70 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {row.isRevoked ? (
                        <XCircle className="h-4 w-4 text-ink-400" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-ink-950 capitalize">
                          {row.mode}
                        </p>
                        <p className="text-xs text-ink-500">
                          {row.isRevoked
                            ? "Revoked"
                            : row.expiresAt
                              ? `Expires ${formatDate(row.expiresAt)}`
                              : "No expiry"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-ink-400">
                      {formatDate(row.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
