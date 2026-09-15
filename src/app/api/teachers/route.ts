import { requireRole } from "@/lib/rbac";
import { createTeacherForInstitution } from "@/lib/admin";
import { createTeacherSchema } from "@/lib/schemas/admin";
import { handleApiError, ok } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const body = await request.json();
    const data = createTeacherSchema.parse(body);
    const { teacher, tempPassword } = await createTeacherForInstitution(
      session.institutionId!,
      data,
      session,
      request,
    );
    return ok({ teacher, tempPassword }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
