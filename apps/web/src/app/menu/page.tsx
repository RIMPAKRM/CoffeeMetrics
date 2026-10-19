"use client";

import type { MenuItemStat, Period } from "@app/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PeriodSelector } from "@/components/dashboard/controls";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api, unwrap } from "@/lib/api";
import { formatInt, formatPct, formatTenge } from "@/lib/format";
import { useMenuStats } from "@/lib/hooks";

function groupByCategory(items: MenuItemStat[]) {
  const map = new Map<
    string,
    { name: string; color: string; items: MenuItemStat[] }
  >();
  for (const it of items) {
    const g = map.get(it.categorySlug) ?? {
      name: it.categoryName,
      color: it.color,
      items: [],
    };
    g.items.push(it);
    map.set(it.categorySlug, g);
  }
  return [...map.values()];
}

export default function MenuPage() {
  const [period, setPeriod] = useState<Period>(90);
  const stats = useMenuStats({ period });
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      unwrap(
        api.api.menu[":id"].$patch({
          param: { id: String(id) },
          json: { isActive },
        }),
      ),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: ["menu-stats"] });
      const snapshots = qc.getQueriesData<MenuItemStat[]>({
        queryKey: ["menu-stats"],
      });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        qc.setQueryData(
          key,
          data.map((it) => (it.id === id ? { ...it, isActive } : it)),
        );
      }
      return { snapshots };
    },
    onError: (err, _v, ctx) => {
      for (const [key, data] of ctx?.snapshots ?? [])
        qc.setQueryData(key, data);
      toast.error(
        err instanceof Error ? err.message : "Не удалось обновить позицию",
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["menu-stats"] }),
  });

  const groups = stats.data ? groupByCategory(stats.data) : [];
  const maxRevenue = Math.max(...(stats.data ?? []).map((i) => i.revenue), 1);

  return (
    <div className="p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-coffee-950">
            Меню
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.data
              ? `${stats.data.length} позиций · продажи за ${period} дней`
              : "Загрузка…"}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {stats.isPending
          ? Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeletons
              <Card key={i} className="rounded-2xl border-border/70 p-5">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-4 h-40 w-full" />
              </Card>
            ))
          : groups.map((g) => (
              <Card
                key={g.name}
                className="rounded-2xl border-border/70 p-5 shadow-[0_1px_3px_rgba(60,40,20,0.06)]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  <h2 className="text-[17px] font-semibold text-coffee-950">
                    {g.name}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {g.items.length} поз.
                  </span>
                </div>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {g.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`truncate text-sm font-medium ${
                              it.isActive
                                ? "text-coffee-950"
                                : "text-muted-foreground line-through"
                            }`}
                          >
                            {it.name}
                          </span>
                          <span className="text-sm font-semibold text-coffee-950 tabular-nums">
                            {formatTenge(it.price)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(it.revenue / maxRevenue) * 100}%`,
                                backgroundColor: g.color,
                              }}
                            />
                          </div>
                          <span className="w-28 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                            {formatInt(it.qtySold)} шт ·{" "}
                            {formatPct(it.sharePct)}
                          </span>
                          <Switch
                            checked={it.isActive}
                            onCheckedChange={(v) =>
                              toggle.mutate({ id: it.id, isActive: v })
                            }
                            aria-label={`${it.name} — в продаже`}
                            className="scale-90 data-[state=checked]:bg-brand"
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
      </div>
    </div>
  );
}
