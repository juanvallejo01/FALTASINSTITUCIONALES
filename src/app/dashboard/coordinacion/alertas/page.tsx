import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { AlertsList } from "@/components/followup/AlertsList";

export default async function AlertasPage() {
  const session = await requirePageRole("COORDINADOR");
  return <AlertsList institutionId={scopedInstitutionId(session)!} />;
}
