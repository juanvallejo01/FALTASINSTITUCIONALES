import { requireRole } from "@/lib/rbac";
import { createCourse } from "@/lib/academic";
import { createCourseSchema } from "@/lib/schemas/academic";
import { handleApiError, ok } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const body = await request.json();
    const data = createCourseSchema.parse(body);
    const course = await createCourse(session.institutionId!, data, session, request);
    return ok({ course }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
