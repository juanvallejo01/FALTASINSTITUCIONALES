import { requestPasswordReset } from "@/lib/password-reset";
import { forgotPasswordSchema } from "@/lib/schemas/password-reset";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { isRateLimited, registerAttempt, requestIp } from "@/lib/rate-limit";

const GENERIC_MESSAGE =
  "Si el correo existe en el sistema, se ha generado un enlace de recuperación.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const ip = requestIp(request);
    const key = `forgot:${ip}:${email}`;
    if (isRateLimited(key)) {
      return fail("Demasiadas solicitudes. Intenta nuevamente en unos minutos.", 429);
    }
    registerAttempt(key);

    const { demoResetToken } = await requestPasswordReset(email, request);

    return ok({
      message: GENERIC_MESSAGE,
      // Sección 35 del spec: no existe envío de correo real en este MVP.
      // En producción este token se enviaría por correo y NUNCA se
      // devolvería en la respuesta HTTP.
      demoResetLink: demoResetToken ? `/reset-password?token=${demoResetToken}` : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
