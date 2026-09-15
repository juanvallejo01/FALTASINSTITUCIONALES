# Faltas Institucionales — Plataforma de Gestión de Asistencia

MVP funcional de una plataforma **multiinstitución** para el registro y
seguimiento de asistencia escolar, diseñada para reemplazar el flujo manual
(planilla → coordinación → consolidación → llamada al acudiente) por un
flujo digital con trazabilidad completa:

```
DOCENTE → marca asistencia → BASE DE DATOS → COORDINACIÓN → ALERTA AUTOMÁTICA
→ GESTOR DE SEGUIMIENTO → HISTORIAL → CONTACTO CON ACUDIENTE → REGISTRO DEL RESULTADO
```

> Todos los datos de instituciones, personas y contactos son **ficticios y
> están marcados como DEMO**. No se usan datos reales de estudiantes,
> docentes ni acudientes.

---

## 1. Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript |
| UI | Tailwind CSS |
| Backend | Route Handlers de Next.js (API REST embebida en la misma app) |
| ORM / DB | Prisma 6 + PostgreSQL 15 |
| Autenticación | JWT propio (jose) en cookie httpOnly + bcrypt para contraseñas |
| Validación | Zod (frontend y backend) |
| Testing | Vitest (unitarias + integración) — Playwright instalado para E2E de navegador |
| Zona horaria | America/Bogota (configurable por `.env`) |

Arquitectura **monolítica modular** a propósito (sección 55/54 del
encargo): una sola aplicación Next.js, sin microservicios, colas ni cachés
externas — es lo que un MVP de este tamaño necesita para ser fácil de
desplegar y mantener.

---

## 2. Arquitectura y aislamiento multiinstitución

Una sola aplicación sirve a N instituciones. Cada entidad operativa
(`Student`, `Teacher`, `Course`, `AttendanceSession`, `Alert`,
`FollowUpCase`, `AuditLog`, `User`) tiene `institutionId`. El aislamiento se
aplica **en el backend**, no solo ocultando UI:

- `src/lib/rbac.ts` expone `requireRole`, `assertInstitutionAccess` y
  `scopedInstitutionId`, usados en *todos* los route handlers y páginas de
  servidor.
- Un usuario `DOCENTE`/`COORDINADOR`/`ADMIN_INSTITUCIONAL` solo puede leer o
  escribir recursos de su propia `institutionId`; se verifica de nuevo en
  cada consulta a base de datos, no solo al iniciar sesión.
- `SUPER_ADMIN` tiene alcance global.
- `GESTOR_SEGUIMIENTO` puede tener alcance global (representa a una entidad
  externa que da seguimiento a varias instituciones) o quedar limitado a
  una sola, según cómo se cree su usuario — pero **solo** en los endpoints
  de seguimiento/alertas, nunca en módulos administrativos.
- El middleware (`src/proxy.ts`, convención `proxy` de Next.js 16) es la
  primera barrera por rol sobre `/dashboard/*`; la autorización real y
  definitiva ocurre siempre en el server action / route handler, nunca solo
  ahí.

Ver `tests/integration/api.test.ts` para pruebas automatizadas de este
aislamiento (ej. un docente de la institución 1 no puede leer una sesión de
la institución 2 aunque conozca su ID).

---

## 3. Roles (RBAC)

| Rol | Alcance | Puede |
|---|---|---|
| `SUPER_ADMIN` | Global | Instituciones, auditoría, estadísticas globales |
| `ADMIN_INSTITUCIONAL` | Su institución | Docentes, estudiantes, cursos, alertas |
| `COORDINADOR` | Su institución | Ver asistencia de hoy, docentes pendientes, alertas, cursos, estudiantes (solo lectura) |
| `DOCENTE` | Sus cursos asignados | Marcar/editar asistencia de sus clases, ver su historial |
| `GESTOR_SEGUIMIENTO` | Global o una institución | Casos de seguimiento, registrar llamadas, cambiar estado — **sin** acceso administrativo |

---

## 4. Requisitos

- Node.js ≥ 20.9 (usado en desarrollo: Node 22)
- PostgreSQL ≥ 14 (usado en desarrollo: PostgreSQL 15)
- npm

## 5. Instalación

```bash
npm install
cp .env.example .env   # y completa los valores (ver sección 6)
createdb faltas_institucionales   # o el nombre que uses en DATABASE_URL

npm run prisma:migrate   # crea el esquema
npm run seed              # datos DEMO reproducibles
npm run dev               # http://localhost:3000
```

## 6. Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `AUTH_SECRET` | Secreto para firmar el JWT de sesión (≥32 caracteres aleatorios; generar con `openssl rand -base64 48`) |
| `APP_TIMEZONE` | Zona horaria de la app (por defecto `America/Bogota`) |
| `NODE_ENV` | `development` / `production` |

