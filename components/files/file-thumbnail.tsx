"use client";

import Image from "next/image";
import { useState } from "react";
import { FileIcon } from "@/components/file-icon";

export function FileThumbnail({
  fileId,
  mimeType,
  name,
  className = "",
}: {
  fileId: string;
  mimeType?: string | null;
  name: string;
  className?: string;
}) {
  const isImage = mimeType?.startsWith("image/");
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!isImage || error) {
    return (
      <div
        className={`flex items-center justify-center rounded-[1.25rem] bg-surface-strong ${className}`}
      >
        <FileIcon mimeType={mimeType} className="h-10 w-10 text-ink-400" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[1.25rem] bg-ink-100 ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-ink-200" />
      )}
      <Image
        src={`/api/files/${fileId}/preview`}
        alt={name}
        fill
        sizes="(max-width: 768px) 100vw, 320px"
        loading="lazy"
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
