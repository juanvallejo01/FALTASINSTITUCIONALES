import Link from "next/link";
import { Icon } from "./Icon";

/** Paginación compacta: Anterior · Página X de Y · Siguiente. */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const prev = page > 1 ? hrefFor(page - 1) : null;
  const next = page < totalPages ? hrefFor(page + 1) : null;
  const disabled = "pointer-events-none opacity-40";

  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-between gap-3">
      <Link href={prev ?? "#"} aria-disabled={!prev} className={`btn-plain ${prev ? "" : disabled}`}>
        <Icon name="chevron-left" className="h-4 w-4" strokeWidth={2.2} />
        Anterior
      </Link>
      <span className="text-[13px] text-slate-500">
        Página {page} de {totalPages}
      </span>
      <Link href={next ?? "#"} aria-disabled={!next} className={`btn-plain ${next ? "" : disabled}`}>
        Siguiente
        <Icon name="chevron-right" className="h-4 w-4" strokeWidth={2.2} />
      </Link>
    </nav>
  );
}
