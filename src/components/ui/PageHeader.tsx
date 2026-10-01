import Link from "next/link";
import { Icon } from "./Icon";

/** Título grande al estilo iOS, con subtítulo, acciones y botón de volver opcionales. */
export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="-ml-2 mb-1 inline-flex min-h-[44px] items-center gap-0.5 rounded-lg px-1 text-[15px] font-medium text-brand-600 hover:text-brand-700"
        >
          <Icon name="chevron-left" className="h-5 w-5" strokeWidth={2.2} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
