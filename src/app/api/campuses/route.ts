import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createCampus } from "@/lib/academic";
import { createCampusSchema } from "@/lib/schemas/academic";
import { handleApiError, ok } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const campuses = await prisma.campus.findMany({
      where: { institutionId: session.institutionId! },
      orderBy: { name: "asc" },
    });
    return ok({ campuses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const body = await request.json();
    const data = createCampusSchema.parse(body);
    const campus = await createCampus(session.institutionId!, data, session, request);
    return ok({ campus }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
