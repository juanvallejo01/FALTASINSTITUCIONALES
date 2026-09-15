import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createInstitution } from "@/lib/admin";
import { createInstitutionSchema } from "@/lib/schemas/admin";
import { handleApiError, ok } from "@/lib/api-response";

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");
    const institutions = await prisma.institution.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { students: true, teachers: true, courses: true } } },
    });
    return ok({ institutions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("SUPER_ADMIN");
    const body = await request.json();
    const data = createInstitutionSchema.parse(body);
    const institution = await createInstitution(data, session, request);
    return ok({ institution }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
