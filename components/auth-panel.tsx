"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({
              name,
              email,
              password,
            })
          : await authClient.signIn.email({
              email,
              password,
            });

      if (result.error) {
        setError(result.error.message ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 rounded-[2rem] border border-ink-200/80 bg-white/82 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
      <div className="inline-flex rounded-full border border-ink-200 bg-surface-strong p-1">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "sign-in" ? "bg-ink-950 text-white" : "text-ink-700"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "sign-up" ? "bg-ink-950 text-white" : "text-ink-700"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "sign-up" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-800" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              placeholder="Jane Doe"
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-800" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-800" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            placeholder="At least 10 characters"
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
          />
        </div>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800 disabled:opacity-60"
        >
          {isPending
            ? mode === "sign-up"
              ? "Creating account..."
              : "Signing in..."
            : mode === "sign-up"
              ? "Create account"
              : "Sign in"}
        </button>

        {mode === "sign-in" ? (
          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="text-sm font-medium text-emerald-800 transition hover:text-emerald-700"
            >
              Forgot password?
            </a>
          </div>
        ) : null}
      </form>
    </div>
  );
}
