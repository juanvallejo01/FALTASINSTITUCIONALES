import Link from "next/link";

/**
 * Control segmentado basado en enlaces (filtros que cambian la URL).
 * En pantallas pequeñas se desplaza horizontalmente en lugar de partirse en varias líneas.
 */
export function SegmentedLinks({
  items,
  label,
}: {
  items: { href: string; label: string; active: boolean; count?: number }[];
  label: string;
}) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="segmented">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className="segmented-item"
          >
            {item.label}
            {item.count !== undefined && (
              <span className="text-[12px] tabular-nums text-slate-400">{item.count}</span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
