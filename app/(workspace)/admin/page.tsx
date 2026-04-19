import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { updateUserRoleAction } from "@/app/(workspace)/admin/actions";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { auditLogs, users } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  await requireAdminSession();

  const [userRows, auditRows] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
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
  ]);

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Admin controls
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
          User roles and audit visibility live here.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-700">
          This route is restricted to `admin` and `super_admin` sessions.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
            Users
          </h2>
          <div className="mt-5 space-y-4">
            {userRows.map((user) => (
              <div key={user.id} className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-ink-950">{user.name}</p>
                    <p className="mt-1 text-sm text-ink-600">{user.email}</p>
                  </div>
                  <form action={updateUserRoleAction} className="flex gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role ?? "member"}
                      className="rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-900"
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-800"
                    >
                      Save
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </article>

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
      </section>
    </main>
  );
}