Nunca commitear `.env` con secretos reales (ya está en `.gitignore`).
`.env.example` documenta las variables sin valores reales.

## 7. Base de datos y seed

El esquema completo está en `prisma/schema.prisma` (ver sección 10 más
abajo). `prisma/seed.ts` es **reproducible** (PRNG con semilla fija) y crea:

- 5 instituciones DEMO (`INST-001`…`INST-005`), cada una con sede, periodo
  académico 2026, 2 cursos, 3 materias, 2 docentes y 14 estudiantes con
  acudiente ficticio.
- Asistencia de los últimos 15 días hábiles, con un ~20% de estudiantes con
  alta probabilidad de ausencia para generar alertas realistas.
- Alertas y casos de seguimiento calculados automáticamente a partir de esa
  asistencia (misma lógica de `src/lib/alerts.ts` que usa la app en caliente).

La arquitectura soporta más instituciones sin cambios estructurales: el
número `5` es solo el tamaño del seed, no un límite (ver
`src/lib/schemas/admin.ts` + `/dashboard/admin/instituciones`, donde
`SUPER_ADMIN` puede crear instituciones adicionales desde la UI).

## 8. Cuentas DEMO

Contraseña para **todas** las cuentas: `Demo12345!`

| Rol | Correo | Institución |
|---|---|---|
| Super Admin | `superadmin@demo.local` | Todas (global) |
| Gestor de Seguimiento | `seguimiento@demo.local` | Todas (global) |
| Admin institucional | `admin@demo.local` | Institución DEMO 01 |
| Coordinador | `coordinador@demo.local` | Institución DEMO 01 |
| Docente | `docente@demo.local` | Institución DEMO 01 |

Para las instituciones 2-5 existen las mismas variantes con sufijo, p. ej.
`admin.inst02@demo.local`, `coordinador.inst03@demo.local`,
`docente.inst04@demo.local` — útiles para probar el aislamiento entre
instituciones.

## 9. Ejecución

```bash
npm run dev            # desarrollo (Turbopack)
npm run build           # build de producción
npm run start            # servir build de producción
npm run typecheck       # tsc --noEmit
npm run test             # pruebas unitarias (puras, sin servidor ni DB viva)
npm run test:integration # pruebas de integración/autorización (requiere dev+seed corriendo)
```

## 10. Modelo de datos

Entidades principales (`prisma/schema.prisma`): `Institution`, `Campus`,
`AcademicPeriod`, `Course`, `Subject`, `User`, `Teacher`,
`TeacherCourseSubject` (horario), `Guardian`, `Student`,
`AttendanceSession`, `AttendanceRecord`, `AlertConfig`, `Alert`,
`FollowUpCase`, `FollowUpContact`, `AuditLog`.

Decisiones relevantes:

- **Soft delete con `deletedAt` + `deletedBy`** en entidades históricamente
  importantes (`Institution`, `Campus`, `Course`, `Student`, `Teacher`,
  `User`, `FollowUpCase`, `FollowUpContact`) — nunca se borra físicamente
  asistencia ni seguimiento (sección 22 del encargo). Implementado y con
  endpoints activos (`DELETE`) para `Institution`, `Teacher` y `Student`:
  eliminar un docente o un acudiente desactiva su cuenta de acceso (no
  puede volver a iniciar sesión) pero conserva intacto su historial;
  eliminar una institución bloquea el login de todos sus usuarios
  (verificado en `/api/auth/login`) sin borrar ni un solo registro
  histórico de estudiantes, asistencia o alertas.
- **`AuditLog` es solo-inserción**: no existe ningún endpoint de
  actualización/eliminación sobre esa tabla en toda la app.
- **Prevención de duplicados**: `AttendanceRecord` tiene `@@unique([sessionId, studentId])`;
  volver a guardar la misma clase actualiza el registro existente (con
  auditoría `ATTENDANCE_UPDATE`) en vez de duplicarlo.
- **Separación de datos operativos y de seguimiento**: `FollowUpCase` /
  `FollowUpContact` son tablas propias, expuestas solo a
  `GESTOR_SEGUIMIENTO`/`SUPER_ADMIN` mediante endpoints dedicados
  (`src/lib/followup.ts`) que devuelven exclusivamente los campos
  necesarios (nunca información administrativa completa de la
  institución).
- **Umbrales de alerta configurables** vía `AlertConfig`
  (`seguimientoThreshold`, `alertaThreshold`, `consecutiveThreshold`,
  `minAttendancePercent`, `periodDays`), con fallback global si una
  institución no define los suyos — nunca hardcodeados (sección 16).
- Índices en `institutionId`, `studentId`, `teacherId`, `courseId`, `date`,
  y en los `status` de asistencia/alerta/seguimiento, incluyendo índices
  compuestos para las consultas de duplicados y agenda diaria.

