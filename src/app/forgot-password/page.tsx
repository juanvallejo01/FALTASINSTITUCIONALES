import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-slate-500">
            Te enviaremos instrucciones para restablecer tu acceso.
          </p>
        </div>
        <div className="card p-6">
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-brand-600 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
