"use client";

import { useCallback, useEffect, useState } from "react";

type DialogRequest = {
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  /** Solo un botón (aviso), sin opción de cancelar. */
  alertOnly?: boolean;
  resolve: (ok: boolean) => void;
};

/**
 * Reemplazo de window.confirm / window.alert con un diálogo al estilo iOS:
 * título claro, explicación y acción destructiva en rojo.
 *
 *   const { confirm, alert, dialog } = useDialog();
 *   if (!(await confirm({ title: "¿Eliminar?", destructive: true }))) return;
 *   ...
 *   return <>{dialog}...</>;
 */
export function useDialog() {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  const confirm = useCallback(
    (opts: Omit<DialogRequest, "resolve" | "alertOnly">) =>
      new Promise<boolean>((resolve) => setRequest({ ...opts, resolve })),
    [],
  );

  const alert = useCallback(
    (title: string, message?: string) =>
      new Promise<void>((resolve) =>
        setRequest({ title, message, alertOnly: true, confirmLabel: "Entendido", resolve: () => resolve() }),
      ),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      request?.resolve(ok);
      setRequest(null);
    },
    [request],
  );

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request, close]);

  const dialog = request ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" role="alertdialog" aria-modal="true" aria-label={request.title}>
      <div className="absolute inset-0 animate-fade-in bg-black/30" />
      <div className="relative w-full max-w-[300px] animate-fade-in overflow-hidden rounded-2xl bg-white/95 text-center shadow-float backdrop-blur-xl">
        <div className="px-5 pb-4 pt-5">
          <p className="text-[17px] font-semibold text-slate-900">{request.title}</p>
          {request.message && <p className="mt-1 text-[13px] leading-snug text-slate-600">{request.message}</p>}
        </div>
        <div className={`grid border-t border-slate-200 ${request.alertOnly ? "" : "grid-cols-2 divide-x divide-slate-200"}`}>
          {!request.alertOnly && (
            <button type="button" onClick={() => close(false)} className="min-h-[44px] text-[17px] text-brand-600 hover:bg-slate-50">
              Cancelar
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => close(true)}
            className={`min-h-[44px] text-[17px] font-semibold hover:bg-slate-50 ${
              request.destructive ? "text-red-600" : "text-brand-600"
            }`}
          >
            {request.confirmLabel ?? "Aceptar"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, alert, dialog };
}
