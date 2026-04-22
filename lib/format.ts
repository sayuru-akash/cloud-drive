export function formatBytes(bytes: number | null | undefined): string {
  const value = Number(bytes ?? 0);
  if (value === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(value) / Math.log(k));
  return `${parseFloat((value / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const isFuture = diff > 0;
  const absoluteDiff = Math.abs(diff);
  const minutes = Math.floor(absoluteDiff / 60000);
  const hours = Math.floor(absoluteDiff / 3600000);
  const days = Math.floor(absoluteDiff / 86400000);

  if (minutes < 1) return isFuture ? "In <1m" : "Just now";
  if (minutes < 60) return isFuture ? `In ${minutes}m` : `${minutes}m ago`;
  if (hours < 24) return isFuture ? `In ${hours}h` : `${hours}h ago`;
  if (days < 7) return isFuture ? `In ${days}d` : `${days}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(
  date: Date | string | null | undefined,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
