import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthScreen title="Restablecer contraseña">
      <div className="card p-5">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-[15px] text-red-600">Enlace inválido: falta el token de recuperación.</p>
        )}
      </div>
    </AuthScreen>
  );
}
