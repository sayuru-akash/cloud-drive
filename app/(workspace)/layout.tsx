import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { WorkspaceNav } from "@/components/workspace-nav";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Operational workspace for files, sharing, deleted items, and admin controls.",
};

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSession();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-4 md:px-6 lg:px-10">
        <WorkspaceNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
