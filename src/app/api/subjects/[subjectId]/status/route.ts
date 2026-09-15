import { requireRole } from "@/lib/rbac";
import { toggleSubjectStatus } from "@/lib/academic";
import { handleApiError, ok } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const { subjectId } = await params;
    await toggleSubjectStatus(subjectId, session.institutionId!, session, request);
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
