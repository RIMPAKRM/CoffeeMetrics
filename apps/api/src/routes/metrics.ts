import {
  type CategoryShare,
  type HourlyLoad,
  metricsQuerySchema,
  type RevenuePoint,
  type Summary,
  type TopItem,
} from "@app/shared";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import {
  categoryTotals,
  dailyRevenue,
  deltaPct,
  locCond,
  rangeTotals,
} from "../lib/queries";
import {
  addDays,
  localDate,
  periodRanges,
  startOfDay,
  weekdayCounts,
} from "../lib/time";

export const metricsRoutes = new Hono()

  .get("/summary", (c) => {
    const parsed = metricsQuerySchema.safeParse(c.req.query());
    if (!parsed.success)
      return c.json(
        { error: { message: "Invalid query", code: "BAD_QUERY" } },
        400,
      );
    const { period, locationId } = parsed.data;
    const r = periodRanges(period);

    const cur = rangeTotals({ start: r.start, end: r.end }, locationId);
    const prev = rangeTotals(
      { start: r.prevStart, end: r.prevEnd },
      locationId,
    );
    const avgCheck = cur.cnt ? Math.round(cur.rev / cur.cnt) : 0;
    const prevAvgCheck = prev.cnt ? Math.round(prev.rev / prev.cnt) : 0;

    const topRows = db.all<{ name: string; qty: number }>(sql`
      SELECT mi.name, SUM(oi.qty) AS qty
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.status != 'cancelled' AND o.created_at >= ${r.start.getTime()} AND o.created_at <= ${r.end.getTime()}
      ${locCond(locationId)}
      GROUP BY oi.menu_item_id ORDER BY qty DESC LIMIT 1
    `);
    const totalQtyRow = db.get<{ qty: number }>(sql`
      SELECT COALESCE(SUM(oi.qty), 0) AS qty
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled' AND o.created_at >= ${r.start.getTime()} AND o.created_at <= ${r.end.getTime()}
      ${locCond(locationId)}
    `);

    let topItem: Summary["topItem"] = null;
    const top = topRows[0];
    if (top) {
      const prevQty = db.get<{ qty: number }>(sql`
        SELECT COALESCE(SUM(oi.qty), 0) AS qty
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN menu_items mi ON mi.id = oi.menu_item_id
        WHERE o.status != 'cancelled' AND o.created_at >= ${r.prevStart.getTime()} AND o.created_at <= ${r.prevEnd.getTime()}
          AND mi.name = ${top.name} ${locCond(locationId)}
      `);
      const totalQty = totalQtyRow?.qty ?? 0;
      topItem = {
        name: top.name,
        qty: top.qty,
        sharePct: totalQty ? (top.qty / totalQty) * 100 : 0,
        deltaPct: deltaPct(top.qty, prevQty?.qty ?? 0),
      };
    }

    const data: Summary = {
      revenue: cur.rev,
      orders: cur.cnt,
      avgCheck,
      revenueDeltaPct: deltaPct(cur.rev, prev.rev),
      ordersDeltaPct: deltaPct(cur.cnt, prev.cnt),
      avgCheckDeltaPct: deltaPct(avgCheck, prevAvgCheck),
      prevRevenue: prev.rev,
      prevOrders: prev.cnt,
      prevAvgCheck,
      topItem,
      rangeStart: localDate(r.start),
      rangeEnd: localDate(r.end),
    };
    return c.json({ data });
  })

  .get("/revenue-daily", (c) => {
    const parsed = metricsQuerySchema.safeParse(c.req.query());
    if (!parsed.success)
      return c.json(
        { error: { message: "Invalid query", code: "BAD_QUERY" } },
        400,
      );
    const { period, locationId } = parsed.data;
    const r = periodRanges(period);

    const curMap = dailyRevenue({ start: r.start, end: r.end }, locationId);
    const prevMap = dailyRevenue(
      { start: r.prevStart, end: r.prevEnd },
      locationId,
    );

    const data: RevenuePoint[] = [];
    for (let i = 0; i < period; i++) {
      const day = addDays(startOfDay(r.start), i);
      const prevDay = addDays(startOfDay(r.prevStart), i);
      data.push({
        date: localDate(day),
        label: day.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
        }),
        current: curMap.get(localDate(day)) ?? 0,
        previous: prevMap.get(localDate(prevDay)) ?? 0,
      });
    }
    return c.json({ data });
  })

  .get("/top-items", (c) => {
    const parsed = metricsQuerySchema.safeParse(c.req.query());
    if (!parsed.success)
      return c.json(
        { error: { message: "Invalid query", code: "BAD_QUERY" } },
        400,
      );
    const { period, locationId } = parsed.data;
    const r = periodRanges(period);

    const rows = db.all<{
      name: string;
      qty: number;
      slug: string;
      color: string;
    }>(sql`
      SELECT mi.name, SUM(oi.qty) AS qty, c.slug, c.color
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      JOIN categories c ON c.id = mi.category_id
      WHERE o.status != 'cancelled' AND o.created_at >= ${r.start.getTime()} AND o.created_at <= ${r.end.getTime()}
      ${locCond(locationId)}
      GROUP BY oi.menu_item_id ORDER BY qty DESC LIMIT 10
    `);
    const data: TopItem[] = rows.map((row, i) => ({
      rank: i + 1,
      name: row.name,
      qty: row.qty,
      categorySlug: row.slug as TopItem["categorySlug"],
      color: row.color,
    }));
    return c.json({ data });
  })

  .get("/categories", (c) => {
    const parsed = metricsQuerySchema.safeParse(c.req.query());
    if (!parsed.success)
      return c.json(
        { error: { message: "Invalid query", code: "BAD_QUERY" } },
        400,
      );
    const { period, locationId } = parsed.data;
    const r = periodRanges(period);

    const rows = categoryTotals({ start: r.start, end: r.end }, locationId);
    const total = rows.reduce((s, row) => s + row.rev, 0);
    const data: CategoryShare[] = rows.map((row) => ({
      slug: row.slug as CategoryShare["slug"],
      name: row.name,
      color: row.color,
      revenue: row.rev,
      sharePct: total ? (row.rev / total) * 100 : 0,
    }));
    return c.json({ data });
  })

  .get("/hourly-load", (c) => {
    const parsed = metricsQuerySchema.safeParse(c.req.query());
    if (!parsed.success)
      return c.json(
        { error: { message: "Invalid query", code: "BAD_QUERY" } },
        400,
      );
    const { period, locationId } = parsed.data;
    const r = periodRanges(period);

    const rows = db.all<{ w: number; h: number; c: number }>(sql`
      SELECT CAST(strftime('%w', o.created_at / 1000, 'unixepoch', 'localtime') AS INTEGER) AS w,
             CAST(strftime('%H', o.created_at / 1000, 'unixepoch', 'localtime') AS INTEGER) AS h,
             COUNT(*) AS c
      FROM orders o
      WHERE o.status != 'cancelled' AND o.created_at >= ${r.start.getTime()} AND o.created_at <= ${r.end.getTime()}
      ${locCond(locationId)}
      GROUP BY w, h
    `);

    const hours = Array.from({ length: 16 }, (_, i) => i + 7);
    const days = weekdayCounts(r.start, r.end);
    const matrix: number[][] = Array.from({ length: 7 }, () =>
      Array(hours.length).fill(0),
    );
    for (const row of rows) {
      const dayIdx = (row.w + 6) % 7; // sqlite %w: 0=Sun → our 0=Mon
      const hIdx = row.h - 7;
      if (hIdx < 0 || hIdx >= hours.length || days[dayIdx] === 0) continue;
      matrix[dayIdx][hIdx] = Math.round((row.c / days[dayIdx]) * 10) / 10;
    }
    const data: HourlyLoad = {
      matrix,
      hours,
      peak: { dayIdx: 0, hour: 0, value: 0 },
    };
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < hours.length; h++) {
        if (matrix[d][h] > data.peak.value) {
          data.peak = { dayIdx: d, hour: hours[h], value: matrix[d][h] };
        }
      }
    }
    return c.json({ data });
  });
