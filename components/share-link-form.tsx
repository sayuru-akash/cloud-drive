"use client";

import { useActionState } from "react";
import { createShareLinkAction } from "@/app/(workspace)/files/actions";

type ShareLinkFormProps = {
  fileId: string;
};

const initialState: { error?: string; success?: boolean; url?: string } = {};

export function ShareLinkForm({ fileId }: ShareLinkFormProps) {
  const [state, formAction, isPending] = useActionState(
    createShareLinkAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-[1.25rem] border border-ink-200 bg-white p-4"
    >
      <input type="hidden" name="fileId" value={fileId} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <select
          name="mode"
          defaultValue="view"
          className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
        >
          <option value="view">View link</option>
          <option value="download">Download link</option>
        </select>
        <input
          name="expiryDays"
          type="number"
          min={1}
          max={30}
          defaultValue={7}
          className="w-28 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full border border-emerald-700/20 bg-emerald-700/8 px-4 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-700/15 disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create share link"}
        </button>
      </div>

      {state.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : state.url ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">Share link created</p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-white px-3 py-2 text-xs text-ink-800">
              {state.url}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(state.url!)}
              className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-medium text-emerald-800 transition hover:bg-white"
            >
              Copy
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
