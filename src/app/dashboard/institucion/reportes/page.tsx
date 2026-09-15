import { requirePageRole } from "@/lib/rbac";

export default async function ReportesInstitucionPage() {
  await requirePageRole("ADMIN_INSTITUCIONAL");
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Reportes</h1>
      <div className="card space-y-3 p-4">
        <p className="text-sm text-slate-600">
          Exporta el historial de asistencia de tu institución (hasta los 5,000 registros
          más recientes) en formato CSV, listo para abrir en Excel.
        </p>
        <a href="/api/reports/attendance" className="btn-primary inline-block">
          Descargar CSV de asistencia
        </a>
      </div>
    </div>
  );
}
