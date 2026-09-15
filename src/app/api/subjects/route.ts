import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createSubject } from "@/lib/academic";
import { createSubjectSchema } from "@/lib/schemas/academic";
import { handleApiError, ok } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const subjects = await prisma.subject.findMany({
      where: { institutionId: session.institutionId! },
      orderBy: { name: "asc" },
    });
    return ok({ subjects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL");
    const body = await request.json();
    const data = createSubjectSchema.parse(body);
    const subject = await createSubject(session.institutionId!, data, session, request);
    return ok({ subject }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
