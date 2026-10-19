"use client";

import { type LiveFeed, ORDER_STATUS_LABELS, type Order } from "@app/shared";
import { Check, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInt, formatTenge, formatTime } from "@/lib/format";

function itemsLabel(order: Order): string {
  return order.items
    .map((i) => (i.qty > 1 ? `${i.name} ×${i.qty}` : i.name))
    .join(", ");
}

function StatusBadge({ status }: { status: Order["status"] }) {
  if (status === "preparing") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-dark">
        <Clock className="size-3.5" /> {ORDER_STATUS_LABELS.preparing}
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="text-xs font-medium text-red-600">
        {ORDER_STATUS_LABELS.cancelled}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
      <Check className="size-3.5" /> {ORDER_STATUS_LABELS.served}
    </span>
  );
}

export function LiveOrders({
  feed,
  live,
  loading,
}: {
  feed?: LiveFeed;
  live: boolean;
  loading: boolean;
}) {
  return (
    <Card className="flex h-full flex-col rounded-2xl border-border/70 p-5 shadow-[0_1px_3px_rgba(60,40,20,0.06)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-coffee-950">
          Последние заказы
        </h2>
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand-dark">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
            </span>
            LIVE
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-sand/70 p-3">
          <p className="text-xs text-muted-foreground">Заказов сегодня</p>
          {loading || !feed ? (
            <Skeleton className="mt-1.5 h-6 w-12" />
          ) : (
            <p className="mt-0.5 text-xl font-semibold text-coffee-950">
              {formatInt(feed.today.ordersToday)}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-sand/70 p-3">
          <p className="text-xs text-muted-foreground">Выручка сегодня</p>
          {loading || !feed ? (
            <Skeleton className="mt-1.5 h-6 w-20" />
          ) : (
            <p className="mt-0.5 text-xl font-semibold text-coffee-950">
              {formatTenge(feed.today.revenueToday)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex-1">
        {loading || !feed ? (
          <div className="flex flex-col gap-2 pt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeletons
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : feed.orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Сегодня заказов пока нет
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {feed.orders.map((o) => (
              <li
                key={o.id}
                className={`rounded-xl px-3 py-2.5 ${o.status === "preparing" ? "bg-brand-soft" : ""}`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-coffee-950">
                    #{o.number}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatTime(o.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {itemsLabel(o)}
                </p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">
                    {o.locationName}
                  </span>
                  <span className="text-sm font-semibold text-coffee-950 tabular-nums">
                    {formatTenge(o.total)}
                  </span>
                </div>
                <div className="mt-1">
                  <StatusBadge status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        asChild
        variant="outline"
        className="mt-4 w-full rounded-xl border-border bg-sand/60"
      >
        <Link href="/orders">Все заказы</Link>
      </Button>
    </Card>
  );
}
