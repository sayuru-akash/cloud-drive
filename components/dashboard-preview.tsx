import { FolderOpen, Link2, Shield, UploadCloud } from "lucide-react";

const previewFolders = [
  "Finance / Q2 planning",
  "Contracts / Vendor renewals",
  "Operations / Regional playbooks",
];

const previewEvents = [
  "Signed upload URL issued for pricing-model-v7.xlsx",
  "Public view link revoked by admin policy",
  "Deleted folder restored inside retention window",
];

export function DashboardPreview() {
  return (
    <div className="animate-drift relative">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_top,rgba(25,122,104,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.12),transparent_34%)] blur-2xl" />
      <div className="overflow-hidden rounded-[2.25rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,255,255,0.52))] shadow-[0_40px_120px_-56px_rgba(15,23,42,0.6)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-ink-200/60 px-6 py-4">
          <div>
            <p className="text-sm font-medium text-ink-950">Workspace control plane</p>
            <p className="text-sm text-ink-600">
              Uploads, visibility, audit, and recovery
            </p>
          </div>
          <div className="rounded-full bg-emerald-700/10 px-3 py-1 text-xs font-medium text-emerald-800">
            Ready for auth + storage wiring
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="border-b border-ink-200/60 bg-white/70 p-5 lg:border-b-0 lg:border-r">
            <div className="space-y-2 text-sm text-ink-700">
              <div className="flex items-center gap-3 rounded-2xl bg-ink-950 px-4 py-3 text-white">
                <FolderOpen className="h-4 w-4" />
                Dashboard
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                <UploadCloud className="h-4 w-4 text-emerald-700" />
                Upload sessions
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                <Link2 className="h-4 w-4 text-emerald-700" />
                Shared links
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                <Shield className="h-4 w-4 text-emerald-700" />
                Admin rules
              </div>
            </div>
          </aside>

          <div className="space-y-6 p-6">
            <section className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-ink-500">
                Current folders
              </p>
              <div className="space-y-3">
                {previewFolders.map((folder) => (
                  <div
                    key={folder}
                    className="flex items-center justify-between rounded-[1.4rem] border border-ink-200/70 bg-white/88 px-4 py-4"
                  >
                    <div>
                      <p className="font-medium text-ink-950">{folder}</p>
                      <p className="text-sm text-ink-600">
                        Workspace visibility with audit trail
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-700/10 px-3 py-1 text-xs font-medium text-emerald-800">
                      Synced
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {previewEvents.map((event, index) => (
                <div
                  key={event}
                  className="rounded-[1.5rem] border border-ink-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,244,238,0.82))] p-4"
                >
                  <p className="font-mono text-xs text-ink-500">0{index + 1}</p>
                  <p className="mt-3 text-sm leading-7 text-ink-700">{event}</p>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
