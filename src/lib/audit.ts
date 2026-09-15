import "server-only";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  userId?: string | null;
  role?: Role | null;
  institutionId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  request?: Request | null;
};

/**
 * AuditLog es de solo-inserción: no existen endpoints de UPDATE/DELETE sobre
 * esta tabla en el resto del sistema, garantizando su inmutabilidad de cara
 * a usuarios normales (sección 21 del spec).
 *
 * La escritura de auditoría NUNCA debe poder tumbar la acción principal
 * (login, logout, guardar asistencia, etc.). Por eso se aísla en su propio
 * try/catch: por ejemplo, si el token de sesión de un usuario sigue siendo
 * válido pero su registro ya no existe (reseed, purga, cuenta eliminada),
 * la inserción fallaría por la FK a User y sin este aislamiento tumbaría
 * con un 500 una operación que de otro modo sería válida.
 */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    const headers = input.request?.headers;
    const ip =
      headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headers?.get("x-real-ip") ??
      null;
    const userAgent = headers?.get("user-agent") ?? null;

    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        role: input.role ?? null,
        institutionId: input.institutionId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        oldValue: input.oldValue === undefined ? undefined : (input.oldValue as never),
        newValue: input.newValue === undefined ? undefined : (input.newValue as never),
        ip,
        userAgent,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("No fue posible escribir en AuditLog (la acción principal continúa):", error);
  }
}
