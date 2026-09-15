export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const toneClass = {
    default: "text-slate-900",
    danger: "text-red-600",
    warning: "text-amber-600",
    success: "text-emerald-600",
  }[tone];

  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
