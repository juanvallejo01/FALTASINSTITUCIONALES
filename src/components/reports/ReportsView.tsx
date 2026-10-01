import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";

export function ReportsView() {
  return (
    <div>
      <PageHeader title="Reportes" subtitle="Descarga la información de asistencia de tu institución" />
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Icon name="chart" className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <p className="text-[17px] font-semibold text-slate-900">Historial de asistencia</p>
          <p className="text-[14px] text-slate-500">
            Archivo CSV con los 5.000 registros más recientes. Se abre directamente en Excel.
          </p>
        </div>
        <a href="/api/reports/attendance" className="btn-primary" download>
          <Icon name="download" className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Descargar CSV
        </a>
      </div>
    </div>
  );
}
