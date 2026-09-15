import { requireRole } from "@/lib/rbac";
import { softDeleteInstitution, updateInstitution } from "@/lib/admin";
import { updateInstitutionSchema } from "@/lib/schemas/admin";
import { handleApiError, ok } from "@/lib/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ institutionId: string }> },
) {
  try {
    const session = await requireRole("SUPER_ADMIN");
    const { institutionId } = await params;
    const body = await request.json();
    const data = updateInstitutionSchema.parse(body);
    const institution = await updateInstitution(institutionId, data, session, request);
    return ok({ institution });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ institutionId: string }> },
) {
  try {
    const session = await requireRole("SUPER_ADMIN");
    const { institutionId } = await params;
    await softDeleteInstitution(institutionId, session, request);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
