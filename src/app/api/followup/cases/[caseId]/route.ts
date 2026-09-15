import { requireRole } from "@/lib/rbac";
import { getFollowUpCaseDetail } from "@/lib/followup";
import { handleApiError, ok } from "@/lib/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  try {
    const session = await requireRole("GESTOR_SEGUIMIENTO", "SUPER_ADMIN");
    const { caseId } = await params;
    const data = await getFollowUpCaseDetail(caseId, session);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}
