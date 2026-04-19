"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function PasswordRecoveryPanel({
  token,
  error,
}: {
  token?: string | null;
  error?: string | null;
}) {
  const router = useRouter();
  const [requestEmail, setRequestEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(error ?? null);
  const [isPending, startTransition] = useTransition();
  const isResetMode = Boolean(token);

  function handleRequestReset() {
    setLocalError(null);
    setMessage(null);

    startTransition(async () => {
      const redirectTo = `${window.location.origin}/reset-password`;
      const result = await authClient.requestPasswordReset({
        email: requestEmail.trim(),
        redirectTo,
      });

      if (result.error) {
        setLocalError(result.error.message ?? "Could not send reset email.");
        return;
      }

      setMessage("If that account exists, a password reset email has been sent.");
    });
  }

  function handleResetPassword() {
    setLocalError(null);
    setMessage(null);

    if (!token) {
      setLocalError("Reset token is missing.");
      return;
    }

    if (password.length < 10) {
      setLocalError("Password must be at least 10 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await authClient.resetPassword({
        token,
        newPassword: password,
      });

      if (result.error) {
        setLocalError(result.error.message ?? "Password reset failed.");
        return;
      }

      router.push("/login?reset=success");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 rounded-[2rem] border border-ink-200/80 bg-white/82 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          {isResetMode ? "Reset password" : "Recover access"}
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.05em] text-ink-950">
          {isResetMode ? "Choose a new password." : "Send a reset link to your email."}
        </h1>
      </div>

      <div className="space-y-4">
        {isResetMode ? (
          <>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              minLength={10}
              autoComplete="new-password"
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              minLength={10}
              autoComplete="new-password"
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={handleResetPassword}
              className="inline-flex w-full items-center justify-center rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800 disabled:opacity-60"
            >
              {isPending ? "Resetting..." : "Reset password"}
            </button>
          </>
        ) : (
          <>
            <input
              type="email"
              value={requestEmail}
              onChange={(event) => setRequestEmail(event.target.value)}
              placeholder="Work email"
              autoComplete="email"
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={handleRequestReset}
              className="inline-flex w-full items-center justify-center rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800 disabled:opacity-60"
            >
              {isPending ? "Sending..." : "Send reset email"}
            </button>
          </>
        )}

        {localError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {localError}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
