import { requirePageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ProfileView } from "@/components/layout/ProfileView";

export default async function PerfilCoordinacionPage() {
  const session = await requirePageRole("COORDINADOR");
  const institution = session.institutionId
    ? await prisma.institution.findUnique({ where: { id: session.institutionId } })
    : null;

  const rows = [{ label: "Correo", value: session.email }];
  if (institution) rows.push({ label: "Institución", value: institution.name });

  return <ProfileView name={session.name} role={session.role} rows={rows} />;
}
