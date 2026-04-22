"use client";

import { useEffect, useRef, useState } from "react";

export function InlineRename({
  defaultValue,
  onSubmit,
  onCancel,
}: {
  defaultValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  async function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === defaultValue) {
      onCancel();
      return;
    }
    setIsPending(true);
    await onSubmit(trimmed);
    setIsPending(false);
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      onBlur={handleSubmit}
      disabled={isPending}
      className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-sm text-ink-950 outline-none ring-2 ring-emerald-200 disabled:opacity-50"
    />
  );
}
