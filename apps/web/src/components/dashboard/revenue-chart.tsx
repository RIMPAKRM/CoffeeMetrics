"use client";

import type { RevenuePoint, Summary } from "@app/shared";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDelta, formatShort, formatTenge } from "@/lib/format";

export function RevenueChart({
  points,
  summary,
  loading,
}: {
  points?: RevenuePoint[];
  summary?: Summary;
  loading: boolean;
}) {
  const max = Math.max(
    ...(points ?? []).map((p) => Math.max(p.current, p.previous)),
    0,
  );
  const step = max > 1_500_000 ? 500_000 : 250_000;
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = Array.from(
    { length: Math.floor(top / step) + 1 },
    (_, i) => i * step,
  );

  return (
    <Card className="rounded-2xl border-border/70 p-4 shadow-[0_1px_3px_rgba(60,40,20,0.06)] sm:p-5">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="text-[17px] font-semibold text-coffee-950">
            Выручка по дням
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {summary
              ? `Всего ${formatTenge(summary.revenue)} · ${formatDelta(summary.revenueDeltaPct)} к предыдущему периоду`
              : "Загрузка…"}
          </p>
        </div>
        <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full bg-brand" /> Текущий период
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-5 border-t-2 border-dashed border-coffee-400" />{" "}
            Прошлый период
          </span>
        </div>
      </div>

      <div className="mt-2 h-52 sm:h-64">
        {loading || !points ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8590c" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#e8590c" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#ece1cf" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval={Math.max(1, Math.ceil(points.length / 6))}
                tick={{ fontSize: 12, fill: "#8a7a66" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                ticks={ticks}
                tickFormatter={(v: number) => formatShort(v)}
                tick={{ fontSize: 12, fill: "#8a7a66" }}
                domain={[0, top]}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatTenge(Number(value ?? 0)),
                  name === "current" ? "Текущий период" : "Прошлый период",
                ]}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e8ddc9",
                  background: "#fffdf8",
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="previous"
                stroke="#a98a6d"
                strokeWidth={1.6}
                strokeDasharray="5 4"
                fill="none"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="#e8590c"
                strokeWidth={2.2}
                fill="url(#revFill)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
