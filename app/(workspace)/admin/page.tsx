import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import {
  updateAppSettingsAction,
  updateUserRoleAction,
  updateUserStatusAction,
} from "@/app/(workspace)/admin/actions";
import { requireAdminSession } from "@/lib/auth/session";
import { getAppSettings } from "@/lib/app-settings";
import { db } from "@/lib/db/client";
import { auditLogs, shareLinks, users } from "@/lib/db/schema";

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

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Admin controls
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
          Users, policy settings, share links, and audit visibility live here.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-700 sm:text-base sm:leading-8">
          This route is restricted to `admin` and `super_admin` sessions with
          server-side enforcement on every request.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
            Users
          </h2>
          <div className="mt-5 space-y-4">
            {userRows.map((user) => (
              <div key={user.id} className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="font-medium text-ink-950">{user.name}</p>
                    <p className="mt-1 text-sm text-ink-600">{user.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-500">
                      {user.isActive === false ? "disabled" : "active"}
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <form action={updateUserRoleAction} className="flex flex-col gap-2 sm:flex-row">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role ?? "member"}
                        className="flex-1 rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-900"
                      >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-800"
                      >
                        Save role
                      </button>
                    </form>

                    <form action={updateUserStatusAction} className="flex flex-col gap-2 sm:flex-row">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="isActive"
                        defaultValue={user.isActive === false ? "false" : "true"}
                        className="flex-1 rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-900"
                      >
                        <option value="true">active</option>
                        <option value="false">disabled</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
                      >
                        Save status
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
            System settings
          </h2>
          <form action={updateAppSettingsAction} className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-800" htmlFor="maxUploadSizeBytes">
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
              <label className="text-sm font-medium text-ink-800" htmlFor="defaultSoftDeleteRetentionDays">
                Soft-delete retention (days)
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
              <label className="text-sm font-medium text-ink-800" htmlFor="defaultShareExpiryDays">
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
              <label className="text-sm font-medium text-ink-800" htmlFor="blockedFileExtensions">
                Blocked file extensions
              </label>
              <textarea
                id="blockedFileExtensions"
                name="blockedFileExtensions"
                defaultValue={settings.blockedFileExtensions.join(", ")}
                rows={5}
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
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
            Audit trail
          </h2>
          <div className="mt-5 space-y-4">
            {auditRows.map((row) => (
              <div key={row.id} className="border-t border-ink-200/80 pt-4 first:border-none first:pt-0">
                <p className="font-medium text-ink-950">{row.actionType}</p>
                <p className="mt-1 text-sm text-ink-600">
                  {row.actorEmail ?? "system"} • {row.resourceType ?? "resource"}
                </p>
                <p className="mt-2 font-mono text-xs text-ink-500">
                  {new Date(row.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
            Recent share links
          </h2>
          <div className="mt-5 space-y-4">
            {shareRows.map((row) => (
              <div key={row.id} className="rounded-[1.25rem] border border-ink-200 bg-surface-strong p-4">
                <p className="font-medium text-ink-950">{row.mode}</p>
                <p className="mt-1 text-sm text-ink-600">
                  {row.isRevoked ? "Revoked" : "Active"} •{" "}
                  {row.expiresAt
                    ? `Expires ${new Date(row.expiresAt).toLocaleString()}`
                    : "No expiry"}
                </p>
                <p className="mt-2 font-mono text-xs text-ink-500">
                  Created {new Date(row.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
