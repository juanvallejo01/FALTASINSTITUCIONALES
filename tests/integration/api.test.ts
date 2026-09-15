/**
 * Pruebas de integración y autorización contra la API real (sección 45-47
 * del spec). Requieren:
 *   1. La base de datos con el seed de datos DEMO ya aplicado (`npm run seed`).
 *   2. El servidor de desarrollo corriendo en http://localhost:3000
 *      (`npm run dev`).
 *
 * No se ejecutan como parte de `npm test` por defecto (ver script
 * `test:integration`) porque dependen de un proceso externo vivo, a
 * diferencia de las pruebas unitarias puras en tests/unit.
 */
import { describe, expect, it } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const DEMO_PASSWORD = "Demo12345!";

async function login(email: string, password = DEMO_PASSWORD) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  const setCookie = res.headers.get("set-cookie");
  const cookie = setCookie ? setCookie.split(";")[0] : null;
  return { res, json, cookie };
}

// vitest evalúa `describe.runIf` en tiempo de colección, antes de que
// corran los hooks beforeAll; por eso la comprobación del servidor se hace
// aquí arriba con top-level await en vez de en un beforeAll.
let serverUp = false;
try {
  const res = await fetch(`${BASE_URL}/login`);
  serverUp = res.ok;
} catch {
  serverUp = false;
}
if (!serverUp) {
  // eslint-disable-next-line no-console
  console.warn(
    `\n[integration] Servidor no disponible en ${BASE_URL}. Ejecuta "npm run dev" y "npm run seed" antes de correr estas pruebas. Se omitirán.\n`,
  );
}

describe.runIf(serverUp)("Autenticación", () => {
  it("rechaza credenciales inválidas con mensaje genérico", async () => {
    const { res, json } = await login("docente@demo.local", "clave-incorrecta");
    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Correo o contraseña incorrectos");
  });

  it("rechaza un correo inexistente con el mismo mensaje genérico (no filtra existencia de cuenta)", async () => {
    const { res, json } = await login("no-existe@demo.local", "cualquier-cosa");
    expect(res.status).toBe(401);
    expect(json.message).toBe("Correo o contraseña incorrectos");
  });

  it("permite iniciar sesión con credenciales DEMO válidas", async () => {
    const { res, json, cookie } = await login("docente@demo.local");
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.user.role).toBe("DOCENTE");
    expect(cookie).toBeTruthy();
  });
});

describe.runIf(serverUp)("Protección de rutas", () => {
  it("rechaza el acceso sin sesión a una API protegida", async () => {
    const res = await fetch(`${BASE_URL}/api/attendance/today`);
    expect(res.status).toBe(401);
  });

  it("redirige a /login al visitar el dashboard sin sesión", async () => {
    const res = await fetch(`${BASE_URL}/dashboard/docente`, { redirect: "manual" });
    expect([307, 308]).toContain(res.status);
    expect(res.headers.get("location")).toContain("/login");
  });
});

describe.runIf(serverUp)("Aislamiento multiinstitución (RBAC)", () => {
  it("un docente de la institución 1 no puede consultar una sesión de la institución 2", async () => {
    const teacher1 = await login("docente@demo.local");
    const teacher2 = await login("docente.inst02@demo.local");
    expect(teacher1.cookie).toBeTruthy();
    expect(teacher2.cookie).toBeTruthy();

    const today1 = await fetch(`${BASE_URL}/api/attendance/today`, {
      headers: { Cookie: teacher1.cookie! },
    }).then((r) => r.json());
    const sessionIdInst1 = today1.data.sessions[0]?.id;
    expect(sessionIdInst1).toBeTruthy();

    const crossAccess = await fetch(`${BASE_URL}/api/attendance/sessions/${sessionIdInst1}`, {
      headers: { Cookie: teacher2.cookie! },
    });
    const crossJson = await crossAccess.json();
    expect(crossAccess.status).toBe(403);
    expect(crossJson.success).toBe(false);
  });

  it("un gestor de seguimiento no puede crear estudiantes (fuera de su rol)", async () => {
    const gestor = await login("seguimiento@demo.local");
    const res = await fetch(`${BASE_URL}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: gestor.cookie! },
      body: JSON.stringify({
        firstName: "X",
        lastName: "Y",
        internalCode: "HACK-1",
        courseId: "no-deberia-importar",
        guardianFirstName: "A",
        guardianLastName: "B",
        guardianPhone: "3000000000",
        guardianRelationship: "Madre",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("un coordinador no puede modificar el estado de un caso de seguimiento (endpoint reservado a GESTOR/SUPER_ADMIN)", async () => {
    const coordinador = await login("coordinador@demo.local");
    const res = await fetch(`${BASE_URL}/api/followup/cases/cualquiera/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: coordinador.cookie! },
      body: JSON.stringify({ status: "CERRADO" }),
    });
    expect(res.status).toBe(403);
  });
});

