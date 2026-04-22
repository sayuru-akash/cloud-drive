import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Cloud Drive handles your data.",
};

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen bg-background">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(25,122,104,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.1),transparent_30%),linear-gradient(180deg,#f7f3ec_0%,#f3efe6_44%,#f7f4ee_100%)]" />
      <div className="absolute inset-x-0 top-20 -z-10 h-64 bg-[radial-gradient(circle,rgba(255,255,255,0.82),transparent_62%)] blur-3xl" />

      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6 lg:px-10">
        <BrandMark variant="minimal" />
        <Link
          href="/"
          className="text-sm font-medium text-ink-700 transition hover:text-ink-950"
        >
          Back home
        </Link>
      </header>

      <article className="mx-auto w-full max-w-3xl px-6 pb-20 pt-4 lg:px-10">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">
            Legal
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink-950">
            Privacy Policy
          </h1>
          <p className="text-base leading-8 text-ink-700">
            Last updated: April 2026
          </p>
        </div>

        <div className="mt-12 space-y-12">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-ink-950">
              What we collect
            </h2>
            <p className="text-base leading-8 text-ink-700">
              We collect only what is necessary to run the service:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-base leading-8 text-ink-700">
              <li>
                <strong>Account information:</strong> Your name, email address,
                and password (stored as a secure hash).
              </li>
              <li>
                <strong>Files and folders:</strong> The content you upload,
                including file names, sizes, types, and folder structures.
              </li>
              <li>
                <strong>Usage data:</strong> Basic activity logs such as uploads,
                downloads, shares, and deletions for audit and security purposes.
              </li>
              <li>
                <strong>Session data:</strong> Authentication tokens to keep you
                signed in securely.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-ink-950">
              How we use your data
            </h2>
            <p className="text-base leading-8 text-ink-700">
              We use your data to provide, maintain, and improve the service:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-base leading-8 text-ink-700">
              <li>To authenticate you and keep your account secure.</li>
              <li>To store and serve your files when you request them.</li>
              <li>To generate share links and manage access controls.</li>
              <li>To maintain audit logs for workspace security and compliance.</li>
              <li>To contact you about account-related issues or security alerts.</li>
            </ul>
            <p className="text-base leading-8 text-ink-700">
              We do not sell your data. We do not use your files for advertising
              or training machine learning models.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-ink-950">
              Data storage and security
            </h2>
            <p className="text-base leading-8 text-ink-700">
              Your files are stored in encrypted object storage with access
              controlled through short-lived signed URLs. File metadata lives in a
              secured database with strict access controls. All traffic between
              your browser and our servers is encrypted with TLS.
            </p>
            <p className="text-base leading-8 text-ink-700">
              We enforce role-based access within workspaces. Admins can manage
              users, review audit logs, and set policies such as upload size
              limits and blocked file extensions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-ink-950">
              Sharing and third parties
            </h2>
            <p className="text-base leading-8 text-ink-700">
              We do not share your data with third parties except when necessary
              to operate the service:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-base leading-8 text-ink-700">
              <li>
                <strong>Cloud infrastructure:</strong> Our hosting and storage
                providers process data on our behalf under strict confidentiality
                agreements.
              </li>
              <li>
                <strong>Email delivery:</strong> We use a trusted email service to
                send password resets and account notifications.
              </li>
              <li>
                <strong>Legal requirements:</strong> We may disclose data if
                required by law or to protect our rights and users.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-ink-950">
              Your rights
            </h2>
            <p className="text-base leading-8 text-ink-700">
              You have control over your data:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-base leading-8 text-ink-700">
              <li>
                <strong>Access:</strong> View and download your files at any time.
              </li>
              <li>
                <strong>Correction:</strong> Update your account information from
                your settings.
              </li>
              <li>
                <strong>Deletion:</strong> Delete files, folders, or your entire
                account. Deleted files remain recoverable within the workspace
                retention window, after which they are permanently removed.
              </li>
              <li>
                <strong>Portability:</strong> Download your files in their
                original formats.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-ink-950">
              Retention
            </h2>
            <p className="text-base leading-8 text-ink-700">
              We keep your data for as long as your account is active. Files you
              delete are held in a recovery state for the workspace retention
              period (typically 30 days) before permanent deletion. Audit logs are
              retained for security and compliance purposes.
            </p>
            <p className="text-base leading-8 text-ink-700">
              If you delete your account, we begin removing your data
              immediately, with complete deletion within 30 days except where
              retention is required by law.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-ink-950">
              Cookies
            </h2>
            <p className="text-base leading-8 text-ink-700">
              We use essential cookies to maintain your session and keep you
              signed in. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-ink-950">
              Changes to this policy
            </h2>
            <p className="text-base leading-8 text-ink-700">
              We may update this policy as the service evolves. If we make
              significant changes, we will notify you through the application or
              by email. Continued use of the service after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-ink-950">
              Contact
            </h2>
            <p className="text-base leading-8 text-ink-700">
              If you have questions about this policy or how we handle your data,
              contact your workspace administrator.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
