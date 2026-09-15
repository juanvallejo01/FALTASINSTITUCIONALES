import { requirePageRole } from "@/lib/rbac";
import { getFollowUpCaseDetail } from "@/lib/followup";
import { formatDateOnlyEs, formatDateTimeEs } from "@/lib/tz";
import { CaseActions } from "@/components/followup/CaseActions";

const CONTACT_TYPE_LABELS: Record<string, string> = {
  LLAMADA: "Llamada",
  MENSAJE: "Mensaje",
  PRESENCIAL: "Presencial",
  OTRO: "Otro",
};

const CONTACT_RESULT_LABELS: Record<string, string> = {
  ACUDIENTE_CONTACTADO: "Acudiente contactado",
  NO_CONTESTO: "No contestó",
  NUMERO_INVALIDO: "Número inválido",
  SOLICITA_DEVOLUCION_LLAMADA: "Solicita devolución de llamada",
  AUSENCIA_JUSTIFICADA: "Ausencia justificada",
  OTRO: "Otro",
};

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const session = await requirePageRole("GESTOR_SEGUIMIENTO");
  const { caseId } = await params;

  let data;
  try {
    data = await getFollowUpCaseDetail(caseId, session);
  } catch {
    return <div className="card p-6 text-sm text-slate-600">Caso no encontrado.</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="card p-4">
          <h1 className="text-lg font-semibold text-slate-900">{data.student.name}</h1>
          <p className="text-sm text-slate-500">
            {data.student.internalCode} · {data.student.institutionName} · {data.student.courseName}
          </p>
          {data.alert && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Info label="Nivel" value={data.alert.level} />
              <Info label="Ausencias" value={String(data.alert.absenceCount)} />
              <Info label="Consecutivas" value={String(data.alert.consecutiveAbsences)} />
              <Info label="% Asistencia" value={`${data.alert.attendancePercentage.toFixed(1)}%`} />
            </div>
          )}
          {data.guardian && (
            <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
              <p className="font-medium text-slate-900">Acudiente</p>
              <p className="text-slate-600">
                {data.guardian.name} ({data.guardian.relationship}) — {data.guardian.phone}
              </p>
            </div>
          )}
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Historial de asistencia (no presentes)
          </h2>
          {data.attendanceHistory.length === 0 ? (
            <p className="text-sm text-slate-500">Sin novedades registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Fecha</th>
                    <th className="py-2">Materia</th>
                    <th className="py-2">Docente</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.attendanceHistory.map((h, i) => (
                    <tr key={i}>
                      <td className="py-2">{formatDateOnlyEs(h.date)}</td>
                      <td className="py-2">{h.subjectName}</td>
                      <td className="py-2">{h.teacherName}</td>
                      <td className="py-2">{h.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Historial de seguimiento
          </h2>
          {data.contacts.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no se ha registrado ningún contacto.</p>
          ) : (
            <ul className="space-y-3">
              {data.contacts.map((c) => (
                <li key={c.id} className="border-b border-slate-100 pb-3 text-sm last:border-0">
                  <p className="font-medium text-slate-900">
                    {CONTACT_TYPE_LABELS[c.type]} — {CONTACT_RESULT_LABELS[c.result]}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDateTimeEs(c.contactDate)} · {c.gestorName}
                  </p>
                  {c.observation && <p className="mt-1 text-slate-600">{c.observation}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <CaseActions caseId={data.id} currentStatus={data.status} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}
