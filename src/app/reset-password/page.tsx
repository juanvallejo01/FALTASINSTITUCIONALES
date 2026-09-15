import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Restablecer contraseña</h1>
        </div>
        <div className="card p-6">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="text-sm text-red-600">
              Enlace inválido: falta el token de recuperación.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
