"use client";

import type { HourlyLoad } from "@app/shared";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY_FULL = [
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
  "воскресенье",
];

// Peach → burnt orange scale, indexed by intensity bucket
const HEAT = [
  "bg-[#f7efe2]",
  "bg-[#fbe4cd]",
  "bg-[#f6c9a0]",
  "bg-[#efa467]",
  "bg-[#e87f33]",
  "bg-[#e8590c]",
  "bg-[#b8430a]",
];

function bucket(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  const r = value / max;
  if (r < 0.15) return 1;
  if (r < 0.3) return 2;
  if (r < 0.45) return 3;
  if (r < 0.6) return 4;
  if (r < 0.8) return 5;
  return 6;
}

export function HourlyHeatmap({
  data,
  loading,
}: {
  data?: HourlyLoad;
  loading: boolean;
}) {
  const max = Math.max(...(data?.matrix ?? []).flat(), 0);
  const peak = data?.peak;

  return (
    <Card className="rounded-2xl border-border/70 p-5 shadow-[0_1px_3px_rgba(60,40,20,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-semibold text-coffee-950">
            Загрузка по часам
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Среднее число заказов в час, 7:00–23:00
          </p>
        </div>
        {peak && peak.value > 0 && (
          <span className="rounded-full bg-sand px-3 py-1.5 text-xs font-medium text-coffee-800">
            {DAY_FULL[peak.dayIdx]}, {String(peak.hour).padStart(2, "0")}:00–
            {String((peak.hour + 1) % 24).padStart(2, "0")}:00 · ≈{" "}
            {Math.round(peak.value)} заказов в час
          </span>
        )}
      </div>

      {loading || !data ? (
        <Skeleton className="mt-4 h-56 w-full rounded-xl" />
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div
            className="grid min-w-[640px] gap-1"
            style={{
              gridTemplateColumns: `28px repeat(${data.hours.length}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {data.hours.map((h) => (
              <div
                key={h}
                className="pb-1 text-center text-[10px] text-muted-foreground"
              >
                {String(h).padStart(2, "0")}
              </div>
            ))}
            {DAY_NAMES.map((day, d) => (
              <div key={day} className="contents">
                <div className="flex items-center text-[11px] text-muted-foreground">
                  {day}
                </div>
                {data.hours.map((h, hi) => {
                  const v = data.matrix[d]?.[hi] ?? 0;
                  return (
                    <div
                      key={h}
                      title={`${DAY_FULL[d]}, ${String(h).padStart(2, "0")}:00–${String((h + 1) % 24).padStart(2, "0")}:00 · ≈ ${v} заказов`}
                      className={`h-7 rounded-[6px] ${HEAT[bucket(v, max)]} ${
                        peak && d === peak.dayIdx && h === peak.hour
                          ? "ring-2 ring-coffee-800"
                          : ""
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
