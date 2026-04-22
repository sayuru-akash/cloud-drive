"use client";

import { Upload } from "lucide-react";

export function UploadTrigger({
  fileInputRef,
  onQueue,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onQueue: (files: FileList | File[]) => void;
}) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            onQueue(event.target.files);
          }
          event.currentTarget.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-300 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
      >
        <Upload className="h-4 w-4" />
        Upload
      </button>
    </>
  );
}
