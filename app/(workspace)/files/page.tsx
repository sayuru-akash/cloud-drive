import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import {
  getFolderAncestors,
  getFolderContents,
  getFolderTree,
} from "@/lib/drive";
import { FilesShell } from "@/components/files/files-shell";

export const metadata: Metadata = {
  title: "Files",
};

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{
    folder?: string;
    q?: string;
    type?: string;
    visibility?: "all" | "private" | "workspace";
    sort?:
      | "updated-desc"
      | "updated-asc"
      | "name-asc"
      | "name-desc"
      | "size-desc"
      | "size-asc";
  }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const folderId = params.folder ?? null;
  const sort = params.sort ?? "updated-desc";

  const [breadcrumbs, contents, folderTree] = await Promise.all([
    getFolderAncestors(folderId),
    getFolderContents({
      folderId,
      userId: session.user.id,
      userRole: session.user.role,
      query: params.q,
      fileType: params.type,
      visibility: params.visibility ?? "all",
      sort,
    }),
    getFolderTree(session.user.id, session.user.role),
  ]);

  return (
    <FilesShell
      userId={session.user.id}
      userRole={session.user.role}
      folderId={folderId}
      breadcrumbs={breadcrumbs}
      folders={contents.folders}
      files={contents.files}
      availableFileTypes={contents.availableFileTypes}
      folderTree={folderTree}
      params={{
        q: params.q,
        type: params.type,
        visibility: params.visibility,
        sort: params.sort,
      }}
    />
  );
}
