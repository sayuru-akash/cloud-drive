import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { PasswordRecoveryPanel } from "@/components/password-recovery-panel";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your Cloud Drive password.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(25,122,104,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.1),transparent_30%),linear-gradient(180deg,#f7f3ec_0%,#f3efe6_44%,#f7f4ee_100%)]" />
      <div className="absolute inset-x-0 top-20 -z-10 h-64 bg-[radial-gradient(circle,rgba(255,255,255,0.82),transparent_62%)] blur-3xl" />

      <div className="w-full max-w-lg space-y-10">
        <BrandMark variant="minimal" />
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink-950">
            Forgot your password?
          </h1>
          <p className="text-lg leading-8 text-ink-700">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
        </div>
        <PasswordRecoveryPanel />
      </div>
    </main>
  );
}
