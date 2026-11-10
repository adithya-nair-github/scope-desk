"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Home", primary: false },
  { href: "/gap-checker", label: "Gap checker", primary: true },
  { href: "/messy-to-clean", label: "Scorecard", primary: false },
  { href: "/procurement", label: "Buy moment", primary: false },
  { href: "/supplier-portal", label: "Supplier portal", primary: false },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("scope-desk-theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = saved || (prefersDark ? "dark" : "light");
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("scope-desk-theme", next);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-elev)_90%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              prefetch
              className="font-display text-lg font-semibold tracking-tight text-[var(--text)]"
            >
              Scope Desk
            </Link>
            <p className="mt-0.5 text-xs tracking-wide text-[var(--muted)]">
              Ditch Carbon × Adithya
              <span className="mx-1.5 opacity-35" aria-hidden>
                ·
              </span>
              Scope 3 onboarding for customer success
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="self-start rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)] sm:self-auto"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-3" aria-label="Primary">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const homeSpacing = item.href === "/" ? "mr-1 " : "";
            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={`${homeSpacing}whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`${homeSpacing}whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition ${
                  active
                    ? "font-medium text-[var(--text)] underline decoration-[var(--accent)] underline-offset-4"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
