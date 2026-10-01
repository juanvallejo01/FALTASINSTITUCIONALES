import { requirePageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ProfileView } from "@/components/layout/ProfileView";

export default async function PerfilDocentePage() {
  const session = await requirePageRole("DOCENTE");
  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.sub },
    include: { institution: true, campus: true },
  });

  const rows = [{ label: "Correo", value: session.email }];
  if (teacher) {
    rows.push(
      { label: "Código interno", value: teacher.internalCode },
      { label: "Institución", value: teacher.institution.name },
      { label: "Sede", value: teacher.campus.name },
    );
    if (teacher.phone) rows.push({ label: "Teléfono", value: teacher.phone });
  }

  return <ProfileView name={session.name} role={session.role} rows={rows} />;
}
