import Link from "next/link";

export function BrandMark({ variant = "default" }: { variant?: "default" | "minimal" }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3 text-ink-950 transition hover:opacity-90"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink-950">
        <span className="absolute h-4 w-4 rounded-full bg-emerald-400" />
      </span>
      <span className="flex flex-col">
        <span className="text-base font-semibold tracking-[-0.05em]">
          Cloud Drive
        </span>
        {variant === "default" && (
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
            Internal file ops
          </span>
        )}
      </span>
    </Link>
  );
}
