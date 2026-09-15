import { requireRole } from "@/lib/rbac";
import { listFollowUpCases } from "@/lib/followup";
import { handleApiError, ok } from "@/lib/api-response";
import type { FollowUpStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await requireRole("GESTOR_SEGUIMIENTO", "SUPER_ADMIN");
    const { searchParams } = new URL(request.url);
    const cases = await listFollowUpCases(session, {
      institutionId: searchParams.get("institutionId") ?? undefined,
      courseId: searchParams.get("courseId") ?? undefined,
      status: (searchParams.get("status") as FollowUpStatus) ?? undefined,
      minAbsences: searchParams.get("minAbsences")
        ? Number(searchParams.get("minAbsences"))
        : undefined,
    });
    return ok({ cases });
  } catch (error) {
    return handleApiError(error);
  }
}
