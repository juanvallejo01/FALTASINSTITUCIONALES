"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { CASE_STATUS, CONTACT_RESULT, CONTACT_TYPE } from "@/lib/labels";

const CONTACT_TYPES = Object.entries(CONTACT_TYPE).map(([value, label]) => ({ value, label }));
const CONTACT_RESULTS = Object.entries(CONTACT_RESULT).map(([value, label]) => ({ value, label }));
const CASE_STATUSES = Object.entries(CASE_STATUS).map(([value, { label }]) => ({ value, label }));

export function CaseActions({ caseId, currentStatus }: { caseId: string; currentStatus: string }) {
  const router = useRouter();
  const uid = useId();
  const [type, setType] = useState("LLAMADA");
  const [result, setResult] = useState("ACUDIENTE_CONTACTADO");
  const [observation, setObservation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [statusError, setStatusError] = useState<string | null>(null);

  async function handleRegisterContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/followup/cases/${caseId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, result, observation: observation || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message ?? "No fue posible registrar el contacto");
        return;
      }
      setObservation("");
      setSaved(true);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    const previous = status;
    setStatus(newStatus);
    setStatusError(null);
    try {
      const res = await fetch(`/api/followup/cases/${caseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setStatus(previous);
      setStatusError("No se pudo cambiar el estado. Intenta nuevamente.");
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="section-title">Registrar contacto</h2>
        <form onSubmit={handleRegisterContact} className="card space-y-4 p-4">
          <fieldset>
            <legend className="label">Tipo de contacto</legend>
            <div className="grid grid-cols-4 gap-0.5 rounded-xl bg-slate-100 p-0.5">
              {CONTACT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={type === t.value}
                  onClick={() => setType(t.value)}
                  className={`min-h-[36px] rounded-[10px] px-1 text-[13px] font-medium transition ${
                    type === t.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor={`${uid}-contact-result`}>
              Resultado
            </label>
            <select
              id={`${uid}-contact-result`}
              className="input"
              value={result}
              onChange={(e) => setResult(e.target.value)}
            >
              {CONTACT_RESULTS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor={`${uid}-contact-observation`}>
              Observaciones
            </label>
            <textarea
              id={`${uid}-contact-observation`}
              className="input"
              rows={3}
              maxLength={1000}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="¿Qué se habló? (opcional)"
            />
          </div>
          {error && (
            <p role="alert" className="text-[14px] text-red-600">
              {error}
            </p>
          )}
          {saved && <p className="text-[14px] text-emerald-600">Contacto registrado. El estado del caso se actualizó.</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Guardando..." : "Guardar contacto"}
          </button>
          <p className="text-center text-[12px] text-slate-400">
            El estado del caso se actualiza solo según el resultado.
          </p>
        </form>
      </section>

      <section>
        <h2 className="section-title">Cambiar estado manualmente</h2>
        <div className="card p-4">
          <label className="sr-only" htmlFor={`${uid}-case-status`}>
            Estado del caso
          </label>
          <select
            id={`${uid}-case-status`}
            className="input"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {CASE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {statusError && (
            <p role="alert" className="mt-2 text-[14px] text-red-600">
              {statusError}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