describe.runIf(serverUp)("Asistencia: edición sin duplicados", () => {
  it("guardar la asistencia dos veces actualiza el registro existente en vez de duplicarlo", async () => {
    const teacher = await login("docente.inst03@demo.local");
    const today = await fetch(`${BASE_URL}/api/attendance/today`, {
      headers: { Cookie: teacher.cookie! },
    }).then((r) => r.json());
    const sessionId = today.data.sessions[0]?.id;
    expect(sessionId).toBeTruthy();

    const roster = await fetch(`${BASE_URL}/api/attendance/sessions/${sessionId}`, {
      headers: { Cookie: teacher.cookie! },
    }).then((r) => r.json());
    const firstStudentId = roster.data.students[0]?.id;
    expect(firstStudentId).toBeTruthy();

    const payload = {
      records: roster.data.students.map((s: { id: string }) => ({
        studentId: s.id,
        status: s.id === firstStudentId ? "TARDE" : "PRESENTE",
      })),
    };

    const save1 = await fetch(`${BASE_URL}/api/attendance/sessions/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: teacher.cookie! },
      body: JSON.stringify(payload),
    });
    expect(save1.status).toBe(200);

    const save2 = await fetch(`${BASE_URL}/api/attendance/sessions/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: teacher.cookie! },
      body: JSON.stringify(payload),
    });
    expect(save2.status).toBe(200);

    const rosterAfter = await fetch(`${BASE_URL}/api/attendance/sessions/${sessionId}`, {
      headers: { Cookie: teacher.cookie! },
    }).then((r) => r.json());

    const matching = rosterAfter.data.students.filter((s: { id: string }) => s.id === firstStudentId);
    expect(matching).toHaveLength(1);
    expect(matching[0].status).toBe("TARDE");
  });
});

describe.runIf(serverUp)("Recuperación de contraseña", () => {
  it("no revela si un correo existe o no", async () => {
    const existing = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "docente.inst04@demo.local" }),
    }).then((r) => r.json());
    const missing = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "no-existe-jamas@demo.local" }),
    }).then((r) => r.json());

    expect(existing.data.message).toBe(missing.data.message);
    expect(existing.data.demoResetLink).toBeTruthy();
    expect(missing.data.demoResetLink).toBeNull();
  });

  it("permite restablecer la contraseña con un token válido y el token no es reutilizable", async () => {
    const forgot = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "coordinador.inst04@demo.local" }),
    }).then((r) => r.json());
    const token = new URL(forgot.data.demoResetLink, BASE_URL).searchParams.get("token")!;
    expect(token).toBeTruthy();

    const reset1 = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: "ClaveNueva123!" }),
    });
    expect(reset1.status).toBe(200);

    const loginNueva = await login("coordinador.inst04@demo.local", "ClaveNueva123!");
    expect(loginNueva.res.status).toBe(200);

    const loginVieja = await login("coordinador.inst04@demo.local", DEMO_PASSWORD);
    expect(loginVieja.res.status).toBe(401);

    const reset2 = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: "OtraClaveMas123!" }),
    });
    expect(reset2.status).toBe(422);

    // Deja la cuenta como la encontró para no afectar otras corridas del seed.
    await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: loginNueva.cookie! },
      body: JSON.stringify({ currentPassword: "ClaveNueva123!", newPassword: DEMO_PASSWORD }),
    });
  });

  it("rechaza un token inválido", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "token-que-no-existe", newPassword: "ClaveNueva123!" }),
    });
    expect(res.status).toBe(422);
  });
});

