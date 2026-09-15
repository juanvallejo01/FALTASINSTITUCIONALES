import "server-only";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

/**
 * Punto único de autorización backend. El frontend puede ocultar botones,
 * pero toda ruta de API y server action DEBE pasar por aquí: nunca confiar
 * en que el cliente respete el rol que se le mostró.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    throw new ForbiddenError(`Rol ${session.role} no tiene acceso a este recurso`);
  }
  return session;
}

/**
 * Verifica que la sesión pueda operar sobre una institución dada.
 * SUPER_ADMIN tiene alcance global. El resto de roles solo puede operar
 * sobre su propia institución (institutionId debe coincidir exactamente).
 */
export function assertInstitutionAccess(
  session: SessionPayload,
  institutionId: string,
): void {
  if (session.role === "SUPER_ADMIN") return;
  if (session.institutionId !== institutionId) {
    throw new ForbiddenError(
      "El usuario no tiene acceso a la institución solicitada",
    );
  }
}

/**
 * Devuelve el institutionId por el que se debe filtrar una consulta.
 * - SUPER_ADMIN: null => sin filtro (alcance global).
 * - GESTOR_SEGUIMIENTO: puede tener alcance global (institutionId null en su
 *   usuario) porque representa a una entidad externa que da seguimiento a
 *   varias instituciones; solo aplica en los endpoints de seguimiento/alertas
 *   a los que este rol tiene acceso, nunca en módulos operativos completos.
 * - Resto de roles: su institutionId es obligatorio (aislamiento estricto).
 */
export function scopedInstitutionId(session: SessionPayload): string | null {
  if (session.role === "SUPER_ADMIN") return null;
  if (session.role === "GESTOR_SEGUIMIENTO") return session.institutionId;
  if (!session.institutionId) {
    throw new ForbiddenError("El usuario no tiene una institución asignada");
  }
  return session.institutionId;
}

/**
 * Variante de requireRole para Server Components (páginas/layouts). En vez
 * de lanzar un error que renderizaría una pantalla de error genérica,
 * redirige a /login o al home del rol correspondiente. La API sigue
 * usando requireRole/requireSession, que sí lanzan errores tipados.
 */
export async function requirePageRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.role)) redirect(ROLE_HOME[session.role]);
  return session;
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Administrador General",
  ADMIN_INSTITUCIONAL: "Administrador Institucional",
  COORDINADOR: "Coordinador",
  DOCENTE: "Docente",
  GESTOR_SEGUIMIENTO: "Gestor de Seguimiento",
};

export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: "/dashboard/admin",
  ADMIN_INSTITUCIONAL: "/dashboard/institucion",
  COORDINADOR: "/dashboard/coordinacion",
  DOCENTE: "/dashboard/docente",
  GESTOR_SEGUIMIENTO: "/dashboard/seguimiento",
};
