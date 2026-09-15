import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/rbac";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(ROLE_HOME[session.role]);
  const { next } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Faltas Institucionales</h1>
          <p className="mt-1 text-sm text-slate-500">
            Plataforma de gestión de asistencia — <span className="font-medium">DEMO</span>
          </p>
        </div>
        <div className="card p-6">
          <LoginForm nextPath={next ?? null} />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Ambiente de demostración. Ver credenciales DEMO en README.md.
        </p>
      </div>
    </main>
  );
}
