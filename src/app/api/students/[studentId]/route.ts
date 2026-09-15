import { requireRole } from "@/lib/rbac";
import { softDeleteStudent, updateStudentForInstitution } from "@/lib/admin";
import { updateStudentSchema } from "@/lib/schemas/admin";
import { handleApiError, ok } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const { studentId } = await params;
    const body = await request.json();
    const data = updateStudentSchema.parse(body);
    const student = await updateStudentForInstitution(
      studentId,
      session.institutionId!,
      data,
      session,
      request,
    );
    return ok({ student });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const { studentId } = await params;
    await softDeleteStudent(studentId, session.institutionId!, session, request);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
