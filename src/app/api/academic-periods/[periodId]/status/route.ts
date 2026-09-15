import { requireRole } from "@/lib/rbac";
import { toggleAcademicPeriodStatus } from "@/lib/academic";
import { handleApiError, ok } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ periodId: string }> },
) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const { periodId } = await params;
    await toggleAcademicPeriodStatus(periodId, session.institutionId!, session, request);
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
