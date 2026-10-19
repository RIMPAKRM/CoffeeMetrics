import { z } from "zod";

// ---------- Constants ----------

export const PERIODS = [7, 30, 90] as const;
export const periodSchema = z.coerce
  .number()
  .refine((v): v is (typeof PERIODS)[number] =>
    (PERIODS as readonly number[]).includes(v),
  );
export type Period = z.infer<typeof periodSchema>;

export const ORDER_STATUSES = ["preparing", "served", "cancelled"] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  preparing: "Готовится",
  served: "Выдан",
  cancelled: "Отменён",
};

export const CATEGORY_SLUGS = ["coffee", "tea", "bakery", "desserts"] as const;
export const categorySlugSchema = z.enum(CATEGORY_SLUGS);
export type CategorySlug = z.infer<typeof categorySlugSchema>;

export const CATEGORY_COLORS: Record<CategorySlug, string> = {
  coffee: "#e8590c",
  tea: "#0ca678",
  bakery: "#e8a20c",
  desserts: "#8c3b1b",
};

// ---------- Query schemas ----------

export const metricsQuerySchema = z.object({
  period: periodSchema.default(90),
  locationId: z.coerce.number().int().positive().optional(),
});
export type MetricsQuery = z.infer<typeof metricsQuerySchema>;

export const ordersQuerySchema = metricsQuerySchema.extend({
  status: orderStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(15),
  q: z.string().trim().max(50).optional(),
});
export type OrdersQuery = z.infer<typeof ordersQuerySchema>;

// ---------- Entities ----------

export interface Location {
  id: number;
  name: string;
  address: string;
  openUntil: string;
}

export interface Category {
  id: number;
  slug: CategorySlug;
  name: string;
  color: string;
}

export interface OrderItemEntry {
  id: number;
  name: string;
  qty: number;
  price: number;
  categorySlug: CategorySlug;
}

export interface Order {
  id: number;
  number: number;
  locationId: number;
  locationName: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderItemEntry[];
}

// ---------- API payloads ----------

export interface Summary {
  revenue: number;
  orders: number;
  avgCheck: number;
  revenueDeltaPct: number;
  ordersDeltaPct: number;
  avgCheckDeltaPct: number;
  prevRevenue: number;
  prevOrders: number;
  prevAvgCheck: number;
  topItem: {
    name: string;
    qty: number;
    sharePct: number;
    deltaPct: number;
  } | null;
  rangeStart: string;
  rangeEnd: string;
}

export interface RevenuePoint {
  date: string;
  label: string;
  current: number;
  previous: number;
}

export interface TopItem {
  rank: number;
  name: string;
  qty: number;
  categorySlug: CategorySlug;
  color: string;
}

export interface CategoryShare {
  slug: CategorySlug;
  name: string;
  color: string;
  revenue: number;
  sharePct: number;
}

export interface HourlyLoad {
  /** matrix[dayIdx][hourIdx]: dayIdx 0=Mon..6=Sun, hourIdx covers hours[0]..hours[last] */
  matrix: number[][];
  hours: number[];
  peak: { dayIdx: number; hour: number; value: number };
}

export interface TodayStats {
  ordersToday: number;
  revenueToday: number;
}

export interface LiveFeed {
  today: TodayStats;
  orders: Order[];
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MenuItemStat {
  id: number;
  name: string;
  categorySlug: CategorySlug;
  categoryName: string;
  color: string;
  price: number;
  isActive: boolean;
  qtySold: number;
  revenue: number;
  sharePct: number;
}

export interface LocationStat {
  location: Location;
  revenue: number;
  orders: number;
  avgCheck: number;
  revenueDeltaPct: number;
  sharePct: number;
  topItem: string | null;
}

// ---------- Response envelope ----------

export interface ApiSuccess<T> {
  data: T;
}
export interface ApiError {
  error: { message: string; code?: string };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
