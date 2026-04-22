"use client";

import { useActionState } from "react";
import { Link2 } from "lucide-react";
import { createShareLinkAction } from "@/app/(workspace)/files/actions";
import { ActionForm, ActionSubmitButton } from "@/components/action-ui";

type ShareLinkFormProps = {
  fileId: string;
};

const initialState: { error?: string; success?: boolean; url?: string; notice?: string } = {};

export function ShareLinkForm({ fileId }: ShareLinkFormProps) {
  const [state, formAction] = useActionState(
    createShareLinkAction,
    initialState,
  );

  return (
    <ActionForm
      action={formAction}
      pendingLabel="Creating link"
      className="flex flex-col gap-3 rounded-[1.25rem] border border-ink-200 bg-white p-4"
    >
      <input type="hidden" name="fileId" value={fileId} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-600">Expires in</span>
          <input
            name="expiryDays"
            type="number"
            min={1}
            max={90}
            defaultValue={7}
            className="w-20 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
          />
          <span className="text-sm text-ink-600">days</span>
        </div>
        <ActionSubmitButton
          pendingLabel="Creating..."
          className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-700/8 px-4 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-700/15 disabled:opacity-60"
        >
          <Link2 className="h-4 w-4" />
          Create link
        </ActionSubmitButton>
      </div>

      <input
        name="notifyEmail"
        type="email"
        placeholder="Notify by email (optional)"
        className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900"
      />

      {state.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : state.url ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">Link created</p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-white px-3 py-2 text-xs text-ink-800">
              {state.url}
            </code>
            <a
              href={state.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-medium text-emerald-800 transition hover:bg-white"
            >
              Open link
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(state.url!)}
              className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-medium text-emerald-800 transition hover:bg-white"
            >
              Copy
            </button>
          </div>
          {state.notice ? (
            <p className="mt-2 text-xs text-emerald-800">{state.notice}</p>
          ) : null}
        </div>
      ) : null}
    </ActionForm>
  );
}
