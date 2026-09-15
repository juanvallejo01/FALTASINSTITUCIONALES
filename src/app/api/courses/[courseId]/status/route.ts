import { requireRole } from "@/lib/rbac";
import { toggleCourseStatus } from "@/lib/academic";
import { handleApiError, ok } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const { courseId } = await params;
    await toggleCourseStatus(courseId, session.institutionId!, session, request);
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
