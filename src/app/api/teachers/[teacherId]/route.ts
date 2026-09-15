import { requireRole } from "@/lib/rbac";
import { softDeleteTeacher, updateTeacherForInstitution } from "@/lib/admin";
import { updateTeacherSchema } from "@/lib/schemas/admin";
import { handleApiError, ok } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const { teacherId } = await params;
    const body = await request.json();
    const data = updateTeacherSchema.parse(body);
    const teacher = await updateTeacherForInstitution(
      teacherId,
      session.institutionId!,
      data,
      session,
      request,
    );
    return ok({ teacher });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const { teacherId } = await params;
    await softDeleteTeacher(teacherId, session.institutionId!, session, request);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
