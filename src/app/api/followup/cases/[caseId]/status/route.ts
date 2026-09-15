import { requireRole } from "@/lib/rbac";
import { updateFollowUpCaseStatus } from "@/lib/followup";
import { updateCaseStatusSchema } from "@/lib/schemas/followup";
import { handleApiError, ok } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  try {
    const session = await requireRole("GESTOR_SEGUIMIENTO", "SUPER_ADMIN");
    const { caseId } = await params;
    const body = await request.json();
    const { status } = updateCaseStatusSchema.parse(body);
    await updateFollowUpCaseStatus(caseId, status, session, request);
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
