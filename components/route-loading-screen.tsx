import { LoaderCircle } from "lucide-react";

export function RouteLoadingScreen({
  label = "Loading drive",
  workspace = false,
}: {
  label?: string;
  workspace?: boolean;
}) {
  if (workspace) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 md:px-6 lg:flex-row lg:px-10">
          <aside className="hidden h-[calc(100vh-2rem)] w-72 shrink-0 rounded-[2rem] border border-ink-200/80 bg-white/72 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur lg:block">
            <div className="h-8 w-32 rounded-full bg-ink-100" />
            <div className="mt-10 space-y-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 rounded-[1.25rem] bg-ink-100/80"
                />
              ))}
            </div>
            <div className="mt-auto rounded-[1.5rem] border border-ink-200/70 bg-white/85 p-4">
              <div className="h-4 w-24 rounded-full bg-ink-100" />
              <div className="mt-2 h-3 w-40 rounded-full bg-ink-100" />
            </div>
          </aside>

          <main className="min-w-0 flex-1 space-y-6">
            <section className="rounded-[2rem] border border-ink-200/80 bg-white/72 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur md:p-8">
              <div className="h-3 w-28 rounded-full bg-ink-100" />
              <div className="mt-4 h-10 w-64 rounded-[1.25rem] bg-ink-100" />
              <div className="mt-3 h-4 w-48 rounded-full bg-ink-100" />
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <section
                  key={index}
                  className="rounded-[2rem] border border-ink-200/80 bg-white/72 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur"
                >
                  <div className="h-5 w-5 rounded-full bg-ink-100" />
                  <div className="mt-4 h-3 w-24 rounded-full bg-ink-100" />
                  <div className="mt-3 h-8 w-28 rounded-[1rem] bg-ink-100" />
                  <div className="mt-2 h-3 w-16 rounded-full bg-ink-100" />
                </section>
              ))}
            </div>

            <section className="rounded-[2rem] border border-ink-200/80 bg-white/72 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
              <div className="h-6 w-28 rounded-full bg-ink-100" />
              <div className="mt-6 space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 rounded-[1.25rem] bg-ink-100/80"
                  />
                ))}
              </div>
            </section>
          </main>
        </div>

        <div className="pointer-events-none fixed inset-0 flex items-center justify-center bg-[rgba(247,244,238,0.36)] backdrop-blur-md">
          <div className="rounded-[2rem] border border-white/70 bg-white/88 px-5 py-4 shadow-[0_32px_120px_-56px_rgba(15,23,42,0.65)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <LoaderCircle className="h-4.5 w-4.5 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-950">{label}</p>
                <p className="text-xs text-ink-500">Preparing your drive</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="rounded-[2rem] border border-ink-200/80 bg-white/82 px-6 py-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <LoaderCircle className="h-4.5 w-4.5 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-950">{label}</p>
            <p className="text-xs text-ink-500">Please wait</p>
          </div>
        </div>
      </div>
    </main>
  );
}
