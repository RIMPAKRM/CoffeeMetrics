"use client";

import type { TopItem } from "@app/shared";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInt } from "@/lib/format";

export function TopItems({
  items,
  loading,
}: {
  items?: TopItem[];
  loading: boolean;
}) {
  const max = Math.max(...(items ?? []).map((i) => i.qty), 1);

  return (
    <Card className="rounded-2xl border-border/70 p-5 shadow-[0_1px_3px_rgba(60,40,20,0.06)]">
      <h2 className="text-[17px] font-semibold text-coffee-950">
        Топ-10 позиций
      </h2>
      <p className="mt-0.5 mb-4 text-sm text-muted-foreground">
        Продано, шт. · цвет — категория
      </p>

      {loading || !items ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeletons
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.rank} className="flex items-center gap-3 text-sm">
              <span className="w-4 text-right text-xs text-muted-foreground">
                {item.rank}
              </span>
              <span className="w-36 truncate text-coffee-950">{item.name}</span>
              <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.qty / max) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="w-12 text-right font-medium tabular-nums text-coffee-950">
                {formatInt(item.qty)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
