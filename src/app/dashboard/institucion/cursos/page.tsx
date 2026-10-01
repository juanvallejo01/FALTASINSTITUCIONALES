import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { AcademicManager } from "@/components/admin/AcademicManager";

export default async function CursosInstitucionPage() {
  const session = await requirePageRole("ADMIN_INSTITUCIONAL");
  const institutionId = scopedInstitutionId(session)!;

  const [campuses, periods, subjects, courses] = await Promise.all([
    prisma.campus.findMany({ where: { institutionId }, orderBy: { name: "asc" } }),
    prisma.academicPeriod.findMany({ where: { institutionId }, orderBy: { startDate: "desc" } }),
    prisma.subject.findMany({ where: { institutionId }, orderBy: { name: "asc" } }),
    prisma.course.findMany({
      where: { institutionId },
      include: { campus: true, academicPeriod: true, _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Estructura académica" subtitle="Sedes, periodos, materias y cursos de tu institución" />
      <AcademicManager
        initialCampuses={campuses.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          status: c.status,
        }))}
        initialPeriods={periods.map((p) => ({
          id: p.id,
          name: p.name,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
          status: p.status,
        }))}
        initialSubjects={subjects.map((s) => ({ id: s.id, name: s.name, status: s.status }))}
        initialCourses={courses.map((c) => ({
          id: c.id,
          name: c.name,
          jornada: c.jornada,
          status: c.status,
          campusId: c.campusId,
          academicPeriodId: c.academicPeriodId,
          campus: { name: c.campus.name },
          academicPeriod: { name: c.academicPeriod.name },
          _count: c._count,
        }))}
      />
    </div>
  );
}
