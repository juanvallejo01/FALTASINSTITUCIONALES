import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { loginSchema } from "@/lib/schemas/auth";
import { fail, handleApiError, ok } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import { isRateLimited, registerAttempt, requestIp } from "@/lib/rate-limit";
import { ROLE_HOME } from "@/lib/rbac";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const GENERIC_ERROR = "Correo o contraseña incorrectos";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const ip = requestIp(request);
    const rateLimitKey = `${ip}:${email}`;
    if (isRateLimited(rateLimitKey)) {
      return fail(
        "Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos.",
        429,
      );
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { institution: true } });

    if (!user || user.status === "INACTIVE" || user.deletedAt) {
      registerAttempt(rateLimitKey);
      return fail(GENERIC_ERROR, 401);
    }

    // Si la institución del usuario fue eliminada/inactivada, bloquear el
    // acceso aunque la cuenta individual siga activa (sección 22: eliminar
    // una institución no borra físicamente nada, pero sí debe cortar el
    // acceso de sus usuarios). No aplica a SUPER_ADMIN/GESTOR sin institución.
    if (user.institution && (user.institution.status === "INACTIVE" || user.institution.deletedAt)) {
      registerAttempt(rateLimitKey);
      return fail("La institución asociada a esta cuenta no está activa", 403);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      registerAttempt(rateLimitKey);
      return fail(
        "Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta más tarde.",
        423,
      );
    }

    const validPassword = await verifyPassword(password, user.passwordHash);

    if (!validPassword) {
      registerAttempt(rateLimitKey);
      const failedLoginAttempts = user.failedLoginAttempts + 1;
      const lockedUntil =
        failedLoginAttempts >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_DURATION_MS)
          : null;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts, lockedUntil },
      });
      await writeAuditLog({
        userId: user.id,
        role: user.role,
        institutionId: user.institutionId,
        action: "LOGIN_FAILED",
        resource: "User",
        resourceId: user.id,
        request,
      });
      return fail(GENERIC_ERROR, 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const token = await createSessionToken({
      sub: user.id,
      role: user.role,
      institutionId: user.institutionId,
      name: user.name,
      email: user.email,
    });
    await setSessionCookie(token);

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      institutionId: user.institutionId,
      action: "LOGIN",
      resource: "User",
      resourceId: user.id,
      request,
    });

    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
      },
      redirectTo: ROLE_HOME[user.role],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export function GET() {
  return NextResponse.json(
    { success: false, data: null, message: "Método no permitido" },
    { status: 405 },
  );
}
