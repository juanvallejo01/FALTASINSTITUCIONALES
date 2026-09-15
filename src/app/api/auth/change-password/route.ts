import { requireSession } from "@/lib/rbac";
import { changePassword } from "@/lib/password-reset";
import { changePasswordSchema } from "@/lib/schemas/auth";
import { handleApiError, ok } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);
    await changePassword(session.sub, currentPassword, newPassword, request);
    return ok({ changed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
