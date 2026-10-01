import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/rbac";
import { LoginForm } from "@/components/auth/LoginForm";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, showDemoLogin } from "@/lib/demo-accounts";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(ROLE_HOME[session.role]);
  const { next } = await searchParams;
  const demo = showDemoLogin() ? { accounts: DEMO_ACCOUNTS, password: DEMO_PASSWORD } : null;

  return (
    <AuthScreen
      title="Faltas Institucionales"
      subtitle="Gestión de asistencia escolar"
      footer={
        !demo && (
          <p className="text-[13px] text-slate-400">Ambiente de demostración. Ver credenciales DEMO en README.md.</p>
        )
      }
    >
      <LoginForm nextPath={next ?? null} demo={demo} />
    </AuthScreen>
  );
}