## 11. Endpoints principales

Formato de respuesta consistente: `{ success, data, message }`.

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/forgot-password                    (genera token de recuperación)
POST   /api/auth/reset-password                     (consume el token, un solo uso)
POST   /api/auth/change-password                     (usuario autenticado)

GET    /api/attendance/today                       (DOCENTE)
GET    /api/attendance/sessions/:sessionId          (roster de una clase)
POST   /api/attendance/sessions/:sessionId          (guardar asistencia)
GET    /api/attendance/history                      (DOCENTE)

GET    /api/followup/cases                          (GESTOR_SEGUIMIENTO, SUPER_ADMIN)
GET    /api/followup/cases/:caseId
POST   /api/followup/cases/:caseId/contacts         (registrar llamada)
PATCH  /api/followup/cases/:caseId/status

POST   /api/students             PATCH /api/students/:id             DELETE /api/students/:id            (ADMIN_INSTITUCIONAL)
POST   /api/teachers             PATCH /api/teachers/:id             DELETE /api/teachers/:id            (ADMIN_INSTITUCIONAL)

GET    /api/campuses            POST /api/campuses                PATCH /api/campuses/:id/status            (ADMIN_INSTITUCIONAL)
GET    /api/academic-periods    POST /api/academic-periods        PATCH /api/academic-periods/:id/status    (ADMIN_INSTITUCIONAL)
GET    /api/subjects            POST /api/subjects                PATCH /api/subjects/:id/status            (ADMIN_INSTITUCIONAL)
                                 POST /api/courses  PATCH /api/courses/:id  PATCH /api/courses/:id/status    (ADMIN_INSTITUCIONAL)

GET    /api/reports/attendance                      (ADMIN_INSTITUCIONAL, COORDINADOR, SUPER_ADMIN — export CSV)

