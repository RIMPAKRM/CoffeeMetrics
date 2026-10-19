"use client";

import type { Summary } from "@app/shared";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDelta, formatInt, formatTengeCompact } from "@/lib/format";

function DeltaBadge({ pct }: { pct: number }) {
  const positive = pct >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        positive ? "bg-success-bg text-success" : "bg-red-100 text-red-700"
      }`}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {formatDelta(pct)}
    </span>
  );
}

function KpiCard({
  label,
  value,
  delta,
  footnote,
}: {
  label: string;
  value: string;
  delta: number;
  footnote: string;
}) {
  return (
    <Card className="flex flex-col gap-1.5 rounded-2xl border-border/70 p-4 shadow-[0_1px_3px_rgba(60,40,20,0.06)] sm:p-5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <DeltaBadge pct={delta} />
      </div>
      <div className="truncate text-[22px] leading-tight font-semibold tracking-tight text-coffee-950 sm:text-[28px]">
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{footnote}</div>
    </Card>
  );
}

export function KpiCards({
  summary,
  loading,
}: {
  summary?: Summary;
  loading: boolean;
}) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeletons
          <Card key={i} className="rounded-2xl border-border/70 p-4 sm:p-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-28" />
          </Card>
        ))}
      </div>
    );
  }

  const top = summary.topItem;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="Выручка"
        value={formatTengeCompact(summary.revenue)}
        delta={summary.revenueDeltaPct}
        footnote={`пред. период: ${formatTengeCompact(summary.prevRevenue)}`}
      />
      <KpiCard
        label="Заказы"
        value={formatInt(summary.orders)}
        delta={summary.ordersDeltaPct}
        footnote={`пред. период: ${formatInt(summary.prevOrders)}`}
      />
      <KpiCard
        label="Средний чек"
        value={formatTengeCompact(summary.avgCheck)}
        delta={summary.avgCheckDeltaPct}
        footnote={`пред. период: ${formatTengeCompact(summary.prevAvgCheck)}`}
      />
      <KpiCard
        label="Лучшая позиция"
        value={top?.name ?? "—"}
        delta={top?.deltaPct ?? 0}
        footnote={
          top
            ? `${formatInt(top.qty)} шт. · ${Math.round(top.sharePct)}% заказов`
            : "нет данных"
        }
      />
    </div>
  );
}
