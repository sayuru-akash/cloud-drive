"use client";

import type {
  ButtonHTMLAttributes,
  ComponentProps,
  PropsWithChildren,
  ReactNode,
} from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useFormStatus } from "react-dom";

type PendingRegistry = Record<string, string | undefined>;

type ConfirmTone = "default" | "danger";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type ConfirmState = ConfirmOptions & {
  resolve: (accepted: boolean) => void;
};

type ActionUiContextValue = {
  setPendingState: (id: string, pending: boolean, label?: string) => void;
  runWithPending: <T>(label: string, task: () => Promise<T>) => Promise<T>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ActionUiContext = createContext<ActionUiContextValue | null>(null);

function LoadingOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(247,244,238,0.52)] backdrop-blur-md">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 px-5 py-4 shadow-[0_32px_120px_-56px_rgba(15,23,42,0.65)]">
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <LoaderCircle className="h-4.5 w-4.5 animate-spin" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-950">{label}</p>
            <p className="text-xs text-ink-500">Please wait</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  tone = "default",
  onClose,
}: ConfirmOptions & { onClose: (accepted: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose(false);
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(15,23,42,0.28)] p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-[0_36px_120px_-56px_rgba(15,23,42,0.72)]">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
        <div className="flex items-start gap-4">
          <div
            className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              tone === "danger"
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <TriangleAlert className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-ink-950">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-ink-600">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onClose(false)}
            className="rounded-full border border-ink-300 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:border-ink-500 hover:bg-white"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            className={`rounded-full px-4 py-2.5 text-sm font-medium text-white transition ${
              tone === "danger"
                ? "bg-red-600 hover:bg-red-500"
                : "bg-ink-950 hover:bg-ink-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ActionUiProvider({ children }: PropsWithChildren) {
  const [pendingRegistry, setPendingRegistry] = useState<PendingRegistry>({});
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const setPendingState = useCallback(
    (id: string, pending: boolean, label?: string) => {
      setPendingRegistry((current) => {
        if (pending) {
          if (current[id] === label) {
            return current;
          }

          return {
            ...current,
            [id]: label,
          };
        }

        if (!(id in current)) {
          return current;
        }

        const next = { ...current };
        delete next[id];
        return next;
      });
    },
    [],
  );

  const runWithPending = useCallback(
    async <T,>(label: string, task: () => Promise<T>) => {
      const id = `manual-${crypto.randomUUID()}`;
      setPendingState(id, true, label);

      try {
        return await task();
      } finally {
        setPendingState(id, false);
      }
    },
    [setPendingState],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({
          ...options,
          resolve,
        });
      }),
    [],
  );

  const pendingLabel = useMemo(() => {
    const labels = Object.values(pendingRegistry);
    return labels.at(-1) ?? "Working";
  }, [pendingRegistry]);

  const hasPending = Object.keys(pendingRegistry).length > 0;

  useEffect(() => {
    if (!hasPending && !confirmState) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [confirmState, hasPending]);

  const value = useMemo<ActionUiContextValue>(
    () => ({
      setPendingState,
      runWithPending,
      confirm,
    }),
    [confirm, runWithPending, setPendingState],
  );

  return (
    <ActionUiContext.Provider value={value}>
      {children}
      {hasPending ? <LoadingOverlay label={pendingLabel} /> : null}
      {confirmState ? (
        <ConfirmDialog
          {...confirmState}
          onClose={(accepted) => {
            confirmState.resolve(accepted);
            setConfirmState(null);
          }}
        />
      ) : null}
    </ActionUiContext.Provider>
  );
}

function useActionUiContext() {
  const context = useContext(ActionUiContext);

  if (!context) {
    throw new Error("Action UI components must be used inside ActionUiProvider.");
  }

  return context;
}

export function usePendingAction(active: boolean, label = "Working") {
  const id = useId();
  const { setPendingState } = useActionUiContext();

  useEffect(() => {
    setPendingState(id, active, label);

    return () => {
      setPendingState(id, false);
    };
  }, [active, id, label, setPendingState]);
}

export function useActionConfirm() {
  return useActionUiContext().confirm;
}

export function useActionRunner() {
  return useActionUiContext().runWithPending;
}

function ActionFormPendingBridge({ label }: { label?: string }) {
  const { pending } = useFormStatus();
  usePendingAction(pending, label);
  return null;
}

type ActionFormProps = ComponentProps<"form"> & {
  pendingLabel?: string;
};

export function ActionForm({
  children,
  pendingLabel = "Working",
  ...props
}: ActionFormProps) {
  return (
    <form {...props}>
      <ActionFormPendingBridge label={pendingLabel} />
      {children}
    </form>
  );
}

type ActionSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
  pendingIcon?: ReactNode;
};

export function ActionSubmitButton({
  children,
  className,
  disabled,
  pendingLabel,
  pendingIcon,
  ...props
}: ActionSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={disabled || pending}
      className={className}
    >
      {pending && pendingLabel ? (
        <>
          {pendingIcon ?? <LoaderCircle className="h-4 w-4 animate-spin" />}
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

type ConfirmSubmitButtonProps = Omit<ActionSubmitButtonProps, "type"> &
  ConfirmOptions;

export function ConfirmSubmitButton({
  children,
  className,
  confirmLabel,
  cancelLabel,
  description,
  disabled,
  pendingIcon,
  pendingLabel,
  title,
  tone = "danger",
  ...props
}: ConfirmSubmitButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();
  const confirm = useActionConfirm();

  async function handleClick() {
    const accepted = await confirm({
      title,
      description,
      confirmLabel,
      cancelLabel,
      tone,
    });

    if (!accepted) {
      return;
    }

    buttonRef.current?.form?.requestSubmit();
  }

  return (
    <button
      {...props}
      ref={buttonRef}
      type="button"
      disabled={disabled || pending}
      onClick={() => void handleClick()}
      className={className}
    >
      {pending && pendingLabel ? (
        <>
          {pendingIcon ?? <LoaderCircle className="h-4 w-4 animate-spin" />}
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
