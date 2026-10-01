import Link from "next/link";
import { Icon } from "./Icon";

export type AttentionItem = {
  text: string;
  detail?: string;
  href?: string;
  tone: "warning" | "danger";
};

/**
 * "Requiere tu atención": lo primero que ve el usuario al entrar. Si no hay nada
 * pendiente, lo dice claramente en vez de dejar que lo deduzca de los números.
 */
export function AttentionList({ items, allClearText }: { items: AttentionItem[]; allClearText: string }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 text-emerald-800">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Icon name="check" className="h-[18px] w-[18px]" strokeWidth={2.6} />
        </span>
        <p className="font-medium">{allClearText}</p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="section-title">Requiere tu atención</h2>
      <ul className="list-group">
        {items.map((item) => {
          const dot = item.tone === "danger" ? "bg-red-500" : "bg-amber-500";
          const content = (
            <>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{item.text}</p>
                {item.detail && <p className="text-[13px] text-slate-500">{item.detail}</p>}
              </div>
              {item.href && <Icon name="chevron-right" className="h-4 w-4 text-slate-300" strokeWidth={2.2} />}
            </>
          );
          return (
            <li key={item.text}>
              {item.href ? (
                <Link href={item.href} className="list-row">
                  {content}
                </Link>
              ) : (
                <div className="list-row">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