GET    /api/institutions                            (SUPER_ADMIN)
POST   /api/institutions                            (SUPER_ADMIN)
PATCH  /api/institutions/:institutionId              (editar nombre/dirección — SUPER_ADMIN)
DELETE /api/institutions/:institutionId              (eliminación lógica — SUPER_ADMIN)
PATCH  /api/institutions/:institutionId/status       (activar/desactivar — SUPER_ADMIN)
```

Todas (salvo `login`) requieren sesión; cada una valida rol e institución
en el servidor mediante `src/lib/rbac.ts`, independientemente de lo que el
cliente envíe en la URL o el body.

## 12. Seguridad implementada

- Contraseñas con `bcrypt` (12 rondas), nunca en texto plano.
- Sesión JWT (`jose`, HS256) en cookie `httpOnly`, `sameSite=lax`,
  `secure` en producción, expiración de 8 horas.
- Rate limiting de login (in-memory, 8 intentos / 15 min por IP+correo) +
  bloqueo de cuenta tras 5 intentos fallidos consecutivos.
- Mensajes de error de login genéricos (no revelan si el correo existe).
- Recuperación de contraseña con token de un solo uso (hash SHA-256 en BD,
  expira a los 30 minutos, invalida intentos fallidos y bloqueos previos al
  usarse) y cambio de contraseña autenticado con verificación de la
  contraseña actual — ver `src/lib/password-reset.ts`. `/forgot-password`
  tampoco revela si el correo existe (mismo mensaje genérico en ambos
  casos, probado en `tests/integration/api.test.ts`).
- Autorización backend en cada endpoint (no solo UI) — ver sección 2.
- Eliminar una institución bloquea el login de todos sus usuarios de
  inmediato (verificado en `/api/auth/login`, no solo ocultando la UI);
  eliminar un docente desactiva su cuenta de acceso.
- Validación de entrada con Zod en frontend y backend.
- `AuditLog` inmutable con actor, rol, institución, IP, user-agent y
  valores anteriores/nuevos para cada acción sensible.
- Sin ORM crudo/SQL manual expuesto a input de usuario (Prisma
  parametriza todo) → sin superficie de SQL injection.
- Next.js sanea JSX por defecto (sin `dangerouslySetInnerHTML`) → sin XSS
  de contenido reflejado.
- Sin secretos en el repositorio (`.env` ignorado, `.env.example` sin
  valores reales).
- Dependencias auditadas: `npm audit` → **0 vulnerabilidades** en el
  momento de la entrega (Next.js actualizado para evitar CVE-2025-66478;
  ver historial de commits/decisiones).

### Pendiente de definición (sección 57 del encargo)

Estas decisiones requieren una definición jurídica/institucional que no
corresponde inventar aquí:

- Política de retención y eliminación definitiva de datos de menores.
- Si `GESTOR_SEGUIMIENTO` requiere un contrato de encargado de tratamiento
  de datos con cada institución.
- CSRF: al usarse `sameSite=lax` + JSON (no formularios simples), el
  riesgo práctico es bajo, pero no se añadió un token CSRF explícito;
  evaluarlo si se exponen mutaciones vía formularios `multipart`/GET.
- Forzar cambio de contraseña en el primer login de cuentas creadas por un
  administrador (hoy la contraseña temporal se muestra una vez en pantalla).
- Refresh token / rotación de sesión activa (hoy la sesión simplemente
  expira a las 8 horas y exige nuevo login).
- Un usuario cuya sesión JWT sigue vigente pero cuyo registro fue
  eliminado/desactivado *después* de emitirse el token conserva acceso
  hasta que expire (hasta 8 horas) — no hay invalidación activa de
  sesiones ya emitidas. Mitigado parcialmente: la escritura de auditoría
  es resiliente a este caso (no tumba la petición, ver `src/lib/audit.ts`)
  y el login vuelve a evaluarse siempre contra el estado actual de la BD.

## 13. Testing

- **Unitarias** (`tests/unit`, `npm run test`, 11 tests): reglas puras de
  negocio — cálculo de ausencias/porcentaje de asistencia y clasificación
  de nivel de alerta (`src/lib/alerts.ts`), sin base de datos.
- **Integración/autorización** (`tests/integration`, `npm run test:integration`,
  18 tests, requiere `npm run dev` + `npm run seed` corriendo): login
  válido/inválido, protección de rutas sin sesión, aislamiento entre
  instituciones, restricción de rol (`GESTOR_SEGUIMIENTO` no puede crear
  estudiantes, `COORDINADOR` no puede cambiar estado de un caso, `DOCENTE`
  no puede crear cursos), edición sin duplicados de asistencia,
  recuperación de contraseña (token de un solo uso, no filtra existencia
  de cuentas), CRUD académico (un admin no puede crear un curso con la
  sede de otra institución) y edición/eliminación lógica de instituciones,
  docentes y estudiantes (un admin no puede tocar los de otra institución;
  un docente eliminado no puede volver a iniciar sesión; eliminar dos
  veces el mismo registro devuelve conflicto en vez de duplicar el efecto).
- **Manual end-to-end verificado en navegador real** durante el desarrollo
  (Chrome, vía herramienta de automatización): login → marcar asistencia →
  guardar → verificar en auditoría; login gestor → abrir caso → registrar
  llamada → verificar cambio de estado automático; login super admin →
  crear institución → verificar que aparece sin cambios de código; login
  admin institucional → crear/editar curso, sede, periodo y materia →
  cambiar contraseña; editar y eliminar un docente (se confirmó que
  desaparece del listado y su usuario queda bloqueado, sin perder su
  historial de asistencia) y un estudiante (se confirmó que desaparece del
  roster de asistencia del docente); login super admin → editar y eliminar
  una institución (se confirmó el bloqueo de login de sus usuarios y que
  sus 14 estudiantes no se borraron). Esta verificación manual encontró y
  corrigió dos bugs reales: una conversión de zona horaria duplicada
  (sección 42) y un fallo de tabulación con teclado que rompía el login
  (accesibilidad, sección 28) — ambos corregidos en el código, no
  ocultados.
- **Playwright** está instalado (`@playwright/test`) para E2E de navegador,
  pero no se dejaron specs `.spec.ts` en este entregable por límite de
  tiempo de la sesión — los flujos que cubrirían ya se verificaron
  manualmente (ver informe de evaluación).

## 14. Estructura del proyecto

```
prisma/schema.prisma       Modelo de datos completo
prisma/seed.ts              Seed reproducible de datos DEMO
src/lib/                    Lógica de negocio y utilidades de servidor
  rbac.ts                    Autorización (requireRole, aislamiento por institución)
  session.ts                  JWT de sesión (cookie httpOnly)
  alerts.ts                   Cálculo de alertas (puro + persistencia)
  attendance.ts                Registro/edición de asistencia
  followup.ts                  Casos y contactos de seguimiento
  coordination.ts               Vistas agregadas (hoy, dashboards)
  admin.ts                      Alta de instituciones/docentes/estudiantes
  academic.ts                    CRUD de sedes/periodos/materias/cursos
  password-reset.ts               Recuperación y cambio de contraseña
  audit.ts                      Auditoría (solo inserción, resiliente a fallos)
  tz.ts                          Utilidades de zona horaria (America/Bogota)
src/app/api/                 Route handlers (API REST)
src/app/dashboard/           Paneles por rol (docente, coordinación, institución, admin, seguimiento)
src/components/              Componentes de UI reutilizables
tests/unit, tests/integration
```

## 15. Despliegue

Pensado para desplegarse como un único servicio Node.js (`next build` +
`next start`) detrás de un proxy TLS, con PostgreSQL como servicio
gestionado aparte. No requiere colas, cachés ni servicios adicionales.
