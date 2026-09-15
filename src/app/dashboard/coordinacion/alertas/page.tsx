import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatDateOnlyEs } from "@/lib/tz";

const LEVEL_STYLES: Record<string, string> = {
  ALERTA: "bg-red-50 text-red-700",
  SEGUIMIENTO: "bg-amber-50 text-amber-700",
  NORMAL: "bg-slate-100 text-slate-600",
};

export default async function AlertasPage() {
  const session = await requirePageRole("COORDINADOR");
  const institutionId = scopedInstitutionId(session)!;

  const alerts = await prisma.alert.findMany({
    where: { institutionId, status: "ABIERTA" },
    include: { student: { include: { course: true } } },
    orderBy: [{ level: "desc" }, { absenceCount: "desc" }],
  });

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        Estudiantes en alerta ({alerts.length})
      </h1>
      {alerts.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">
          No hay estudiantes en alerta de asistencia actualmente.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Estudiante</th>
                <th className="px-4 py-2.5">Curso</th>
                <th className="px-4 py-2.5">Nivel</th>
                <th className="px-4 py-2.5 text-right">Ausencias</th>
                <th className="px-4 py-2.5 text-right">% Asistencia</th>
                <th className="px-4 py-2.5">Última ausencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {a.student.lastName} {a.student.firstName}
                  </td>
                  <td className="px-4 py-2.5">{a.student.course.name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge ${LEVEL_STYLES[a.level]}`}>{a.level}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">{a.absenceCount}</td>
                  <td className="px-4 py-2.5 text-right">{a.attendancePercentage.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {a.lastAbsenceDate ? formatDateOnlyEs(a.lastAbsenceDate) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
