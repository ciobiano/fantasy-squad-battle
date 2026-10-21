// A sheet from the bottom of the screen on the native <dialog> (browser only:
// used inside client components): the browser
// keeps focus inside and closes it on Escape; a tap on the dimmed page closes it too.
import { useEffect, useRef, type ReactNode } from "react";
import { planSheet, planSheetBody, sheetGrabber } from "@/lib/variants";

export function Sheet({ open, onClose, labelledBy, children }: { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className={planSheet()}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open ? (
        <div className={planSheetBody()}>
          <span aria-hidden="true" className={sheetGrabber()} />
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
