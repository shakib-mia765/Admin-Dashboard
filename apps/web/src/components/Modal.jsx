import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MODAL_SIZES = Object.freeze({
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[calc(100vw-2rem)]"
});

const BUTTON_VARIANTS = Object.freeze({
  primary: "bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-500 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500",
  success: "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
});

const FOCUSABLE_SELECTORS = Object.freeze([
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])"
]);

const ACTION_DEFAULTS = Object.freeze({
  variant: "primary",
  loadingLabel: "Processing",
  closeOnSuccess: true,
  disabled: false
});

let scrollLockCount = 0;
let previousBodyOverflow = "";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const isFocusable = (element) => {
  if (!(element instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(element);
  return !element.hidden && style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
};

const lockBodyScroll = () => {
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
};

const unlockBodyScroll = () => {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = previousBodyOverflow;
};

const normalizeError = (reason) => {
  if (reason instanceof Error && reason.message.trim()) return reason.message;
  if (typeof reason === "string" && reason.trim()) return reason;
  return "The requested action could not be completed.";
};

const CloseIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Spinner = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 animate-spin" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
    <path fill="currentColor" className="opacity-90" d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3Z" />
  </svg>
);

const Modal = ({
  open,
  title,
  description,
  children,
  actions = [],
  size = "md",
  variant = "primary",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loadingLabel = "Processing",
  closeLabel = "Close modal",
  errorLabel = "Action failed",
  onClose,
  onConfirm,
  closeOnEscape = true,
  closeOnBackdrop = true,
  showCloseButton = true,
  showFooter = true,
  showCancelButton = true,
  confirmDisabled = false,
  initialFocusRef,
  portalTarget,
  className = "",
  contentClassName = ""
}) => {
  const reactId = useId();
  const titleId = `modal-title-${reactId.replace(/:/g, "")}`;
  const descriptionId = `modal-description-${reactId.replace(/:/g, "")}`;
  const errorId = `modal-error-${reactId.replace(/:/g, "")}`;
  const panelRef = useRef(null);
  const mountedRef = useRef(false);
  const previousFocusRef = useRef(null);
  const pointerStartedOnBackdropRef = useRef(false);
  const actionRequestRef = useRef(0);
  const [pendingAction, setPendingAction] = useState("");
  const [error, setError] = useState("");

  const focusableSelector = useMemo(() => FOCUSABLE_SELECTORS.join(","), []);

  const modalClassName = useMemo(() => joinClasses(
    "relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none dark:border-slate-800 dark:bg-slate-950",
    MODAL_SIZES[size] ?? MODAL_SIZES.md,
    className
  ), [className, size]);

  const normalizedActions = useMemo(() => {
    const source = actions.length ? actions : onConfirm ? [{
      id: "confirm",
      label: confirmLabel,
      loadingLabel,
      variant,
      disabled: confirmDisabled,
      handler: onConfirm
    }] : [];

    const usedIds = new Set();

    return source.map((action, index) => {
      const id = String(action.id ?? `action-${index}`);
      if (usedIds.has(id)) throw new Error(`Modal action id "${id}" must be unique.`);
      usedIds.add(id);

      return {
        ...ACTION_DEFAULTS,
        ...action,
        id,
        label: action.label ?? `Action ${index + 1}`
      };
    });
  }, [actions, confirmDisabled, confirmLabel, loadingLabel, onConfirm, variant]);

  const pending = Boolean(pendingAction);
  const describedBy = [description && descriptionId, error && errorId].filter(Boolean).join(" ") || undefined;

  const getFocusableElements = () => Array.from(
    panelRef.current?.querySelectorAll(focusableSelector) ?? []
  ).filter(isFocusable);

  const closeModal = () => {
    if (!pending) onClose?.();
  };

  const runAction = async (action) => {
    if (pending || action.disabled || typeof action.handler !== "function") return;

    const requestId = ++actionRequestRef.current;
    setPendingAction(action.id);
    setError("");

    try {
      const result = await Promise.resolve(action.handler(action));
      if (!mountedRef.current || requestId !== actionRequestRef.current) return;
      if (result !== false && action.closeOnSuccess !== false) onClose?.();
    } catch (reason) {
      if (mountedRef.current && requestId === actionRequestRef.current) setError(normalizeError(reason));
    } finally {
      if (mountedRef.current && requestId === actionRequestRef.current) setPendingAction("");
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      actionRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    previousFocusRef.current = document.activeElement;
    lockBodyScroll();

    const frame = window.requestAnimationFrame(() => {
      const target = initialFocusRef?.current ?? getFocusableElements()[0] ?? panelRef.current;
      target?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      unlockBodyScroll();

      const previousFocus = previousFocusRef.current;
      if (previousFocus instanceof HTMLElement && document.contains(previousFocus)) {
        window.requestAnimationFrame(() => previousFocus.focus({ preventScroll: true }));
      }
    };
  }, [initialFocusRef, open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (closeOnEscape && !pending) {
          event.preventDefault();
          event.stopPropagation();
          onClose?.();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const elements = getFocusableElements();
      if (!elements.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = elements[0];
      const last = elements.at(-1);
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panelRef.current?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [closeOnEscape, onClose, open, pending]);

  useEffect(() => {
    if (open) return;
    actionRequestRef.current += 1;
    setPendingAction("");
    setError("");
  }, [open]);

  const handleBackdropPointerDown = (event) => {
    pointerStartedOnBackdropRef.current = event.target === event.currentTarget;
  };

  const handleBackdropPointerUp = (event) => {
    const endedOnBackdrop = event.target === event.currentTarget;
    if (pointerStartedOnBackdropRef.current && endedOnBackdrop && closeOnBackdrop) closeModal();
    pointerStartedOnBackdropRef.current = false;
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      onPointerDown={handleBackdropPointerDown}
      onPointerUp={handleBackdropPointerUp}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : closeLabel}
        aria-describedby={describedBy}
        aria-busy={pending}
        tabIndex={-1}
        className={modalClassName}
      >
        {(title || description || showCloseButton) && (
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="min-w-0">
              {title && <h2 id={titleId} className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>}
              {description && <p id={descriptionId} className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                aria-label={closeLabel}
                disabled={pending}
                onClick={closeModal}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <CloseIcon />
              </button>
            )}
          </header>
        )}

        <div className={joinClasses(
          "min-h-0 overflow-y-auto px-5 py-4 text-sm leading-6 text-slate-700 dark:text-slate-300",
          contentClassName
        )}>
          {children}
        </div>

        {error && (
          <div
            id={errorId}
            role="alert"
            aria-label={errorLabel}
            className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {showFooter && (showCancelButton || normalizedActions.length > 0) && (
          <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end dark:border-slate-800">
            {showCancelButton && (
              <button
                type="button"
                disabled={pending}
                onClick={closeModal}
                className={joinClasses(
                  "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-slate-950",
                  BUTTON_VARIANTS.secondary
                )}
              >
                {cancelLabel}
              </button>
            )}

            {normalizedActions.map((action) => {
              const actionPending = pendingAction === action.id;

              return (
                <button
                  key={action.id}
                  type="button"
                  disabled={pending || action.disabled}
                  aria-busy={actionPending}
                  onClick={() => runAction(action)}
                  className={joinClasses(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-slate-950",
                    BUTTON_VARIANTS[action.variant] ?? BUTTON_VARIANTS.primary,
                    action.className
                  )}
                >
                  {actionPending && <Spinner />}
                  <span>{actionPending ? action.loadingLabel : action.label}</span>
                </button>
              );
            })}
          </footer>
        )}
      </section>
    </div>,
    portalTarget ?? document.body
  );
};

export default Modal;
