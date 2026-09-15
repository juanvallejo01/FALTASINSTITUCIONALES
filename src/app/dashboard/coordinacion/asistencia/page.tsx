import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { getTodayClassesForInstitution } from "@/lib/coordination";
import { formatDateEs, formatDateTimeEs } from "@/lib/tz";

export default async function AsistenciaHoyPage() {
  const session = await requirePageRole("COORDINADOR");
  const institutionId = scopedInstitutionId(session)!;
  const classes = await getTodayClassesForInstitution(institutionId);

  const pending = classes.filter((c) => c.status === "PENDIENTE");
  const registered = classes.filter((c) => c.status === "REGISTRADA");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Asistencia de hoy</h1>
        <p className="text-sm text-slate-500">{formatDateEs(new Date())}</p>
      </div>

      {classes.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">No hay clases programadas para hoy.</div>
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-600">
              Docentes pendientes ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="card p-4 text-sm text-emerald-700">
                Todos los docentes han registrado asistencia hoy.
              </div>
            ) : (
              <ClassTable rows={pending} />
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-600">
              Registradas ({registered.length})
            </h2>
            <ClassTable rows={registered} />
          </section>
        </>
      )}
    </div>
  );
}

function ClassTable({
  rows,
}: {
  rows: Awaited<ReturnType<typeof getTodayClassesForInstitution>>;
}) {
  if (rows.length === 0) {
    return <div className="card p-4 text-sm text-slate-500">Sin registros.</div>;
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2.5">Hora</th>
            <th className="px-4 py-2.5">Curso</th>
            <th className="px-4 py-2.5">Materia</th>
            <th className="px-4 py-2.5">Docente</th>
            <th className="px-4 py-2.5">Estado</th>
            <th className="px-4 py-2.5">Registrada</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.assignmentId}>
              <td className="px-4 py-2.5">{r.startTime}</td>
              <td className="px-4 py-2.5">{r.courseName}</td>
              <td className="px-4 py-2.5">{r.subjectName}</td>
              <td className="px-4 py-2.5">{r.teacherName}</td>
              <td className="px-4 py-2.5">
                <span
                  className={`badge ${
                    r.status === "REGISTRADA"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {r.status === "REGISTRADA" ? "Registrada" : "Pendiente"}
                </span>
              </td>
              <td className="px-4 py-2.5 text-slate-500">
                {r.registeredAt ? formatDateTimeEs(r.registeredAt) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
