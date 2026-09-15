"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CONTACT_TYPES = [
  { value: "LLAMADA", label: "Llamada" },
  { value: "MENSAJE", label: "Mensaje" },
  { value: "PRESENCIAL", label: "Contacto presencial" },
  { value: "OTRO", label: "Otro" },
];

const CONTACT_RESULTS = [
  { value: "ACUDIENTE_CONTACTADO", label: "Acudiente contactado" },
  { value: "NO_CONTESTO", label: "No contestó" },
  { value: "NUMERO_INVALIDO", label: "Número inválido" },
  { value: "SOLICITA_DEVOLUCION_LLAMADA", label: "Solicita devolución de llamada" },
  { value: "AUSENCIA_JUSTIFICADA", label: "Ausencia justificada" },
  { value: "OTRO", label: "Otro" },
];

const CASE_STATUSES = [
  "PENDIENTE",
  "EN_GESTION",
  "CONTACTADO",
  "NO_CONTACTADO",
  "JUSTIFICADO",
  "CERRADO",
];

export function CaseActions({ caseId, currentStatus }: { caseId: string; currentStatus: string }) {
  const router = useRouter();
  const [type, setType] = useState("LLAMADA");
  const [result, setResult] = useState("ACUDIENTE_CONTACTADO");
  const [observation, setObservation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(currentStatus);

  async function handleRegisterContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
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
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    await fetch(`/api/followup/cases/${caseId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <label className="label" htmlFor="case-status">
          Estado del caso
        </label>
        <select
          id="case-status"
          className="input"
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          {CASE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleRegisterContact} className="card space-y-3 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Registrar contacto</h3>
        <div>
          <label className="label" htmlFor="contact-type">
            Tipo de contacto
          </label>
          <select id="contact-type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {CONTACT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="contact-result">
            Resultado
          </label>
          <select
            id="contact-result"
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
          <label className="label" htmlFor="contact-observation">
            Observaciones
          </label>
          <textarea
            id="contact-observation"
            className="input"
            rows={3}
            maxLength={1000}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Detalles del contacto (opcional)"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Guardando..." : "Registrar llamada"}
        </button>
      </form>
    </div>
  );
}
