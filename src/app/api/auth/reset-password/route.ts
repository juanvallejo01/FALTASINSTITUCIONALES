import { resetPassword } from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/schemas/password-reset";
import { handleApiError, ok } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = resetPasswordSchema.parse(body);
    await resetPassword(token, newPassword, request);
    return ok({ reset: true });
  } catch (error) {
    return handleApiError(error);
  }
}
