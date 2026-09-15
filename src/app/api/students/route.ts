import { requireRole } from "@/lib/rbac";
import { createStudentForInstitution } from "@/lib/admin";
import { createStudentSchema } from "@/lib/schemas/admin";
import { handleApiError, ok } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const body = await request.json();
    const data = createStudentSchema.parse(body);
    const student = await createStudentForInstitution(session.institutionId!, data, session, request);
    return ok({ student }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
