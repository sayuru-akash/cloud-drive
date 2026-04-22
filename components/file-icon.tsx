import {
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Folder,
} from "lucide-react";

export function FileIcon({ mimeType, className = "h-5 w-5" }: { mimeType?: string | null; className?: string }) {
  const type = mimeType?.toLowerCase() ?? "";

  if (type.startsWith("image/")) {
    return <FileImage className={className} />;
  }
  if (type.startsWith("video/")) {
    return <FileVideo className={className} />;
  }
  if (type.startsWith("audio/")) {
    return <FileAudio className={className} />;
  }
  if (
    type.includes("pdf") ||
    type.includes("word") ||
    type.includes("document") ||
    type.includes("text") ||
    type.includes("csv")
  ) {
    return <FileText className={className} />;
  }

  return <File className={className} />;
}

export function FolderIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <Folder className={className} />;
}
