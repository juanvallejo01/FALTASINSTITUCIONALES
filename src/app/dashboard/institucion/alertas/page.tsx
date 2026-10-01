import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { AlertsList } from "@/components/followup/AlertsList";

export default async function AlertasInstitucionPage() {
  const session = await requirePageRole("ADMIN_INSTITUCIONAL");
  return <AlertsList institutionId={scopedInstitutionId(session)!} />;
}
