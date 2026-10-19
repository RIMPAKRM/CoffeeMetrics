"use client";

import type {
  CategoryShare,
  HourlyLoad,
  LiveFeed,
  Location,
  LocationStat,
  MenuItemStat,
  OrderListResponse,
  OrdersQuery,
  RevenuePoint,
  Summary,
  TopItem,
} from "@app/shared";
import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "./api";

export interface MetricsParams {
  period: number;
  locationId?: number;
}

const locKey = (p: MetricsParams) => p.locationId ?? "all";

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => unwrap<Location[]>(api.api.locations.$get()),
    staleTime: Infinity,
  });
}

export function useSummary(p: MetricsParams) {
  return useQuery({
    queryKey: ["summary", p.period, locKey(p)],
    queryFn: () =>
      unwrap<Summary>(
        api.api.metrics.summary.$get({
          query: {
            period: String(p.period),
            locationId: p.locationId ? String(p.locationId) : undefined,
          },
        }),
      ),
  });
}

export function useRevenueDaily(p: MetricsParams) {
  return useQuery({
    queryKey: ["revenue-daily", p.period, locKey(p)],
    queryFn: () =>
      unwrap<RevenuePoint[]>(
        api.api.metrics["revenue-daily"].$get({
          query: {
            period: String(p.period),
            locationId: p.locationId ? String(p.locationId) : undefined,
          },
        }),
      ),
  });
}

export function useTopItems(p: MetricsParams) {
  return useQuery({
    queryKey: ["top-items", p.period, locKey(p)],
    queryFn: () =>
      unwrap<TopItem[]>(
        api.api.metrics["top-items"].$get({
          query: {
            period: String(p.period),
            locationId: p.locationId ? String(p.locationId) : undefined,
          },
        }),
      ),
  });
}

export function useCategories(p: MetricsParams) {
  return useQuery({
    queryKey: ["categories", p.period, locKey(p)],
    queryFn: () =>
      unwrap<CategoryShare[]>(
        api.api.metrics.categories.$get({
          query: {
            period: String(p.period),
            locationId: p.locationId ? String(p.locationId) : undefined,
          },
        }),
      ),
  });
}

export function useHourlyLoad(p: MetricsParams) {
  return useQuery({
    queryKey: ["hourly-load", p.period, locKey(p)],
    queryFn: () =>
      unwrap<HourlyLoad>(
        api.api.metrics["hourly-load"].$get({
          query: {
            period: String(p.period),
            locationId: p.locationId ? String(p.locationId) : undefined,
          },
        }),
      ),
  });
}

export function useLiveFeed(locationId: number | undefined, live: boolean) {
  return useQuery({
    queryKey: ["live", locationId ?? "all"],
    queryFn: () =>
      unwrap<LiveFeed>(
        api.api.orders.live.$get({
          query: {
            period: "90",
            locationId: locationId ? String(locationId) : undefined,
          },
        }),
      ),
    refetchInterval: live ? 10_000 : false,
  });
}

export function useOrders(q: Partial<OrdersQuery>) {
  return useQuery({
    queryKey: ["orders", q],
    queryFn: () =>
      unwrap<OrderListResponse>(
        api.api.orders.$get({
          query: {
            period: String(q.period ?? 90),
            locationId: q.locationId ? String(q.locationId) : undefined,
            status: q.status,
            page: String(q.page ?? 1),
            pageSize: String(q.pageSize ?? 15),
            q: q.q || undefined,
          },
        }),
      ),
    placeholderData: (prev) => prev,
  });
}

export function useMenuStats(p: MetricsParams) {
  return useQuery({
    queryKey: ["menu-stats", p.period, locKey(p)],
    queryFn: () =>
      unwrap<MenuItemStat[]>(
        api.api.menu.stats.$get({
          query: {
            period: String(p.period),
            locationId: p.locationId ? String(p.locationId) : undefined,
          },
        }),
      ),
  });
}

export function useLocationStats(period: number) {
  return useQuery({
    queryKey: ["location-stats", period],
    queryFn: () =>
      unwrap<LocationStat[]>(
        api.api.locations.stats.$get({ query: { period: String(period) } }),
      ),
  });
}
