import { Icon, type IconName } from "./Icon";

/** Estado vacío: explica qué pasa y, si aplica, qué hacer a continuación. */
export function EmptyState({
  icon = "check",
  title,
  description,
  tone = "neutral",
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  tone?: "neutral" | "success";
  action?: React.ReactNode;
}) {
  const iconClass = tone === "success" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400";
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <span className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${iconClass}`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="text-[17px] font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[15px] text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
