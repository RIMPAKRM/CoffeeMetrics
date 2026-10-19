"use client";

import type { CategoryShare } from "@app/shared";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPct, formatTengeCompact } from "@/lib/format";

export function CategoryDonut({
  categories,
  totalRevenue,
  loading,
}: {
  categories?: CategoryShare[];
  totalRevenue: number;
  loading: boolean;
}) {
  return (
    <Card className="rounded-2xl border-border/70 p-5 shadow-[0_1px_3px_rgba(60,40,20,0.06)]">
      <h2 className="text-[17px] font-semibold text-coffee-950">
        Доли категорий
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        По выручке за период
      </p>

      {loading || !categories ? (
        <Skeleton className="mx-auto mt-4 size-44 rounded-full" />
      ) : (
        <>
          <div className="relative mx-auto mt-2 h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="revenue"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={2}
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  {categories.map((c) => (
                    <Cell key={c.slug} fill={c.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-muted-foreground">Выручка</span>
              <span className="text-lg leading-tight font-semibold text-coffee-950">
                {formatTengeCompact(totalRevenue)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {categories.length} категории
              </span>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {categories.map((c) => (
              <li key={c.slug} className="flex items-center gap-2.5 text-sm">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-coffee-950">{c.name}</span>
                <span className="ml-auto text-muted-foreground tabular-nums">
                  {formatTengeCompact(c.revenue)}
                </span>
                <span className="w-10 text-right font-semibold tabular-nums text-coffee-950">
                  {formatPct(c.sharePct)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
