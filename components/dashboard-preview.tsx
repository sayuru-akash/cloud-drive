import { FileText, FolderKanban, LayoutDashboard, Link2, Trash2 } from "lucide-react";

const files = [
  {
    name: "Q2 Financial Review.xlsx",
    meta: "Modified 2 hours ago",
    badge: "Shared",
  },
  {
    name: "Brand Guidelines v3.pdf",
    meta: "Modified yesterday",
    badge: "Private",
  },
  {
    name: "Onboarding Checklist.docx",
    meta: "Modified 3 days ago",
    badge: "Private",
  },
];

const activities = [
  "You uploaded Q2 Financial Review.xlsx",
  "Alex shared Brand Guidelines with the team",
  "Maya restored a file from trash",
];

export function DashboardPreview() {
  return (
    <div className="animate-drift relative">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_top,rgba(25,122,104,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.12),transparent_34%)] blur-2xl" />
      <div className="overflow-hidden rounded-[2.25rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,255,255,0.52))] shadow-[0_40px_120px_-56px_rgba(15,23,42,0.6)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-ink-200/60 px-6 py-4">
          <div>
            <p className="text-sm font-medium text-ink-950">Company files</p>
            <p className="text-sm text-ink-600">
              24 files, 3 shared
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-700/10 px-3 py-1 text-xs font-medium text-emerald-800">
              All good
            </span>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="border-b border-ink-200/60 bg-white/70 p-5 lg:border-b-0 lg:border-r">
            <div className="space-y-1 text-sm text-ink-700">
              <div className="flex items-center gap-3 rounded-2xl bg-ink-950 px-4 py-3 text-white">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                <FolderKanban className="h-4 w-4 text-emerald-700" />
                Files
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                <Link2 className="h-4 w-4 text-emerald-700" />
                Shared
              </div>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                <Trash2 className="h-4 w-4 text-emerald-700" />
                Trash
              </div>
            </div>
          </aside>

          <div className="space-y-6 p-6">
            <section className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-ink-500">
                Recent files
              </p>
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between rounded-[1.4rem] border border-ink-200/70 bg-white/88 px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-ink-500" />
                      <div>
                        <p className="font-medium text-ink-950">{file.name}</p>
                        <p className="text-sm text-ink-600">{file.meta}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${file.badge === "Shared" ? "bg-emerald-700/10 text-emerald-800" : "bg-ink-100 text-ink-600"}`}>
                      {file.badge}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {activities.map((activity, index) => (
                <div
                  key={activity}
                  className="rounded-[1.5rem] border border-ink-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,244,238,0.82))] p-4"
                >
                  <p className="font-mono text-xs text-ink-500">0{index + 1}</p>
                  <p className="mt-3 text-sm leading-7 text-ink-700">{activity}</p>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
