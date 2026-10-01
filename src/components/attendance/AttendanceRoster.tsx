"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

type Status = "PRESENTE" | "AUSENTE" | "TARDE" | "JUSTIFICADO";

const OPTIONS: { value: Status; label: string; short: string; active: string; dot: string }[] = [
  { value: "PRESENTE", label: "Presente", short: "Presente", active: "bg-emerald-500 text-white", dot: "bg-emerald-500" },
  { value: "AUSENTE", label: "Ausente", short: "Ausente", active: "bg-red-500 text-white", dot: "bg-red-500" },
  { value: "TARDE", label: "Tarde", short: "Tarde", active: "bg-amber-500 text-white", dot: "bg-amber-500" },
  { value: "JUSTIFICADO", label: "Justificado", short: "Justif.", active: "bg-brand-600 text-white", dot: "bg-brand-600" },
];

type StudentRow = {
  id: string;
  firstName: string;
  lastName: string;
  internalCode: string;
  status: Status;
  observation: string | null;
};

export function AttendanceRoster({
  sessionId,
  sessionMeta,
  initialStudents,
  readOnly,
  back = { href: "/dashboard/docente", label: "Mis clases" },
}: {
  sessionId: string;
  sessionMeta: { courseName: string; subjectName: string; dateLabel: string; alreadyRegistered: boolean };
  initialStudents: StudentRow[];
  readOnly: boolean;
  back?: { href: string; label: string };
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const counts = useMemo(() => {
    return students.reduce(
      (acc, s) => {
        acc[s.status]++;
        return acc;
      },
      { PRESENTE: 0, AUSENTE: 0, TARDE: 0, JUSTIFICADO: 0 } as Record<Status, number>,
    );
  }, [students]);

  function setStatus(studentId: string, status: Status) {
    if (readOnly) return;
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status } : s)));
    setDirty(true);
    setSavedOk(false);
  }

  function markAllPresent() {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "PRESENTE" })));
    setDirty(true);
    setSavedOk(false);
  }

  function updateObservation(studentId: string, observation: string) {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, observation } : s)));
    setDirty(true);
    setSavedOk(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendance/sessions/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: students.map((s) => ({
            studentId: s.id,
            status: s.status,
            observation: s.observation || null,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message ?? "No fue posible guardar la asistencia");
        return;
      }
      setSavedOk(true);
      setDirty(false);
      router.refresh();
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  const registered = sessionMeta.alreadyRegistered || savedOk;

  return (
    <div className="pb-44">
      <Link
        href={back.href}
        className="-ml-2 mb-1 inline-flex min-h-[44px] items-center gap-0.5 rounded-lg px-1 text-[15px] font-medium text-brand-600"
      >
        <Icon name="chevron-left" strokeWidth={2.2} />
        {back.label}
      </Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">{sessionMeta.courseName}</h1>
          <p className="page-subtitle">
            {sessionMeta.subjectName} · {sessionMeta.dateLabel} · {students.length} estudiantes
          </p>
        </div>
        {!readOnly && (
          <button type="button" onClick={markAllPresent} className="btn-secondary">
            <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
            Todos presentes
          </button>
        )}
      </div>

      {registered && !dirty && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">
          <Icon name="check" className="h-5 w-5 shrink-0" strokeWidth={2.4} />
          {savedOk
            ? "Asistencia guardada. Puedes corregirla y guardar de nuevo."
            : "Esta clase ya está registrada. Puedes corregirla y guardar de nuevo."}
        </div>
      )}
      {readOnly && (
        <p className="mb-4 text-[13px] text-slate-500">Solo lectura: no tienes permiso para editar esta sesión.</p>
      )}

      <ul className="list-group">
        {students.map((s) => (
          <li key={s.id} className="px-4 py-3">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {s.lastName} {s.firstName}
                </p>
                <p className="text-[12px] text-slate-400">{s.internalCode}</p>
              </div>
              <div
                role="radiogroup"
                aria-label={`Asistencia de ${s.firstName} ${s.lastName}`}
                className="grid grid-cols-4 gap-0.5 rounded-xl bg-slate-100 p-0.5 sm:w-[25rem]"
              >
                {OPTIONS.map((o) => {
                  const selected = s.status === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={readOnly}
                      onClick={() => setStatus(s.id, o.value)}
                      className={`min-h-[40px] rounded-[10px] px-1 text-[13px] font-semibold transition active:scale-95 disabled:cursor-default ${
                        selected ? `${o.active} shadow-sm` : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <span className="sm:hidden">{o.short}</span>
                      <span className="hidden sm:inline">{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {(s.status === "AUSENTE" || s.status === "JUSTIFICADO") && !readOnly && (
              <input
                type="text"
                placeholder={s.status === "JUSTIFICADO" ? "Motivo de la justificación (opcional)" : "Observación (opcional)"}
                value={s.observation ?? ""}
                onChange={(e) => updateObservation(s.id, e.target.value)}
                maxLength={500}
                className="input mt-2.5"
              />
            )}
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/[0.06] bg-white/85 px-4 sm:px-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto max-w-6xl">
          <div className="mb-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600">
            {OPTIONS.map((o) => (
              <span key={o.value} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${o.dot}`} />
                <span className="font-semibold tabular-nums text-slate-900">{counts[o.value]}</span>
                {o.label.toLowerCase()}
                {counts[o.value] === 1 || o.value === "TARDE" ? "" : "s"}
              </span>
            ))}
          </div>
          {error && (
            <p role="alert" className="mb-2 text-[14px] text-red-600">
              {error}
            </p>
          )}
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={saving || (!dirty && registered)}
              className="btn-primary w-full"
            >
              {saving
                ? "Guardando..."
                : !dirty && registered
                  ? "Guardada"
                  : registered
                    ? "Guardar cambios"
                    : "Guardar asistencia"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
