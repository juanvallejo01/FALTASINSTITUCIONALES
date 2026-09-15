import Link from "next/link";
import { requirePageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getTodaySessionsForTeacher } from "@/lib/attendance";
import { currentHourInAppTz, formatDateEs } from "@/lib/tz";

export default async function DocenteHomePage() {
  const session = await requirePageRole("DOCENTE");
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.sub } });

  if (!teacher) {
    return (
      <div className="card p-6 text-sm text-slate-600">
        No se encontró un perfil de docente asociado a esta cuenta. Contacta al
        administrador de tu institución.
      </div>
    );
  }

  const sessions = await getTodaySessionsForTeacher(teacher.id);
  const today = formatDateEs(new Date());
  const hour = currentHourInAppTz();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          {greeting}, {teacher.firstName}
        </h1>
        <p className="text-sm text-slate-500">{today}</p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Mis clases de hoy
        </h2>

        {sessions.length === 0 ? (
          <div className="card p-6 text-sm text-slate-500">
            No tienes clases programadas para hoy.
          </div>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/docente/asistencia/${s.id}`}
                  className="card flex items-center justify-between p-4 transition hover:border-brand-300 hover:shadow-md"
                >
                  <div>
                    <p className="text-sm text-slate-500">{s.startTime}</p>
                    <p className="font-medium text-slate-900">
                      {s.courseName} — {s.subjectName}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      s.status === "REGISTRADA"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {s.status === "REGISTRADA" ? "Registrada" : "Pendiente"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
