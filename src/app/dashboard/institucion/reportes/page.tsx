import { requirePageRole } from "@/lib/rbac";
import { ReportsView } from "@/components/reports/ReportsView";

export default async function ReportesInstitucionPage() {
  await requirePageRole("ADMIN_INSTITUCIONAL");
  return <ReportsView />;
}
