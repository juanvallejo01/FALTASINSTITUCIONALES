import { requirePageRole } from "@/lib/rbac";
import { getFollowUpCaseDetail } from "@/lib/followup";
import { formatDateTimeEs, formatShortDateOnlyEs } from "@/lib/tz";
import { ALERT_LEVEL, ATTENDANCE_STATUS, CASE_STATUS, CONTACT_RESULT, CONTACT_TYPE, labelOf } from "@/lib/labels";
import { CaseActions } from "@/components/followup/CaseActions";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

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
    return <EmptyState icon="folder" title="Caso no encontrado" />;
  }

  const status = labelOf(CASE_STATUS, data.status);
  const level = data.alert ? labelOf(ALERT_LEVEL, data.alert.level) : null;
  const back = { href: "/dashboard/seguimiento/casos", label: "Casos" };

  return (
    <div>
      <PageHeader
        back={back}
        title={data.student.name}
        subtitle={`${data.student.courseName} · ${data.student.institutionName} · ${data.student.internalCode}`}
        actions={<Badge tone={status.tone}>{status.label}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {data.alert && level && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Nivel" value={level.label} tone={level.tone === "danger" ? "text-red-600" : "text-amber-600"} />
              <Metric label="Ausencias" value={String(data.alert.absenceCount)} />
              <Metric label="Seguidas" value={String(data.alert.consecutiveAbsences)} />
              <Metric
                label="Asistencia"
                value={`${data.alert.attendancePercentage.toFixed(0)}%`}
                tone={data.alert.attendancePercentage < 80 ? "text-red-600" : undefined}
              />
            </div>
          )}

          <section>
            <h2 className="section-title">Acudiente</h2>
            {data.guardian ? (
              <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Icon name="user" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{data.guardian.name}</p>
                    <p className="text-[13px] text-slate-500">
                      {data.guardian.relationship} · {data.guardian.phone}
                    </p>
                  </div>
                </div>
                <a href={`tel:${data.guardian.phone.replace(/[^\d+]/g, "")}`} className="btn-primary w-full shrink-0 px-4 sm:w-auto">
                  <Icon name="phone" className="h-[18px] w-[18px]" />
                  Llamar
                </a>
              </div>
            ) : (
              <div className="card p-4 text-[15px] text-slate-500">Este estudiante no tiene acudiente registrado.</div>
            )}
          </section>

          <section className="lg:hidden">
            <CaseActions key={data.status} caseId={data.id} currentStatus={data.status} />
          </section>

          <section>
            <h2 className="section-title">Historial de contactos ({data.contacts.length})</h2>
            {data.contacts.length === 0 ? (
              <div className="card p-4 text-[15px] text-slate-500">Aún no se ha registrado ningún contacto.</div>
            ) : (
              <ol className="list-group">
                {data.contacts.map((c) => (
                  <li key={c.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-900">{CONTACT_RESULT[c.result] ?? c.result}</p>
                      <span className="shrink-0 text-[12px] text-slate-400">{formatDateTimeEs(c.contactDate)}</span>
                    </div>
                    <p className="text-[13px] text-slate-500">
                      {CONTACT_TYPE[c.type] ?? c.type} · {c.gestorName}
                    </p>
                    {c.observation && <p className="mt-1.5 text-[15px] text-slate-700">{c.observation}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section>
            <h2 className="section-title">Ausencias y novedades ({data.attendanceHistory.length})</h2>
            {data.attendanceHistory.length === 0 ? (
              <div className="card p-4 text-[15px] text-slate-500">Sin novedades registradas.</div>
            ) : (
              <ul className="list-group">
                {data.attendanceHistory.map((h, i) => {
                  const st = labelOf(ATTENDANCE_STATUS, h.status);
                  return (
                    <li key={i} className="list-row">
                      <span className="hidden w-20 shrink-0 text-[13px] font-medium text-slate-500 sm:inline">
                        {formatShortDateOnlyEs(h.date)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{h.subjectName}</p>
                        <p className="truncate text-[13px] text-slate-500">
                          <span className="sm:hidden">{formatShortDateOnlyEs(h.date)} · </span>
                          {h.teacherName}
                        </p>
                      </div>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="hidden min-w-0 lg:block">
          <div className="sticky top-20">
            <CaseActions key={data.status} caseId={data.id} currentStatus={data.status} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card min-w-0 p-3.5">
      <p className="truncate text-[12px] font-medium text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-[20px] font-bold tabular-nums tracking-tight ${tone ?? "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