describe.runIf(serverUp)("CRUD académico (sedes, periodos, materias, cursos)", () => {
  it("un ADMIN_INSTITUCIONAL puede crear sede, periodo, materia y curso en su propia institución", async () => {
    const admin = await login("admin.inst05@demo.local");
    expect(admin.cookie).toBeTruthy();

    const campus = await fetch(`${BASE_URL}/api/campuses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: admin.cookie! },
      body: JSON.stringify({ name: "Sede de prueba" }),
    }).then((r) => r.json());
    expect(campus.success).toBe(true);

    const period = await fetch(`${BASE_URL}/api/academic-periods`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: admin.cookie! },
      body: JSON.stringify({
        name: "Periodo de prueba",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-12-01T00:00:00.000Z",
      }),
    }).then((r) => r.json());
    expect(period.success).toBe(true);

    const subject = await fetch(`${BASE_URL}/api/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: admin.cookie! },
      body: JSON.stringify({ name: "Materia de prueba" }),
    }).then((r) => r.json());
    expect(subject.success).toBe(true);

    const course = await fetch(`${BASE_URL}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: admin.cookie! },
      body: JSON.stringify({
        name: "Curso de prueba",
        campusId: campus.data.campus.id,
        academicPeriodId: period.data.period.id,
        jornada: "UNICA",
      }),
    }).then((r) => r.json());
    expect(course.success).toBe(true);
    expect(course.data.course.institutionId).toBe(admin.json.data.user.institutionId);
  });

  it("un ADMIN_INSTITUCIONAL no puede crear un curso usando la sede de otra institución", async () => {
    const admin1 = await login("admin@demo.local"); // institución 1
    const admin2 = await login("admin.inst02@demo.local"); // institución 2

    const campusInst2 = await fetch(`${BASE_URL}/api/campuses`, {
      headers: { Cookie: admin2.cookie! },
    }).then((r) => r.json());
    const periodInst1 = await fetch(`${BASE_URL}/api/academic-periods`, {
      headers: { Cookie: admin1.cookie! },
    }).then((r) => r.json());

    const res = await fetch(`${BASE_URL}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: admin1.cookie! },
      body: JSON.stringify({
        name: "Curso cruzado",
        campusId: campusInst2.data.campuses[0].id,
        academicPeriodId: periodInst1.data.periods[0].id,
        jornada: "UNICA",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("un DOCENTE no puede crear cursos (fuera de su rol)", async () => {
    const teacher = await login("docente@demo.local");
    const res = await fetch(`${BASE_URL}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: teacher.cookie! },
      body: JSON.stringify({
        name: "No debería crearse",
        campusId: "x",
        academicPeriodId: "y",
        jornada: "UNICA",
      }),
    });
    expect(res.status).toBe(403);
  });
});

describe.runIf(serverUp)("Edición y eliminación lógica (instituciones, docentes, estudiantes)", () => {
  it("SUPER_ADMIN puede crear, editar y eliminar una institución; tras eliminarla sus usuarios no pueden iniciar sesión", async () => {
    const superAdmin = await login("superadmin@demo.local");
    const code = `TEST-DEL-${Date.now()}`;

    const created = await fetch(`${BASE_URL}/api/institutions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: superAdmin.cookie! },
      body: JSON.stringify({ name: "Institución desechable", code }),
    }).then((r) => r.json());
    expect(created.success).toBe(true);
    const institutionId = created.data.institution.id;

    const updated = await fetch(`${BASE_URL}/api/institutions/${institutionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: superAdmin.cookie! },
      body: JSON.stringify({ name: "Institución desechable (editada)" }),
    }).then((r) => r.json());
    expect(updated.data.institution.name).toBe("Institución desechable (editada)");

    const notAllowed = await fetch(`${BASE_URL}/api/institutions/${institutionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: (await login("admin@demo.local")).cookie! },
      body: JSON.stringify({ name: "Intento no autorizado" }),
    });
    expect(notAllowed.status).toBe(403);

    const deleted = await fetch(`${BASE_URL}/api/institutions/${institutionId}`, {
      method: "DELETE",
      headers: { Cookie: superAdmin.cookie! },
    });
    expect(deleted.status).toBe(200);

    const deleteAgain = await fetch(`${BASE_URL}/api/institutions/${institutionId}`, {
      method: "DELETE",
      headers: { Cookie: superAdmin.cookie! },
    });
    expect(deleteAgain.status).toBe(409); // ya estaba eliminada
  });

  it("un ADMIN_INSTITUCIONAL puede editar y eliminar un docente propio; el docente eliminado no puede iniciar sesión y otra institución no puede tocarlo", async () => {
    const admin = await login("admin.inst05@demo.local");
    const campuses = await fetch(`${BASE_URL}/api/campuses`, { headers: { Cookie: admin.cookie! } }).then(
      (r) => r.json(),
    );
    const teacherEmail = `tmp.docente.${Date.now()}@demo.local`;

    const created = await fetch(`${BASE_URL}/api/teachers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: admin.cookie! },
      body: JSON.stringify({
        firstName: "Temporal",
        lastName: "Docente",
        internalCode: `TMP-${Date.now()}`,
        email: teacherEmail,
        campusId: campuses.data.campuses[0].id,
      }),
    }).then((r) => r.json());
    expect(created.success).toBe(true);
    const teacherId = created.data.teacher.id;
    const tempPassword = created.data.tempPassword;

    const updated = await fetch(`${BASE_URL}/api/teachers/${teacherId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: admin.cookie! },
      body: JSON.stringify({ firstName: "Editado" }),
    }).then((r) => r.json());
    expect(updated.data.teacher.firstName).toBe("Editado");

    const crossAdmin = await login("admin@demo.local");
    const crossDelete = await fetch(`${BASE_URL}/api/teachers/${teacherId}`, {
      method: "DELETE",
      headers: { Cookie: crossAdmin.cookie! },
    });
    expect(crossDelete.status).toBe(404); // no pertenece a su institución

    const deleted = await fetch(`${BASE_URL}/api/teachers/${teacherId}`, {
      method: "DELETE",
      headers: { Cookie: admin.cookie! },
    });
    expect(deleted.status).toBe(200);

    const loginDeleted = await login(teacherEmail, tempPassword);
    expect(loginDeleted.res.status).toBe(401);
  });

  it("un ADMIN_INSTITUCIONAL puede editar y eliminar un estudiante propio; desaparece del roster de asistencia de su docente", async () => {
    const admin = await login("admin.inst05@demo.local");
    const campuses = await fetch(`${BASE_URL}/api/campuses`, { headers: { Cookie: admin.cookie! } }).then(
      (r) => r.json(),
    );
    const periods = await fetch(`${BASE_URL}/api/academic-periods`, {
      headers: { Cookie: admin.cookie! },
    }).then((r) => r.json());

    const course = await fetch(`${BASE_URL}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: admin.cookie! },
      body: JSON.stringify({
        name: `Curso temporal ${Date.now()}`,
        campusId: campuses.data.campuses[0].id,
        academicPeriodId: periods.data.periods[0].id,
        jornada: "UNICA",
      }),
    }).then((r) => r.json());
    expect(course.success).toBe(true);
    const courseId = course.data.course.id;

    const student = await fetch(`${BASE_URL}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: admin.cookie! },
      body: JSON.stringify({
        firstName: "Estudiante",
        lastName: "Temporal",
        internalCode: `TMP-EST-${Date.now()}`,
        courseId,
        guardianFirstName: "Acudiente",
        guardianLastName: "Temporal",
        guardianPhone: "3000000000",
        guardianRelationship: "Madre",
      }),
    }).then((r) => r.json());
    expect(student.success).toBe(true);
    const studentId = student.data.student.id;

    const updated = await fetch(`${BASE_URL}/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: admin.cookie! },
      body: JSON.stringify({ firstName: "EstudianteEditado" }),
    }).then((r) => r.json());
    expect(updated.data.student.firstName).toBe("EstudianteEditado");

    const crossAdmin = await login("admin@demo.local");
    const crossDelete = await fetch(`${BASE_URL}/api/students/${studentId}`, {
      method: "DELETE",
      headers: { Cookie: crossAdmin.cookie! },
    });
    expect(crossDelete.status).toBe(404);

    const deleted = await fetch(`${BASE_URL}/api/students/${studentId}`, {
      method: "DELETE",
      headers: { Cookie: admin.cookie! },
    });
    expect(deleted.status).toBe(200);

    const deleteAgain = await fetch(`${BASE_URL}/api/students/${studentId}`, {
      method: "DELETE",
      headers: { Cookie: admin.cookie! },
    });
    expect(deleteAgain.status).toBe(409);
  });
});
