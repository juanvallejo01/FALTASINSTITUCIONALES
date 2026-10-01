import Link from "next/link";
import { requirePageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getTodaySessionsForTeacher } from "@/lib/attendance";
import { currentHourInAppTz, formatLongDateEs } from "@/lib/tz";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export default async function DocenteHomePage() {
  const session = await requirePageRole("DOCENTE");
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.sub } });

  if (!teacher) {
    return (
      <EmptyState
        icon="user"
        title="Sin perfil de docente"
        description="Esta cuenta no tiene un perfil de docente asociado. Contacta al administrador de tu institución."
      />
    );
  }

  const sessions = await getTodaySessionsForTeacher(teacher.id);
  const hour = currentHourInAppTz();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const done = sessions.filter((s) => s.status === "REGISTRADA").length;
  const pending = sessions.length - done;
  const next = sessions.find((s) => s.status !== "REGISTRADA");

  return (
    <div>
      <PageHeader title={`${greeting}, ${teacher.firstName}`} subtitle={formatLongDateEs()} />

      {sessions.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Hoy no tienes clases"
          description="Cuando tengas clases programadas aparecerán aquí para tomar asistencia."
        />
      ) : (
        <div className="space-y-6">
          <div className="card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[17px] font-semibold text-slate-900">
                  {pending === 0
                    ? "¡Listo! Registraste todas tus clases"
                    : `Te ${pending === 1 ? "falta" : "faltan"} ${pending} de ${sessions.length} ${sessions.length === 1 ? "clase" : "clases"}`}
                </p>
                <p className="text-[13px] text-slate-500">
                  {done} registrada{done === 1 ? "" : "s"} hoy
                </p>
              </div>
              {next && (
                <Link href={`/dashboard/docente/asistencia/${next.id}`} className="btn-primary w-full shrink-0 sm:w-auto">
                  Tomar asistencia
                </Link>
              )}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(done / sessions.length) * 100}%` }}
              />
            </div>
          </div>

          <section>
            <h2 className="section-title">Mis clases de hoy</h2>
            <ul className="list-group">
              {sessions.map((s) => {
                const registered = s.status === "REGISTRADA";
                return (
                  <li key={s.id}>
                    <Link href={`/dashboard/docente/asistencia/${s.id}`} className="list-row">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          registered ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        <Icon name={registered ? "check" : "clock"} strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {s.courseName} · {s.subjectName}
                        </p>
                        <p className="text-[13px] text-slate-500">
                          {s.startTime} · {registered ? "Registrada" : "Pendiente"}
                        </p>
                      </div>
                      <span className="hidden text-[13px] font-medium text-brand-600 sm:inline">
                        {registered ? "Ver" : "Registrar"}
                      </span>
                      <Icon name="chevron-right" className="h-4 w-4 text-slate-300" strokeWidth={2.2} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
