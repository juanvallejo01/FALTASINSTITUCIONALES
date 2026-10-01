import Link from "next/link";
import { requirePageRole } from "@/lib/rbac";
import { countFollowUpCasesByStatus, listFollowUpCases } from "@/lib/followup";
import { formatShortDateOnlyEs } from "@/lib/tz";
import { ALERT_LEVEL, CASE_STATUS, labelOf } from "@/lib/labels";
import type { FollowUpStatus } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedLinks } from "@/components/ui/SegmentedLinks";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

const BASE = "/dashboard/seguimiento/casos";
const FILTERS: { value: FollowUpStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "EN_GESTION", label: "En gestión" },
  { value: "NO_CONTACTADO", label: "No contactados" },
  { value: "CONTACTADO", label: "Contactados" },
  { value: "JUSTIFICADO", label: "Justificados" },
  { value: "CERRADO", label: "Cerrados" },
];
const LEVEL_ORDER: Record<string, number> = { ALERTA: 0, SEGUIMIENTO: 1, NORMAL: 2 };

export default async function CasosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requirePageRole("GESTOR_SEGUIMIENTO");
  const { status: rawStatus } = await searchParams;
  const status = FILTERS.some((f) => f.value && f.value === rawStatus) ? (rawStatus as FollowUpStatus) : undefined;

  const [cases, counts] = await Promise.all([
    listFollowUpCases(session, { status }),
    countFollowUpCasesByStatus(session),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const showInstitution = new Set(cases.map((c) => c.institutionName)).size > 1;

  // Primero lo más urgente: nivel de alerta y, dentro de él, más ausencias.
  const sorted = [...cases].sort(
    (a, b) => (LEVEL_ORDER[a.level] ?? 3) - (LEVEL_ORDER[b.level] ?? 3) || b.absenceCount - a.absenceCount,
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Casos" subtitle="Ordenados por urgencia: primero las alertas con más ausencias" />

      <SegmentedLinks
        label="Filtrar por estado"
        items={FILTERS.map((f) => ({
          href: f.value ? `${BASE}?status=${f.value}` : BASE,
          label: f.label,
          active: (status ?? "") === f.value,
          count: f.value ? (counts[f.value] ?? 0) : total,
        }))}
      />

      {sorted.length === 0 ? (
        <EmptyState icon="folder" title="No hay casos en este filtro" />
      ) : (
        <ul className="list-group">
          {sorted.map((c) => {
            const level = labelOf(ALERT_LEVEL, c.level);
            const st = labelOf(CASE_STATUS, c.status);
            return (
              <li key={c.id}>
                <Link href={`${BASE}/${c.id}`} className="list-row">
                  <span
                    className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl leading-none ${
                      c.level === "ALERTA" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                    }`}
                    title={`${level.label}: ${c.absenceCount} ausencias`}
                  >
                    <span className="text-[15px] font-bold tabular-nums">{c.absenceCount}</span>
                    <span className="text-[9px] font-semibold">aus.</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{c.studentName}</p>
                    <p className="truncate text-[13px] text-slate-500">
                      {c.courseName}
                      {showInstitution ? ` · ${c.institutionName}` : ""}
                      {c.lastAbsenceDate ? ` · última ${formatShortDateOnlyEs(c.lastAbsenceDate)}` : ""}
                    </p>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                  <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2.2} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
