export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-ink-300 border-t-emerald-700" />
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-ink-500">
          Loading workspace
        </p>
      </div>
    </main>
  );
}
