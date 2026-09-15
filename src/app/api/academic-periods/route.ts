import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createAcademicPeriod } from "@/lib/academic";
import { createAcademicPeriodSchema } from "@/lib/schemas/academic";
import { handleApiError, ok } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const periods = await prisma.academicPeriod.findMany({
      where: { institutionId: session.institutionId! },
      orderBy: { startDate: "desc" },
    });
    return ok({ periods });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const body = await request.json();
    const data = createAcademicPeriodSchema.parse(body);
    const period = await createAcademicPeriod(session.institutionId!, data, session, request);
    return ok({ period }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
