import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";

const TONES = {
  default: { value: "text-slate-900", icon: "bg-slate-100 text-slate-500" },
  danger: { value: "text-red-600", icon: "bg-red-50 text-red-500" },
  warning: { value: "text-amber-600", icon: "bg-amber-50 text-amber-500" },
  success: { value: "text-emerald-600", icon: "bg-emerald-50 text-emerald-500" },
  info: { value: "text-brand-600", icon: "bg-brand-50 text-brand-600" },
} as const;

/**
 * Indicador numérico. Si recibe `href`, toda la tarjeta es tocable y lleva al detalle
 * (en vez de mostrar un número "muerto" con un botón aparte).
 */
export function StatCard({
  label,
  value,
  tone = "default",
  icon,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  tone?: keyof typeof TONES;
  icon?: IconName;
  hint?: string;
  href?: string;
}) {
  const t = TONES[tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium leading-snug text-slate-500">{label}</p>
        {icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.icon}`}>
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className={`mt-2 text-[28px] font-bold leading-none tracking-tight tabular-nums ${t.value}`}>
        {value}
      </p>
      {(hint || href) && (
        <p className="mt-2 flex items-center gap-0.5 text-[12px] text-slate-400">
          {hint}
          {href && <Icon name="chevron-right" className="ml-auto h-4 w-4 text-slate-300" strokeWidth={2.2} />}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="card block p-4 transition hover:shadow-float active:scale-[0.98]">
        {body}
      </Link>
    );
  }
  return <div className="card p-4">{body}</div>;
}
