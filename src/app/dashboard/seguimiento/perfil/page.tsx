import { requirePageRole } from "@/lib/rbac";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default async function PerfilGestorPage() {
  const session = await requirePageRole("GESTOR_SEGUIMIENTO");
  return (
    <div className="max-w-md space-y-6">
      <div className="card space-y-3 p-6 text-sm">
        <h1 className="text-lg font-semibold text-slate-900">Mi perfil</h1>
        <dl className="space-y-2">
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="text-slate-500">Nombre</dt>
            <dd className="font-medium text-slate-900">{session.name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="text-slate-500">Correo</dt>
            <dd className="font-medium text-slate-900">{session.email}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="text-slate-500">Alcance</dt>
            <dd className="font-medium text-slate-900">
              {session.institutionId ? "Una institución" : "Todas las instituciones"}
            </dd>
          </div>
        </dl>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
