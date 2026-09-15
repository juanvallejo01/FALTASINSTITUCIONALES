import { requirePageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { InstitutionsManager } from "@/components/admin/InstitutionsManager";

export default async function InstitucionesPage() {
  await requirePageRole("SUPER_ADMIN");

  const institutions = await prisma.institution.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true, teachers: true, courses: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Instituciones ({institutions.length})</h1>
      <InstitutionsManager
        initialInstitutions={institutions.map((i) => ({
          id: i.id,
          code: i.code,
          name: i.name,
          address: i.address,
          status: i.status,
          counts: i._count,
        }))}
      />
    </div>
  );
}
