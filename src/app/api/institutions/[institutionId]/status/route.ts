import { requireRole } from "@/lib/rbac";
import { toggleInstitutionStatus } from "@/lib/admin";
import { handleApiError, ok } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ institutionId: string }> },
) {
  try {
    const session = await requireRole("SUPER_ADMIN");
    const { institutionId } = await params;
    await toggleInstitutionStatus(institutionId, session, request);
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
