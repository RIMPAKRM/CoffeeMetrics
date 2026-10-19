import {
  type LiveFeed,
  metricsQuerySchema,
  type Order,
  type OrderItemEntry,
  type OrderListResponse,
  ordersQuerySchema,
  type TodayStats,
} from "@app/shared";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { locCond } from "../lib/queries";
import { periodRanges, startOfDay } from "../lib/time";

interface OrderRow {
  id: number;
  number: number;
  location_id: number;
  location_name: string;
  status: string;
  total: number;
  created_at: number;
}

interface ItemRow {
  order_id: number;
  item_id: number;
  name: string;
  slug: string;
  qty: number;
  price: number;
}

function attachItems(rows: OrderRow[]): Order[] {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const items = db.all<ItemRow>(sql`
    SELECT oi.order_id, oi.menu_item_id AS item_id, mi.name, c.slug, oi.qty, oi.price
    FROM order_items oi
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    JOIN categories c ON c.id = mi.category_id
    WHERE oi.order_id IN (${sql.join(
      ids.map((id) => sql`${id}`),
      sql`,`,
    )})
    ORDER BY oi.id
  `);
  const byOrder = new Map<number, OrderItemEntry[]>();
  for (const it of items) {
    const list = byOrder.get(it.order_id) ?? [];
    list.push({
      id: it.item_id,
      name: it.name,
      qty: it.qty,
      price: it.price,
      categorySlug: it.slug as OrderItemEntry["categorySlug"],
    });
    byOrder.set(it.order_id, list);
  }
  return rows.map((r) => ({
    id: r.id,
    number: r.number,
    locationId: r.location_id,
    locationName: r.location_name,
    status: r.status as Order["status"],
    total: r.total,
    createdAt: new Date(r.created_at).toISOString(),
    items: byOrder.get(r.id) ?? [],
  }));
}

export const ordersRoutes = new Hono()

  .get("/", (c) => {
    const parsed = ordersQuerySchema.safeParse(c.req.query());
    if (!parsed.success)
      return c.json(
        { error: { message: "Invalid query", code: "BAD_QUERY" } },
        400,
      );
    const { period, locationId, status, page, pageSize, q } = parsed.data;
    const r = periodRanges(period);

    const statusCond = status ? sql` AND o.status = ${status}` : sql``;
    const qCond = q
      ? sql` AND CAST(o.number AS TEXT) LIKE ${"%" + q + "%"}`
      : sql``;
    const where = sql`
      WHERE o.created_at >= ${r.start.getTime()} AND o.created_at <= ${r.end.getTime()}
      ${locCond(locationId)} ${statusCond} ${qCond}`;

    const total =
      db.get<{ c: number }>(sql`SELECT COUNT(*) AS c FROM orders o ${where}`)
        ?.c ?? 0;
    const rows = db.all<OrderRow>(sql`
      SELECT o.id, o.number, o.location_id, l.name AS location_name, o.status, o.total, o.created_at
      FROM orders o JOIN locations l ON l.id = o.location_id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `);

    const data: OrderListResponse = {
      items: attachItems(rows),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
    return c.json({ data });
  })

  .get("/live", (c) => {
    const parsed = metricsQuerySchema.safeParse(c.req.query());
    if (!parsed.success)
      return c.json(
        { error: { message: "Invalid query", code: "BAD_QUERY" } },
        400,
      );
    const { locationId } = parsed.data;

    const today = startOfDay(new Date());
    const now = new Date();

    const todayRow = db.get<{ rev: number; cnt: number }>(sql`
      SELECT COALESCE(SUM(o.total), 0) AS rev, COUNT(*) AS cnt
      FROM orders o
      WHERE o.status != 'cancelled' AND o.created_at >= ${today.getTime()} AND o.created_at <= ${now.getTime()}
      ${locCond(locationId)}
    `);

    const rows = db.all<OrderRow>(sql`
      SELECT o.id, o.number, o.location_id, l.name AS location_name, o.status, o.total, o.created_at
      FROM orders o JOIN locations l ON l.id = o.location_id
      WHERE o.created_at >= ${today.getTime()} ${locCond(locationId)}
      ORDER BY o.created_at DESC
      LIMIT 9
    `);

    const todayStats: TodayStats = {
      ordersToday: todayRow?.cnt ?? 0,
      revenueToday: todayRow?.rev ?? 0,
    };
    const data: LiveFeed = { today: todayStats, orders: attachItems(rows) };
    return c.json({ data });
  });
