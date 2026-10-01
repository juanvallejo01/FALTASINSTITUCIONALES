import { requirePageRole } from "@/lib/rbac";
import { ProfileView } from "@/components/layout/ProfileView";

export default async function PerfilSeguimientoPage() {
  const session = await requirePageRole("GESTOR_SEGUIMIENTO");
  return (
    <ProfileView
      name={session.name}
      role={session.role}
      rows={[
        { label: "Correo", value: session.email },
        { label: "Alcance", value: session.institutionId ? "Una institución" : "Todas las instituciones" },
      ]}
    />
  );
}
