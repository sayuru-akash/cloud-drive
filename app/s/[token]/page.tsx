import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { getActivePublicShareByToken } from "@/lib/shares";

export const metadata: Metadata = {
  title: "Shared file",
  description: "A file shared with you through Cloud Drive.",
};

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const share = await getActivePublicShareByToken(token);

  if (!share) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(25,122,104,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.1),transparent_30%),linear-gradient(180deg,#f7f3ec_0%,#f3efe6_44%,#f7f4ee_100%)]" />
        <div className="absolute inset-x-0 top-20 -z-10 h-64 bg-[radial-gradient(circle,rgba(255,255,255,0.82),transparent_62%)] blur-3xl" />

        <div className="w-full max-w-xl rounded-[2rem] border border-ink-200/80 bg-white/82 p-10 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
          <p className="font-mono text-sm text-ink-500">Invalid link</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
            This link is unavailable.
          </h1>
          <p className="mt-3 text-lg leading-8 text-ink-700">
            It may have expired, been revoked, or the file was deleted.
          </p>
        </div>
      </main>
    );
  }

  const downloadUrl = `/api/public-share/${token}/download`;

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(25,122,104,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.1),transparent_30%),linear-gradient(180deg,#f7f3ec_0%,#f3efe6_44%,#f7f4ee_100%)]" />
      <div className="absolute inset-x-0 top-20 -z-10 h-64 bg-[radial-gradient(circle,rgba(255,255,255,0.82),transparent_62%)] blur-3xl" />

      <div className="w-full max-w-3xl rounded-[2rem] border border-ink-200/80 bg-white/82 p-10 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="font-mono text-sm text-ink-500">Shared file</p>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-emerald-700" />
              <h1 className="text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
                {share.fileName}
              </h1>
            </div>
            <p className="text-lg leading-8 text-ink-700">
              Someone shared this file with you through Cloud Drive.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-700/10 px-4 py-2 text-sm font-medium text-emerald-800">
              <Download className="h-4 w-4" />
              Download
            </span>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
          <Link
            href="/"
            className="rounded-full border border-ink-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:border-ink-500 hover:bg-white"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
