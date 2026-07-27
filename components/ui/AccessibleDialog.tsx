"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

type AccessibleDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function AccessibleDialog({ open, title, description, onClose, children }: AccessibleDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ) ?? []);
    queueMicrotask(() => focusable()[0]?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] grid items-end bg-black/65 p-0 sm:place-items-center sm:p-4" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-5 shadow-2xl sm:max-w-xl sm:rounded-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-[var(--cma-text-primary)]">{title}</h2>
            {description ? <p id={descriptionId} className="mt-2 text-sm leading-6 text-[var(--cma-text-secondary)]">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-[var(--cma-border-soft)] text-[var(--cma-text-secondary)] hover:text-[var(--cma-text-primary)]">
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
