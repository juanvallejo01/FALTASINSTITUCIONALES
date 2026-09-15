import { requireRole } from "@/lib/rbac";
import { registerFollowUpContact } from "@/lib/followup";
import { registerContactSchema } from "@/lib/schemas/followup";
import { handleApiError, ok } from "@/lib/api-response";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  try {
    const session = await requireRole("GESTOR_SEGUIMIENTO", "SUPER_ADMIN");
    const { caseId } = await params;
    const body = await request.json();
    const data = registerContactSchema.parse(body);
    const contact = await registerFollowUpContact(caseId, data, session, request);
    return ok({ contact });
  } catch (error) {
    return handleApiError(error);
  }
}
