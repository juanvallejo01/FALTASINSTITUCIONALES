/**
 * Seed reproducible de datos DEMO. Todos los nombres, identificaciones y
 * teléfonos son ficticios (marcados DEMO) — ver sección 1.2 del prompt.
 * Ejecutar con: npm run seed
 */
import { PrismaClient, type Role, type DayOfWeek } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { recomputeStudentAlert } from "../src/lib/alerts";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo12345!";

// PRNG determinista (mulberry32) para que el seed sea reproducible entre corridas.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260915);
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}
function chance(p: number): boolean {
  return rand() < p;
}

const FIRST_NAMES = [
  "Juan", "María", "Carlos", "Ana", "Luis", "Camila", "Andrés", "Valentina",
  "Diego", "Sofía", "Miguel", "Laura", "Santiago", "Isabella", "Daniel",
  "Mariana", "Felipe", "Gabriela", "Sebastián", "Daniela", "Nicolás", "Paula",
];
const LAST_NAMES = [
  "Pérez", "López", "Gómez", "Rodríguez", "Martínez", "García", "Hernández",
  "González", "Díaz", "Torres", "Ramírez", "Flórez", "Castro", "Vargas",
  "Muñoz", "Rojas",
];
function fakeName(): { firstName: string; lastName: string } {
  return { firstName: pick(FIRST_NAMES), lastName: pick(LAST_NAMES) };
}
function fakePhone(): string {
  return `30${Math.floor(rand() * 10)}${Math.floor(1000000 + rand() * 8999999)}`;
}

const SUBJECT_NAMES = ["Matemáticas", "Lenguaje", "Ciencias Naturales"];
const COURSE_NAMES = ["8-01", "8-02"];

type UserSeed = { email: string; name: string; role: Role; institutionId: string | null };

async function createUser(seed: UserSeed) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  return prisma.user.create({
    data: {
      email: seed.email,
      name: seed.name,
      role: seed.role,
      institutionId: seed.institutionId,
      passwordHash,
    },
  });
}

