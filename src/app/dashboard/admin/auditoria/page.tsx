import Link from "next/link";
import { requirePageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatDateTimeEs } from "@/lib/tz";

const PAGE_SIZE = 30;

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

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Auditoría ({total})</h1>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/admin/auditoria"
          className={`badge ${!action ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}
        >
          Todas
        </Link>
        {actions.map((a) => (
          <Link
            key={a.action}
            href={`/dashboard/admin/auditoria?action=${a.action}`}
            className={`badge ${action === a.action ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}
          >
            {a.action}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Fecha</th>
              <th className="px-4 py-2.5">Usuario</th>
              <th className="px-4 py-2.5">Rol</th>
              <th className="px-4 py-2.5">Institución</th>
              <th className="px-4 py-2.5">Acción</th>
              <th className="px-4 py-2.5">Recurso</th>
              <th className="px-4 py-2.5">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">
                  {formatDateTimeEs(log.createdAt)}
                </td>
                <td className="px-4 py-2.5">{log.user?.name ?? "—"}</td>
                <td className="px-4 py-2.5">{log.role ?? "—"}</td>
                <td className="px-4 py-2.5">{log.institution?.name ?? "—"}</td>
                <td className="px-4 py-2.5 font-medium text-slate-900">{log.action}</td>
                <td className="px-4 py-2.5 text-slate-500">
                  {log.resource}
                  {log.resourceId ? ` #${log.resourceId.slice(-6)}` : ""}
                </td>
                <td className="px-4 py-2.5 text-slate-400">{log.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/admin/auditoria?page=${p}${action ? `&action=${action}` : ""}`}
              className={`rounded px-2.5 py-1 ${p === page ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
