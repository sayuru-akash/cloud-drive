import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { PasswordRecoveryPanel } from "@/components/password-recovery-panel";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-lg space-y-8">
        <BrandMark />
        <PasswordRecoveryPanel />
      </div>
    </main>
  );
}
