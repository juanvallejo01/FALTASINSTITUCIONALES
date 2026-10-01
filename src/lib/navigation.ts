import type { IconName } from "@/components/ui/Icon";

export type NavLink = {
  href: string;
  label: string;
  icon: IconName;
  /** Aparece como pestaña en la barra inferior del celular (máx. 4; el resto va en "Más"). */
  tab?: boolean;
};

export type RoleNav = {
  /** Nombre corto del panel, visible en la barra superior. */
  title: string;
  links: NavLink[];
  profileHref: string;
  /** Rutas de "pantalla completa" (flujos de una sola tarea) donde se oculta la barra de pestañas. */
  immersive?: string[];
};

export const NAV: Record<"docente" | "coordinacion" | "institucion" | "admin" | "seguimiento", RoleNav> = {
  docente: {
    title: "Docente",
    profileHref: "/dashboard/docente/perfil",
    immersive: ["/dashboard/docente/asistencia/"],
    links: [
      { href: "/dashboard/docente", label: "Hoy", icon: "home", tab: true },
      { href: "/dashboard/docente/historial", label: "Historial", icon: "clock", tab: true },
      { href: "/dashboard/docente/perfil", label: "Perfil", icon: "user", tab: true },
    ],
  },
  coordinacion: {
    title: "Coordinación",
    profileHref: "/dashboard/coordinacion/perfil",
    links: [
      { href: "/dashboard/coordinacion", label: "Inicio", icon: "home", tab: true },
      { href: "/dashboard/coordinacion/asistencia", label: "Asistencia", icon: "checklist", tab: true },
      { href: "/dashboard/coordinacion/alertas", label: "Alertas", icon: "bell", tab: true },
      { href: "/dashboard/coordinacion/estudiantes", label: "Estudiantes", icon: "users", tab: true },
      { href: "/dashboard/coordinacion/cursos", label: "Cursos", icon: "book" },
      { href: "/dashboard/coordinacion/reportes", label: "Reportes", icon: "chart" },
      { href: "/dashboard/coordinacion/perfil", label: "Perfil", icon: "user" },
    ],
  },
  institucion: {
    title: "Institución",
    profileHref: "/dashboard/institucion/perfil",
    links: [
      { href: "/dashboard/institucion", label: "Inicio", icon: "home", tab: true },
      { href: "/dashboard/institucion/estudiantes", label: "Estudiantes", icon: "users", tab: true },
      { href: "/dashboard/institucion/docentes", label: "Docentes", icon: "user", tab: true },
      { href: "/dashboard/institucion/alertas", label: "Alertas", icon: "bell", tab: true },
      { href: "/dashboard/institucion/cursos", label: "Cursos", icon: "book" },
      { href: "/dashboard/institucion/reportes", label: "Reportes", icon: "chart" },
      { href: "/dashboard/institucion/perfil", label: "Perfil", icon: "user" },
    ],
  },
  admin: {
    title: "Administración",
    profileHref: "/dashboard/admin/perfil",
    links: [
      { href: "/dashboard/admin", label: "Inicio", icon: "home", tab: true },
      { href: "/dashboard/admin/instituciones", label: "Instituciones", icon: "building", tab: true },
      { href: "/dashboard/admin/auditoria", label: "Auditoría", icon: "shield", tab: true },
      { href: "/dashboard/admin/perfil", label: "Perfil", icon: "user", tab: true },
    ],
  },
  seguimiento: {
    title: "Seguimiento",
    profileHref: "/dashboard/seguimiento/perfil",
    links: [
      { href: "/dashboard/seguimiento", label: "Inicio", icon: "home", tab: true },
      { href: "/dashboard/seguimiento/casos", label: "Casos", icon: "folder", tab: true },
      { href: "/dashboard/seguimiento/perfil", label: "Perfil", icon: "user", tab: true },
    ],
  },
};
