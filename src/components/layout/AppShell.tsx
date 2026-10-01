"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Icon } from "@/components/ui/Icon";
import type { NavLink, RoleNav } from "@/lib/navigation";

function initials(name: string): string {
  const words = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** La ruta raíz del rol solo está activa en coincidencia exacta; las demás también en sus subrutas. */
function isActive(pathname: string, href: string, rootHref: string): boolean {
  if (href === rootHref) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Estructura de la app por rol:
 * - Escritorio: barra superior translúcida con la sección activa resaltada.
 * - Celular: barra de pestañas inferior (como iOS) y hoja "Más" para el resto de secciones.
 */
export function AppShell({
  nav,
  userName,
  children,
}: {
  nav: RoleNav;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const rootHref = nav.links[0]!.href;

  const desktopLinks = nav.links.filter((l) => l.href !== nav.profileHref);
  const tabs = nav.links.filter((l) => l.tab);
  const overflow = nav.links.filter((l) => !l.tab);
  const overflowActive = overflow.some((l) => isActive(pathname, l.href, rootHref));
  const immersive = nav.immersive?.some((prefix) => pathname.startsWith(prefix)) ?? false;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-white/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6 xl:gap-6">
          <Link href={rootHref} className="flex shrink-0 items-center gap-2.5">
            <span className="app-icon flex h-8 w-8 items-center justify-center rounded-[9px] shadow-sm">
              <Icon name="checklist" className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </span>
            <span className="text-[15px] font-semibold text-slate-900">{nav.title}</span>
          </Link>

          <nav aria-label="Secciones" className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex">
            {desktopLinks.map((link) => {
              const active = isActive(pathname, link.href, rootHref);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[14px] font-medium transition ${
                    active ? "bg-slate-900/[0.06] text-slate-900" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href={nav.profileHref}
              className="flex items-center gap-2 rounded-full p-1 transition hover:bg-slate-100 xl:pr-3"
              title="Mi perfil"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[12px] font-semibold text-slate-700">
                {initials(userName)}
              </span>
              <span className="hidden max-w-[14rem] truncate text-[14px] text-slate-600 xl:inline">
                {userName}
              </span>
            </Link>
            <div className="hidden lg:block">
              <LogoutButton variant="icon" />
            </div>
          </div>
        </div>
        <div className="accent-line" aria-hidden="true" />
      </header>

      <main
        className={`mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8 ${
          immersive ? "pb-10" : "pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12"
        }`}
      >
        {children}
      </main>

      {!immersive && (
        <nav
          aria-label="Pestañas"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 lg:hidden"
        >
          <div className="mx-auto flex max-w-lg">
            {tabs.map((link) => (
              <TabItem key={link.href} link={link} active={isActive(pathname, link.href, rootHref)} />
            ))}
            {overflow.length > 0 && (
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-expanded={moreOpen}
                className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[10.5px] font-medium ${
                  overflowActive ? "text-brand-600" : "text-slate-500"
                }`}
              >
                <Icon name="more" className="h-6 w-6" />
                Más
              </button>
            )}
          </div>
        </nav>
      )}

      {moreOpen && (
        <MoreSheet links={overflow} pathname={pathname} rootHref={rootHref} onClose={() => setMoreOpen(false)} />
      )}
    </div>
  );
}

function TabItem({ link, active }: { link: NavLink; active: boolean }) {
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[10.5px] font-medium transition-colors ${
        active ? "text-brand-600" : "text-slate-500"
      }`}
    >
      <Icon name={link.icon} className="h-6 w-6" strokeWidth={active ? 2.2 : 1.8} />
      {link.label}
    </Link>
  );
}

function MoreSheet({
  links,
  pathname,
  rootHref,
  onClose,
}: {
  links: NavLink[];
  pathname: string;
  rootHref: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Más secciones">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/30"
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-lg animate-sheet-in rounded-t-3xl bg-canvas px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 shadow-float">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
        <div className="list-group">
          {links.map((link) => {
            const active = isActive(pathname, link.href, rootHref);
            return (
              <Link key={link.href} href={link.href} className="list-row" onClick={onClose}>
                <Icon name={link.icon} className={active ? "h-5 w-5 text-brand-600" : "h-5 w-5 text-slate-500"} />
                <span className={`flex-1 font-medium ${active ? "text-brand-600" : "text-slate-900"}`}>
                  {link.label}
                </span>
                <Icon name="chevron-right" className="h-4 w-4 text-slate-300" strokeWidth={2.2} />
              </Link>
            );
          })}
        </div>
        <div className="list-group mt-3">
          <LogoutButton variant="row" />
        </div>
      </div>
    </div>
  );
}
