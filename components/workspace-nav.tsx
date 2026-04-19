"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  Link2,
  Shield,
  Settings2,
  Trash2,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const items: ReadonlyArray<{
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/files", label: "Files", icon: FolderKanban },
  { href: "/shared", label: "Shared", icon: Link2 },
  { href: "/deleted", label: "Deleted", icon: Trash2 },
  { href: "/settings", label: "Settings", icon: Settings2 },
  { href: "/admin", label: "Admin", icon: Shield },
];

export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 rounded-[1.75rem] border border-ink-200/80 bg-white/78 p-4 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <BrandMark />
          <Link
            href="/api/health"
            className="rounded-full border border-ink-300 px-3 py-2 text-xs font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
          >
            Health
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-ink-950 text-white"
                    : "border border-ink-200 bg-white text-ink-700"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${active ? "text-emerald-300" : "text-emerald-700"}`}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[2rem] border border-ink-200/80 bg-white/78 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur lg:flex">
        <BrandMark />
        <div className="mt-10 space-y-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between rounded-[1.25rem] px-4 py-3 text-sm transition ${
                  active
                    ? "bg-ink-950 text-white"
                    : "text-ink-700 hover:bg-ink-950/5 hover:text-ink-950"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${active ? "text-emerald-300" : "text-emerald-700"}`}
                  />
                  {label}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${active ? "bg-emerald-300" : "bg-transparent"}`}
                />
              </Link>
            );
          })}
        </div>

        <div className="mt-auto rounded-[1.5rem] border border-ink-200/80 bg-[linear-gradient(180deg,rgba(25,122,104,0.08),rgba(25,122,104,0.02))] p-4">
          <p className="text-sm font-medium text-ink-950">Foundation status</p>
          <p className="mt-2 text-sm leading-7 text-ink-600">
            Routes, metadata, health checks, env scaffolding, and admin-facing
            surfaces are ready for integration work.
          </p>
        </div>
      </aside>
    </>
  );
}
