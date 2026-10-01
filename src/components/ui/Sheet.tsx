"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

/**
 * Hoja modal: sube desde abajo en el celular y aparece centrada en escritorio.
 * Se usa para crear/editar sin perder de vista la lista de fondo.
 */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 animate-fade-in bg-black/30" />
      <div
        ref={panelRef}
        className="relative max-h-[92dvh] w-full animate-sheet-in overflow-y-auto rounded-t-3xl bg-canvas shadow-float sm:max-w-xl sm:animate-fade-in sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.06] bg-canvas/90 px-5 py-3 backdrop-blur">
          <h2 className="text-[17px] font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/80 text-slate-500 hover:bg-slate-300/80"
          >
            <Icon name="x" className="h-4 w-4" strokeWidth={2.6} />
          </button>
        </div>
        <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">{children}</div>
      </div>
    </div>
  );
}
