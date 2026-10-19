"use client";

import {
  ClipboardList,
  Coffee,
  LayoutGrid,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Дашборд", icon: LayoutGrid },
  { href: "/orders", label: "Заказы", icon: ShoppingBag },
  { href: "/menu", label: "Меню", icon: ClipboardList },
  { href: "/locations", label: "Точки", icon: MapPin },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2.5 bg-sidebar px-4 text-white lg:hidden">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <Coffee
            className="size-4 text-sidebar-primary-foreground"
            strokeWidth={2.2}
          />
        </div>
        <span className="text-[16px] font-semibold tracking-tight">
          CoffeeMetrics
        </span>
      </header>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex bg-sidebar pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-white" : "text-sidebar-foreground/60"
              }`}
            >
              <Icon
                className={`size-5 ${active ? "text-brand" : ""}`}
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
