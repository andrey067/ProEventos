import { useEffect } from "react";
import { ModalMotion } from "@/shared/motion";

const btnOutline =
  "motion-press inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface";
const btnDanger =
  "motion-press inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90";

export type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = "Confirmar",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  return (
    <ModalMotion open={open} onCancel={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-md rounded-[length:var(--radius-control)] border border-line bg-panel p-6 shadow-lg"
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold tracking-tight text-ink"
        >
          {title}
        </h2>
        <p id="confirm-dialog-message" className="mt-2 text-sm text-muted">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className={btnOutline} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={btnDanger} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalMotion>
  );
}
