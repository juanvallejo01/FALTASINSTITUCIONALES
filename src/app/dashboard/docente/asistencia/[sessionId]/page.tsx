import { requirePageRole } from "@/lib/rbac";
import { getSessionRoster } from "@/lib/attendance";
import { AttendanceRoster } from "@/components/attendance/AttendanceRoster";
import { formatDateOnlyEs } from "@/lib/tz";

export default async function MarcarAsistenciaPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await requirePageRole("DOCENTE");
  const { sessionId } = await params;

  let data;
  try {
    data = await getSessionRoster(sessionId, session);
  } catch {
    return (
      <div className="card p-6 text-sm text-slate-600">
        No fue posible cargar esta clase. Puede que no exista o no tengas acceso a ella.
      </div>
    );
  }

  return (
    <AttendanceRoster
      sessionId={sessionId}
      sessionMeta={{
        courseName: data.session.courseName,
        subjectName: data.session.subjectName,
        dateLabel: formatDateOnlyEs(new Date(data.session.date)),
        alreadyRegistered: data.session.status === "REGISTRADA",
      }}
      initialStudents={data.students}
      readOnly={false}
    />
  );
}
