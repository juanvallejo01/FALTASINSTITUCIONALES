import { requireSession } from "@/lib/rbac";
import { getSessionRoster, saveAttendance } from "@/lib/attendance";
import { saveAttendanceSchema } from "@/lib/schemas/attendance";
import { handleApiError, ok } from "@/lib/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await requireSession();
    const { sessionId } = await params;
    const data = await getSessionRoster(sessionId, session);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await requireSession();
    const { sessionId } = await params;
    const body = await request.json();
    const { records } = saveAttendanceSchema.parse(body);
    await saveAttendance(sessionId, records, session, request);
    return ok({ saved: true });
  } catch (error) {
    return handleApiError(error);
  }
}
