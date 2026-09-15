import Link from "next/link";
import { requirePageRole } from "@/lib/rbac";
import { listFollowUpCases } from "@/lib/followup";
import { formatDateOnlyEs } from "@/lib/tz";
import type { FollowUpStatus } from "@prisma/client";

const STATUS_TABS: { value: FollowUpStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "EN_GESTION", label: "En gestión" },
  { value: "CONTACTADO", label: "Contactados" },
  { value: "NO_CONTACTADO", label: "No contactados" },
  { value: "JUSTIFICADO", label: "Justificados" },
  { value: "CERRADO", label: "Cerrados" },
];

const LEVEL_STYLES: Record<string, string> = {
  ALERTA: "bg-red-50 text-red-700",
  SEGUIMIENTO: "bg-amber-50 text-amber-700",
  NORMAL: "bg-slate-100 text-slate-600",
};

export default async function CasosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requirePageRole("GESTOR_SEGUIMIENTO");
  const { status } = await searchParams;
  const cases = await listFollowUpCases(session, {
    status: (status as FollowUpStatus) || undefined,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Casos ({cases.length})</h1>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/dashboard/seguimiento/casos?status=${tab.value}` : "/dashboard/seguimiento/casos"}
            className={`badge ${status === tab.value || (!status && !tab.value) ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {cases.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">No hay casos en este filtro.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Estudiante</th>
                <th className="px-4 py-2.5">Institución</th>
                <th className="px-4 py-2.5">Curso</th>
                <th className="px-4 py-2.5 text-right">Ausencias</th>
                <th className="px-4 py-2.5">Nivel</th>
                <th className="px-4 py-2.5">Última ausencia</th>
                <th className="px-4 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.map((c) => (
                <tr key={c.id} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    <Link href={`/dashboard/seguimiento/casos/${c.id}`} className="block">
                      {c.studentName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{c.institutionName}</td>
                  <td className="px-4 py-2.5">{c.courseName}</td>
                  <td className="px-4 py-2.5 text-right">{c.absenceCount}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge ${LEVEL_STYLES[c.level]}`}>{c.level}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {c.lastAbsenceDate ? formatDateOnlyEs(c.lastAbsenceDate) : "—"}
                  </td>
                  <td className="px-4 py-2.5">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