async function main() {
  console.log("Limpiando datos existentes...");
  await prisma.followUpContact.deleteMany();
  await prisma.followUpCase.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.alertConfig.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.teacherCourseSubject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.course.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.academicPeriod.deleteMany();
  await prisma.campus.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();

  console.log("Creando configuración global de alertas...");
  await prisma.alertConfig.create({
    data: {
      institutionId: null,
      seguimientoThreshold: 3,
      alertaThreshold: 5,
      consecutiveThreshold: 3,
      minAttendancePercent: 80,
      periodDays: 30,
    },
  });

  console.log("Creando SUPER_ADMIN...");
  await createUser({
    email: "superadmin@demo.local",
    name: "Administrador General (DEMO)",
    role: "SUPER_ADMIN",
    institutionId: null,
  });

  console.log("Creando GESTOR_SEGUIMIENTO (alcance global)...");
  await createUser({
    email: "seguimiento@demo.local",
    name: "Gestora de Seguimiento (DEMO)",
    role: "GESTOR_SEGUIMIENTO",
    institutionId: null,
  });

  const INSTITUTION_COUNT = 5;
  const today = new Date();
  const BUSINESS_DAYS_BACK = 15;

  for (let i = 1; i <= INSTITUTION_COUNT; i++) {
    const code = `INST-${String(i).padStart(3, "0")}`;
    const name = `Institución DEMO ${String(i).padStart(2, "0")}`;
    console.log(`\nCreando ${name} (${code})...`);

    const institution = await prisma.institution.create({
      data: { code, name, status: "ACTIVE", address: "Dirección DEMO, Cali, Colombia" },
    });

    const campus = await prisma.campus.create({
      data: { institutionId: institution.id, name: "Sede Principal", status: "ACTIVE" },
    });

    const period = await prisma.academicPeriod.create({
      data: {
        institutionId: institution.id,
        name: "2026",
        startDate: new Date("2026-01-20"),
        endDate: new Date("2026-11-30"),
        status: "ACTIVE",
      },
    });

    const subjects = await Promise.all(
      SUBJECT_NAMES.map((subjectName) =>
        prisma.subject.create({
          data: { institutionId: institution.id, name: subjectName },
        }),
      ),
    );

    const courses = await Promise.all(
      COURSE_NAMES.map((courseName) =>
        prisma.course.create({
          data: {
            institutionId: institution.id,
            campusId: campus.id,
            academicPeriodId: period.id,
            name: courseName,
            jornada: "MANANA",
          },
        }),
      ),
    );

    // Usuarios administrativos de la institución. La primera institución usa
    // los correos genéricos documentados en el README para las cuentas DEMO.
    const suffix = i === 1 ? "" : `.inst${String(i).padStart(2, "0")}`;
    await createUser({
      email: `admin${suffix}@demo.local`,
      name: `Admin Institucional ${name} (DEMO)`,
      role: "ADMIN_INSTITUCIONAL",
      institutionId: institution.id,
    });
    await createUser({
      email: `coordinador${suffix}@demo.local`,
      name: `Coordinador ${name} (DEMO)`,
      role: "COORDINADOR",
      institutionId: institution.id,
    });

    // Docentes: uno por materia, cada uno dicta ambos cursos.
    const teacherRecords = [];
    for (let t = 0; t < subjects.length; t++) {
      const { firstName, lastName } = fakeName();
      const email = t === 0 ? `docente${suffix}@demo.local` : `docente${suffix}.${t + 1}@demo.local`;
      const user = await createUser({
        email,
        name: `${firstName} ${lastName} (DEMO)`,
        role: "DOCENTE",
        institutionId: institution.id,
      });
      const teacher = await prisma.teacher.create({
        data: {
          userId: user.id,
          institutionId: institution.id,
          campusId: campus.id,
          firstName,
          lastName,
          internalCode: `DOC-${code}-${t + 1}`,
          phone: fakePhone(),
        },
      });
      teacherRecords.push({ teacher, subject: subjects[t]! });
    }

    const DAY_SEQUENCE: DayOfWeek[] = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];
    for (const course of courses) {
      for (let t = 0; t < teacherRecords.length; t++) {
        const { teacher, subject } = teacherRecords[t]!;
        const startHour = 7 + t;
        for (const day of DAY_SEQUENCE) {
          await prisma.teacherCourseSubject.create({
            data: {
              teacherId: teacher.id,
              courseId: course.id,
              subjectId: subject.id,
              dayOfWeek: day,
              startTime: `${String(startHour).padStart(2, "0")}:00`,
              endTime: `${String(startHour + 1).padStart(2, "0")}:00`,
            },
          });
        }
      }
    }

    // Estudiantes y acudientes ficticios.
    const studentsByCourse: Record<string, string[]> = {};
    for (const course of courses) {
      studentsByCourse[course.id] = [];
      for (let s = 0; s < 7; s++) {
        const { firstName, lastName } = fakeName();
        const { firstName: gFirst, lastName: gLast } = fakeName();
        const guardian = await prisma.guardian.create({
          data: {
            firstName: gFirst,
            lastName: gLast,
            phone: fakePhone(),
            relationship: pick(["Madre", "Padre", "Tutor/a"]),
          },
        });
        const student = await prisma.student.create({
          data: {
            institutionId: institution.id,
            campusId: campus.id,
            courseId: course.id,
            guardianId: guardian.id,
            firstName,
            lastName,
            internalCode: `${code}-${course.name}-${s + 1}`,
            jornada: "MANANA",
          },
        });
        studentsByCourse[course.id]!.push(student.id);
      }
    }

    // Un pequeño grupo de estudiantes "problema" con alta probabilidad de
    // ausencia, para demostrar de forma realista el flujo de alertas.
    const allStudentIds = Object.values(studentsByCourse).flat();
    const frequentAbsentees = new Set(
      allStudentIds.filter(() => chance(0.2)),
    );

    console.log(`  Generando asistencia de los últimos ${BUSINESS_DAYS_BACK} días hábiles...`);
    for (let d = BUSINESS_DAYS_BACK; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dow = date.getDay(); // 0 domingo, 6 sábado
      if (dow === 0 || dow === 6) continue;
      const dayName = DAY_SEQUENCE[dow - 1]!;
      const dateOnly = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

      for (const course of courses) {
        for (const { teacher, subject } of teacherRecords) {
          const assignment = await prisma.teacherCourseSubject.findFirst({
            where: { teacherId: teacher.id, courseId: course.id, subjectId: subject.id, dayOfWeek: dayName },
          });
          if (!assignment) continue;

          const session = await prisma.attendanceSession.create({
            data: {
              institutionId: institution.id,
              courseId: course.id,
              subjectId: subject.id,
              teacherId: teacher.id,
              date: dateOnly,
              startTime: assignment.startTime,
              status: "REGISTRADA",
              registeredAt: date,
            },
          });

          const teacherUser = await prisma.user.findUnique({ where: { id: teacher.userId } });

          for (const studentId of studentsByCourse[course.id]!) {
            const absenceProb = frequentAbsentees.has(studentId) ? 0.45 : 0.06;
            const lateProb = 0.05;
            let status: "PRESENTE" | "AUSENTE" | "TARDE" = "PRESENTE";
            if (chance(absenceProb)) status = "AUSENTE";
            else if (chance(lateProb)) status = "TARDE";

            await prisma.attendanceRecord.create({
              data: {
                sessionId: session.id,
                studentId,
                status,
                recordedById: teacherUser!.id,
              },
            });
          }
        }
      }
    }

    console.log("  Calculando alertas y casos de seguimiento...");
    for (const studentId of allStudentIds) {
      await recomputeStudentAlert(studentId);
    }
  }

  const [institutions, users, students, sessions, records, alerts, cases] = await Promise.all([
    prisma.institution.count(),
    prisma.user.count(),
    prisma.student.count(),
    prisma.attendanceSession.count(),
    prisma.attendanceRecord.count(),
    prisma.alert.count(),
    prisma.followUpCase.count(),
  ]);

  console.log("\nResumen del seed:");
  console.table({ institutions, users, students, sessions, records, alerts, cases });
  console.log(`\nContraseña DEMO para todas las cuentas: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
