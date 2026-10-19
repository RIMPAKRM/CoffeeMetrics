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
import { useLocations } from "@/lib/hooks";

const NAV = [
  { href: "/", label: "Дашборд", icon: LayoutGrid },
  { href: "/orders", label: "Заказы", icon: ShoppingBag },
  { href: "/menu", label: "Меню", icon: ClipboardList },
  { href: "/locations", label: "Точки", icon: MapPin },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: locations } = useLocations();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-8">
        <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary">
          <Coffee
            className="size-5 text-sidebar-primary-foreground"
            strokeWidth={2.2}
          />
        </div>
        <span className="text-[17px] font-semibold tracking-tight text-white">
          CoffeeMetrics
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="size-[18px]" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 mt-auto mb-5 rounded-xl bg-sidebar-accent/50 p-4">
        <p className="mb-3 text-xs font-medium tracking-wide text-sidebar-foreground/60 uppercase">
          Точки сети
        </p>
        <ul className="flex flex-col gap-2.5">
          {(locations ?? []).map((loc) => (
            <li
              key={loc.id}
              className="flex items-baseline justify-between text-sm"
            >
              <span className="text-sidebar-foreground">{loc.name}</span>
              <span className="text-xs text-sidebar-foreground/60">
                до {loc.openUntil}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
