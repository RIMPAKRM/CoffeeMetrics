import {
  type Location,
  type LocationStat,
  metricsQuerySchema,
} from "@app/shared";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { deltaPct, locCond, rangeTotals } from "../lib/queries";
import { periodRanges } from "../lib/time";

export const locationsRoutes = new Hono()

  .get("/", (c) => {
    const data = db.all<Location>(sql`
      SELECT id, name, address, open_until AS openUntil FROM locations ORDER BY id
    `);
    return c.json({ data });
  })

  .get("/stats", (c) => {
    const parsed = metricsQuerySchema.safeParse(c.req.query());
    if (!parsed.success)
      return c.json(
        { error: { message: "Invalid query", code: "BAD_QUERY" } },
        400,
      );
    const { period } = parsed.data;
    const r = periodRanges(period);

    const locations = db.all<Location>(sql`
      SELECT id, name, address, open_until AS openUntil FROM locations ORDER BY id
    `);

    const chain = rangeTotals({ start: r.start, end: r.end });
    const stats: LocationStat[] = locations.map((loc) => {
      const cur = rangeTotals({ start: r.start, end: r.end }, loc.id);
      const prev = rangeTotals({ start: r.prevStart, end: r.prevEnd }, loc.id);
      const top = db.get<{ name: string }>(sql`
        SELECT mi.name
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN menu_items mi ON mi.id = oi.menu_item_id
        WHERE o.status != 'cancelled' AND o.created_at >= ${r.start.getTime()} AND o.created_at <= ${r.end.getTime()}
          ${locCond(loc.id)}
        GROUP BY oi.menu_item_id ORDER BY SUM(oi.qty) DESC LIMIT 1
      `);
      return {
        location: loc,
        revenue: cur.rev,
        orders: cur.cnt,
        avgCheck: cur.cnt ? Math.round(cur.rev / cur.cnt) : 0,
        revenueDeltaPct: deltaPct(cur.rev, prev.rev),
        sharePct: chain.rev ? (cur.rev / chain.rev) * 100 : 0,
        topItem: top?.name ?? null,
      };
    });
    return c.json({ data: stats });
  });
