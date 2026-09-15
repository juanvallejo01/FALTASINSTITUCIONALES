import { requireRole } from "@/lib/rbac";
import { updateCourse } from "@/lib/academic";
import { updateCourseSchema } from "@/lib/schemas/academic";
import { handleApiError, ok } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const { courseId } = await params;
    const body = await request.json();
    const data = updateCourseSchema.parse(body);
    const course = await updateCourse(courseId, session.institutionId!, data, session, request);
    return ok({ course });
  } catch (error) {
    return handleApiError(error);
  }
}
