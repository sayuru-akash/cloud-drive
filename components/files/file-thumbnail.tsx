"use client";

import { FileIcon } from "@/components/file-icon";

export function FileThumbnail({
  mimeType,
  className = "",
}: {
  mimeType?: string | null;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-[1.25rem] bg-surface-strong ${className}`}
    >
      <FileIcon mimeType={mimeType} className="h-10 w-10 text-ink-400" />
    </div>
  );
}
