import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { ValidationError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Genera un token de recuperación si el correo existe. Por diseño SIEMPRE
 * se comporta igual de cara al llamador exista o no la cuenta (no se
 * filtra si un correo está registrado); el link solo se genera realmente
 * cuando sí existe.
 *
 * No hay servicio de correo real en este MVP (sección 35 del spec): en
 * modo DEMO el link se devuelve directamente en la respuesta de la API,
 * marcado como tal. En un despliegue real, este token se enviaría por
 * correo y jamás se devolvería en la respuesta HTTP.
 */
export async function requestPasswordReset(
  email: string,
  request: Request,
): Promise<{ demoResetToken: string | null }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status === "INACTIVE" || user.deletedAt) {
    return { demoResetToken: null };
  }

  const rawToken = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashToken(rawToken),
      passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  await writeAuditLog({
    userId: user.id,
    role: user.role,
    institutionId: user.institutionId,
    action: "PASSWORD_RESET_REQUESTED",
    resource: "User",
    resourceId: user.id,
    request,
  });

  return { demoResetToken: rawToken };
}

export async function resetPassword(
  token: string,
  newPassword: string,
  request: Request,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { passwordResetToken: hashToken(token) } });
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    throw new ValidationError("El enlace de recuperación es inválido o ha expirado");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await writeAuditLog({
    userId: user.id,
    role: user.role,
    institutionId: user.institutionId,
    action: "PASSWORD_RESET",
    resource: "User",
    resourceId: user.id,
    request,
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  request: Request,
): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new ValidationError("La contraseña actual es incorrecta");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  await writeAuditLog({
    userId: user.id,
    role: user.role,
    institutionId: user.institutionId,
    action: "PASSWORD_CHANGE",
    resource: "User",
    resourceId: user.id,
    request,
  });
}
