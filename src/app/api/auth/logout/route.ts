import { getSession, clearSessionCookie } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { ok } from "@/lib/api-response";

export async function POST(request: Request) {
  const session = await getSession();
  await clearSessionCookie();
  if (session) {
    await writeAuditLog({
      userId: session.sub,
      role: session.role,
      institutionId: session.institutionId,
      action: "LOGOUT",
      resource: "User",
      resourceId: session.sub,
      request,
    });
  }
  return ok({ loggedOut: true });
}
