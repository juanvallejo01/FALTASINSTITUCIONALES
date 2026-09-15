import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { ROLE_HOME } from "@/lib/rbac";

// Prefijos de /dashboard permitidos por rol. La autorización fina (por
// institución, curso, propiedad del recurso) se valida de nuevo en cada
// server action / route handler: este middleware es solo la primera capa
// (evita que un docente vea el HTML de /dashboard/admin, por ejemplo).
const ROLE_PREFIXES: Record<string, string> = {
  SUPER_ADMIN: "/dashboard/admin",
  ADMIN_INSTITUCIONAL: "/dashboard/institucion",
  COORDINADOR: "/dashboard/coordinacion",
  DOCENTE: "/dashboard/docente",
  GESTOR_SEGUIMIENTO: "/dashboard/seguimiento",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedPrefix = ROLE_PREFIXES[session.role];
  if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
