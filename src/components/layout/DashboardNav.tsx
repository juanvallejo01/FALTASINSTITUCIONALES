import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function DashboardNav({
  title,
  userName,
  links,
}: {
  title: string;
  userName: string;
  links: { href: string; label: string }[];
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <nav className="flex flex-wrap gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-600 hover:text-brand-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{userName}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
