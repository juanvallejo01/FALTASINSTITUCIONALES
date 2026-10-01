import { Icon } from "@/components/ui/Icon";

/** Pantallas de acceso: ícono de la app, título grande y contenido centrado. */
export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-float">
            <Icon name="checklist" className="h-8 w-8" strokeWidth={2.2} />
          </span>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-[15px] text-slate-500">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-[15px]">{footer}</div>}
      </div>
    </main>
  );
}
