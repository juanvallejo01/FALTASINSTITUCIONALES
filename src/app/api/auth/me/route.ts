import { getSession } from "@/lib/session";
import { fail, ok } from "@/lib/api-response";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("No autenticado", 401);
  return ok({
    id: session.sub,
    name: session.name,
    email: session.email,
    role: session.role,
    institutionId: session.institutionId,
  });
}
