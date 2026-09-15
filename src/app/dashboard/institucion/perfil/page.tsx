import { requirePageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default async function PerfilInstitucionPage() {
  const session = await requirePageRole("ADMIN_INSTITUCIONAL");
  const institution = session.institutionId
    ? await prisma.institution.findUnique({ where: { id: session.institutionId } })
    : null;

  return (
    <div className="max-w-md space-y-6">
      <div className="card space-y-3 p-6 text-sm">
        <h1 className="text-lg font-semibold text-slate-900">Mi perfil</h1>
        <dl className="space-y-2">
          <Row label="Nombre" value={session.name} />
          <Row label="Correo" value={session.email} />
          {institution && <Row label="Institución" value={institution.name} />}
          {institution && <Row label="Código" value={institution.code} />}
        </dl>
      </div>
      <ChangePasswordForm />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
