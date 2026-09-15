"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "PRESENTE" | "AUSENTE" | "TARDE" | "JUSTIFICADO";

const STATUS_CYCLE: Status[] = ["PRESENTE", "AUSENTE", "TARDE", "JUSTIFICADO"];

const STATUS_STYLES: Record<Status, { label: string; icon: string; className: string }> = {
  PRESENTE: { label: "Presente", icon: "✓", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  AUSENTE: { label: "Ausente", icon: "✕", className: "bg-red-50 text-red-700 border-red-200" },
  TARDE: { label: "Tarde", icon: "🕐", className: "bg-amber-50 text-amber-700 border-amber-200" },
  JUSTIFICADO: { label: "Justificado", icon: "J", className: "bg-blue-50 text-blue-700 border-blue-200" },
};

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
}: {
  sessionId: string;
  sessionMeta: { courseName: string; subjectName: string; dateLabel: string; alreadyRegistered: boolean };
  initialStudents: StudentRow[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  function cycleStatus(studentId: string) {
    if (readOnly) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const nextIndex = (STATUS_CYCLE.indexOf(s.status) + 1) % STATUS_CYCLE.length;
        return { ...s, status: STATUS_CYCLE[nextIndex]! };
      }),
    );
    setSavedOk(false);
  }

  function updateObservation(studentId: string, observation: string) {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, observation } : s)));
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
      router.refresh();
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-28">
      <div className="mb-4">
        <p className="text-sm text-slate-500">{sessionMeta.dateLabel}</p>
        <h1 className="text-lg font-semibold text-slate-900">
          {sessionMeta.courseName} — {sessionMeta.subjectName}
        </h1>
        {readOnly && (
          <p className="mt-1 text-xs text-slate-400">Solo lectura: no tienes permiso para editar esta sesión.</p>
        )}
      </div>

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {students.map((s) => {
          const style = STATUS_STYLES[s.status];
          return (
            <li key={s.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {s.lastName} {s.firstName}
                  </p>
                  <p className="text-xs text-slate-400">{s.internalCode}</p>
                </div>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => cycleStatus(s.id)}
                  className={`flex h-10 min-w-[6rem] shrink-0 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition active:scale-95 disabled:cursor-default ${style.className}`}
                >
                  <span aria-hidden>{style.icon}</span>
                  {style.label}
                </button>
              </div>
              {(s.status === "AUSENTE" || s.status === "JUSTIFICADO") && !readOnly && (
                <input
                  type="text"
                  placeholder="Observación (opcional)"
                  value={s.observation ?? ""}
                  onChange={(e) => updateObservation(s.id, e.target.value)}
                  maxLength={500}
                  className="input mt-2 text-sm"
                />
              )}
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <span>{counts.PRESENTE} presentes</span>
            <span>{counts.AUSENTE} ausentes</span>
            <span>{counts.TARDE} tarde</span>
            <span>{counts.JUSTIFICADO} justificados</span>
          </div>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          {savedOk && <p className="mb-2 text-sm text-emerald-600">Asistencia guardada correctamente.</p>}
          {!readOnly && (
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? "Guardando..." : "Guardar asistencia"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
