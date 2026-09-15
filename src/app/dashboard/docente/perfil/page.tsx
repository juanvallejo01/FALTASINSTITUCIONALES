import { requirePageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default async function PerfilDocentePage() {
  const session = await requirePageRole("DOCENTE");
  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.sub },
    include: { institution: true, campus: true },
  });

  return (
    <div className="max-w-md space-y-6">
      <div className="card space-y-3 p-6 text-sm">
        <h1 className="text-lg font-semibold text-slate-900">Mi perfil</h1>
        <dl className="space-y-2">
          <Row label="Nombre" value={session.name} />
          <Row label="Correo" value={session.email} />
          {teacher && (
            <>
              <Row label="Código interno" value={teacher.internalCode} />
              <Row label="Institución" value={teacher.institution.name} />
              <Row label="Sede" value={teacher.campus.name} />
              {teacher.phone && <Row label="Teléfono" value={teacher.phone} />}
            </>
          )}
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
