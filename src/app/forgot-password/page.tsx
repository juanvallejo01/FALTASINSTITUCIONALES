import Link from "next/link";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthScreen
      title="Recuperar contraseña"
      subtitle="Te enviaremos instrucciones para restablecer tu acceso."
      footer={
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      <div className="card p-5">
        <ForgotPasswordForm />
      </div>
    </AuthScreen>
  );
}
