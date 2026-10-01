import { requirePageRole } from "@/lib/rbac";
import { getSessionRoster } from "@/lib/attendance";
import { AttendanceRoster } from "@/components/attendance/AttendanceRoster";
import { formatShortDateOnlyEs } from "@/lib/tz";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function MarcarAsistenciaPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await requirePageRole("DOCENTE");
  const { sessionId } = await params;
  const { from } = await searchParams;
  const back =
    from === "historial"
      ? { href: "/dashboard/docente/historial", label: "Historial" }
      : { href: "/dashboard/docente", label: "Mis clases" };

  let data;
  try {
    data = await getSessionRoster(sessionId, session);
  } catch {
    return (
      <EmptyState
        icon="alert"
        title="No se pudo abrir la clase"
        description="Puede que no exista o que no tengas acceso a ella."
      />
    );
  }

  return (
    <AttendanceRoster
      sessionId={sessionId}
      sessionMeta={{
        courseName: data.session.courseName,
        subjectName: data.session.subjectName,
        dateLabel: formatShortDateOnlyEs(new Date(data.session.date)),
        alreadyRegistered: data.session.status === "REGISTRADA",
      }}
      initialStudents={data.students}
      readOnly={false}
      back={back}
    />
  );
}
