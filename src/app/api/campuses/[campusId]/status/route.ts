import { requireRole } from "@/lib/rbac";
import { toggleCampusStatus } from "@/lib/academic";
import { handleApiError, ok } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ campusId: string }> },
) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const { campusId } = await params;
    await toggleCampusStatus(campusId, session.institutionId!, session, request);
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
