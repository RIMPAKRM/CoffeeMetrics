"use client";

import type { Period } from "@app/shared";
import { useState } from "react";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import {
  LiveToggle,
  LocationSelect,
  PeriodSelector,
} from "@/components/dashboard/controls";
import { HourlyHeatmap } from "@/components/dashboard/hourly-heatmap";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { LiveOrders } from "@/components/dashboard/live-orders";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TopItems } from "@/components/dashboard/top-items";
import { formatRange } from "@/lib/format";
import {
  useCategories,
  useHourlyLoad,
  useLiveFeed,
  useLocations,
  useRevenueDaily,
  useSummary,
  useTopItems,
} from "@/lib/hooks";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>(90);
  const [locationId, setLocationId] = useState<number | undefined>(3);
  const [live, setLive] = useState(true);

  const params = { period, locationId };
  const locations = useLocations();
  const summary = useSummary(params);
  const revenue = useRevenueDaily(params);
  const topItems = useTopItems(params);
  const categories = useCategories(params);
  const hourly = useHourlyLoad(params);
  const feed = useLiveFeed(locationId, live);

  const locationName = locationId
    ? (locations.data?.find((l) => l.id === locationId)?.name ?? "—")
    : null;

  const subtitle = summary.data
    ? `${formatRange(summary.data.rangeStart, summary.data.rangeEnd)} · ${locationName ? `точка «${locationName}»` : "все точки"}`
    : "Загрузка данных…";

  return (
    <div className="p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-coffee-950">
            Дашборд
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />
          <LocationSelect value={locationId} onChange={setLocationId} />
          <LiveToggle live={live} onChange={setLive} />
        </div>
      </header>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="flex min-w-0 flex-col gap-6">
          <KpiCards summary={summary.data} loading={summary.isPending} />
          <RevenueChart
            points={revenue.data}
            summary={summary.data}
            loading={revenue.isPending}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <TopItems items={topItems.data} loading={topItems.isPending} />
            <CategoryDonut
              categories={categories.data}
              totalRevenue={summary.data?.revenue ?? 0}
              loading={categories.isPending}
            />
          </div>
          <HourlyHeatmap data={hourly.data} loading={hourly.isPending} />
        </div>
        <LiveOrders feed={feed.data} live={live} loading={feed.isPending} />
      </div>
    </div>
  );
}
