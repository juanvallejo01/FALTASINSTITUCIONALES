import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ROLE_LABEL } from "@/lib/labels";

/** Perfil al estilo de Ajustes de iOS: cabecera con avatar, datos agrupados, contraseña y cierre de sesión. */
export function ProfileView({
  name,
  role,
  rows,
}: {
  name: string;
  role: string;
  rows: { label: string; value: string }[];
}) {
  const initials = name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-col items-center pt-2 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-slate-300 to-slate-400 text-[28px] font-semibold text-white">
          {initials}
        </span>
        <h1 className="mt-3 text-[22px] font-bold tracking-tight text-slate-900">{name}</h1>
        <p className="text-[15px] text-slate-500">{ROLE_LABEL[role] ?? role}</p>
      </div>

      <section>
        <h2 className="section-title">Información</h2>
        <dl className="list-group">
          {rows.map((r) => (
            <div key={r.label} className="list-row justify-between">
              <dt className="text-slate-500">{r.label}</dt>
              <dd className="min-w-0 truncate text-right font-medium text-slate-900">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="section-title">Seguridad</h2>
        <ChangePasswordForm />
      </section>

      <div className="list-group">
        <LogoutButton variant="row" />
      </div>
    </div>
  );
}
