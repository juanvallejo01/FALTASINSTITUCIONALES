import { requirePageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatDateTimeEs } from "@/lib/tz";
import { AUDIT_ACTION, ROLE_LABEL, humanize } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 30;
const BASE = "/dashboard/admin/auditoria";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  await requirePageRole("SUPER_ADMIN");
  const { page: pageParam, action } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  const where = action ? { action } : {};

  const [logs, total, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: true, institution: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const actionLabel = (a: string) => AUDIT_ACTION[a] ?? humanize(a);
  const href = (params: { action?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (params.action) sp.set("action", params.action);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    const qs = sp.toString();
    return qs ? `${BASE}?${qs}` : BASE;
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Auditoría" subtitle={`${total} ${total === 1 ? "evento registrado" : "eventos registrados"}`} />

      <form action={BASE} className="flex gap-2">
        <label htmlFor="audit-action" className="sr-only">
          Filtrar por acción
        </label>
        <select id="audit-action" name="action" defaultValue={action ?? ""} className="input max-w-sm">
          <option value="">Todas las acciones</option>
          {actions
            .map((a) => a.action)
            .sort((a, b) => actionLabel(a).localeCompare(actionLabel(b), "es"))
            .map((a) => (
              <option key={a} value={a}>
                {actionLabel(a)}
              </option>
            ))}
        </select>
        <button type="submit" className="btn-secondary">
          Filtrar
        </button>
      </form>

      {logs.length === 0 ? (
        <EmptyState icon="shield" title="Sin eventos" />
      ) : (
        <ul className="list-group">
          {logs.map((log) => (
            <li key={log.id} className="list-row items-start">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{actionLabel(log.action)}</p>
                <p className="truncate text-[13px] text-slate-500">
                  {log.user?.name ?? "Usuario desconocido"}
                  {log.role ? ` · ${ROLE_LABEL[log.role] ?? log.role}` : ""}
                  {log.institution ? ` · ${log.institution.name}` : ""}
                </p>
                <p className="truncate text-[12px] text-slate-400">
                  {humanize(log.resource)}
                  {log.resourceId ? ` #${log.resourceId.slice(-6)}` : ""}
                  {log.ip ? ` · IP ${log.ip}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-[12px] tabular-nums text-slate-400">{formatDateTimeEs(log.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => href({ action, page: p })} />
    </div>
  );
}
