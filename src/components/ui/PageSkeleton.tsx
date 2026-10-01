/** Esqueleto de carga: se muestra al instante mientras la página consulta los datos. */
export function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Cargando">
      <div className="mb-2 h-8 w-56 rounded-lg bg-slate-200/80" />
      <div className="mb-8 h-4 w-40 rounded bg-slate-200/60" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card h-[104px]" />
        ))}
      </div>
      <div className="list-group">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="list-row">
            <div className="h-4 flex-1 rounded bg-slate-100" />
            <div className="h-4 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
