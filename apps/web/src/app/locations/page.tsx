"use client";

import type { Period } from "@app/shared";
import { Clock, MapPin, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { PeriodSelector } from "@/components/dashboard/controls";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDelta,
  formatInt,
  formatPct,
  formatTenge,
  formatTengeCompact,
} from "@/lib/format";
import { useLocationStats } from "@/lib/hooks";

export default function LocationsPage() {
  const [period, setPeriod] = useState<Period>(90);
  const stats = useLocationStats(period);
  const maxRevenue = Math.max(...(stats.data ?? []).map((s) => s.revenue), 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-coffee-950 sm:text-[28px]">
            Точки
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Сравнение кофеен сети за {period} дней
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </header>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {stats.isPending
          ? Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeletons
              <Card key={i} className="rounded-2xl border-border/70 p-5">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="mt-2 h-4 w-40" />
                <Skeleton className="mt-5 h-24 w-full" />
              </Card>
            ))
          : stats.data?.map((s) => {
              const positive = s.revenueDeltaPct >= 0;
              const Icon = positive ? TrendingUp : TrendingDown;
              return (
                <Card
                  key={s.location.id}
                  className="rounded-2xl border-border/70 p-5 shadow-[0_1px_3px_rgba(60,40,20,0.06)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="flex items-center gap-1.5 text-[17px] font-semibold text-coffee-950">
                        <MapPin className="size-4 text-brand" />{" "}
                        {s.location.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.location.address}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs text-coffee-800">
                      <Clock className="size-3" /> до {s.location.openUntil}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">
                        Выручка
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          positive ? "text-success" : "text-red-600"
                        }`}
                      >
                        <Icon className="size-3" />{" "}
                        {formatDelta(s.revenueDeltaPct)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[26px] font-semibold tracking-tight text-coffee-950">
                      {formatTengeCompact(s.revenue)}
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${(s.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-muted-foreground">
                      {formatPct(s.sharePct)} выручки сети
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Заказы</p>
                      <p className="text-lg font-semibold text-coffee-950 tabular-nums">
                        {formatInt(s.orders)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Средний чек
                      </p>
                      <p className="text-lg font-semibold text-coffee-950 tabular-nums">
                        {formatTenge(s.avgCheck)}
                      </p>
                    </div>
                  </div>

                  {s.topItem && (
                    <p className="mt-3 rounded-xl bg-sand/60 px-3 py-2 text-xs text-coffee-800">
                      Топ позиция:{" "}
                      <span className="font-semibold">{s.topItem}</span>
                    </p>
                  )}
                </Card>
              );
            })}
      </div>
    </div>
  );
}
