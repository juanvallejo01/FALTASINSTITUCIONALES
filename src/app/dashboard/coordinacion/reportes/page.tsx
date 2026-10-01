import { requirePageRole } from "@/lib/rbac";
import { ReportsView } from "@/components/reports/ReportsView";

export default async function ReportesPage() {
  await requirePageRole("COORDINADOR");
  return <ReportsView />;
}
