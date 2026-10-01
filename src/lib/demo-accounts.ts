/**
 * Cuentas DEMO creadas por prisma/seed.ts. Se muestran en /login para entrar
 * rápido durante las pruebas; nunca deben mostrarse en un ambiente real.
 */
export const DEMO_PASSWORD = "Demo12345!";

export const DEMO_ACCOUNTS = [
  { role: "Super Admin", email: "superadmin@demo.local" },
  { role: "Gestor de Seguimiento", email: "seguimiento@demo.local" },
  { role: "Admin institucional", email: "admin@demo.local" },
  { role: "Coordinador", email: "coordinador@demo.local" },
  { role: "Docente", email: "docente@demo.local" },
] as const;

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number];

/**
 * Las credenciales se muestran fuera de producción, o en producción solo si
 * SHOW_DEMO_LOGIN=true (p. ej. un despliegue de pruebas).
 */
export function showDemoLogin(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_LOGIN === "true";
}
