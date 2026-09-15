import { requirePageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatDateOnlyEs } from "@/lib/tz";

export default async function HistorialDocentePage() {
  const session = await requirePageRole("DOCENTE");
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.sub } });

  if (!teacher) {
    return <div className="card p-6 text-sm text-slate-600">Perfil de docente no encontrado.</div>;
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: { teacherId: teacher.id, status: "REGISTRADA" },
    include: { course: true, subject: true, records: true },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    take: 30,
  });

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Historial de asistencia</h1>
      {sessions.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">Aún no has registrado asistencia.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Fecha</th>
                <th className="px-4 py-2.5">Curso</th>
                <th className="px-4 py-2.5">Materia</th>
                <th className="px-4 py-2.5 text-right">Presentes</th>
                <th className="px-4 py-2.5 text-right">Ausentes</th>
                <th className="px-4 py-2.5 text-right">Tarde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2.5">{formatDateOnlyEs(s.date)}</td>
                  <td className="px-4 py-2.5">{s.course.name}</td>
                  <td className="px-4 py-2.5">{s.subject.name}</td>
                  <td className="px-4 py-2.5 text-right">
                    {s.records.filter((r) => r.status === "PRESENTE").length}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {s.records.filter((r) => r.status === "AUSENTE").length}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {s.records.filter((r) => r.status === "TARDE").length}
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
