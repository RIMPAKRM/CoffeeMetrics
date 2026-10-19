import { sql } from "drizzle-orm";
import { db } from "../db";

export function locCond(locationId: number | undefined, alias = "o") {
  return locationId
    ? sql` AND ${sql.raw(alias)}.location_id = ${locationId}`
    : sql``;
}

/** Revenue+count for a range. Excludes cancelled orders. */
export function rangeTotals(
  range: { start: Date; end: Date },
  locationId?: number,
) {
  return (
    db.get<{ rev: number; cnt: number }>(sql`
    SELECT COALESCE(SUM(o.total), 0) AS rev, COUNT(*) AS cnt
    FROM orders o
    WHERE o.status != 'cancelled'
      AND o.created_at >= ${range.start.getTime()}
      AND o.created_at <= ${range.end.getTime()}
      ${locCond(locationId)}
  `) ?? { rev: 0, cnt: 0 }
  );
}

export function itemTotals(
  range: { start: Date; end: Date },
  locationId?: number,
) {
  return db.all<{ itemId: number; qty: number; rev: number }>(sql`
    SELECT oi.menu_item_id AS itemId, SUM(oi.qty) AS qty, SUM(oi.qty * oi.price) AS rev
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'cancelled'
      AND o.created_at >= ${range.start.getTime()}
      AND o.created_at <= ${range.end.getTime()}
      ${locCond(locationId)}
    GROUP BY oi.menu_item_id
  `);
}

export function categoryTotals(
  range: { start: Date; end: Date },
  locationId?: number,
) {
  return db.all<{ slug: string; name: string; color: string; rev: number }>(sql`
    SELECT c.slug, c.name, c.color, SUM(oi.qty * oi.price) AS rev
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    JOIN categories c ON c.id = mi.category_id
    WHERE o.status != 'cancelled'
      AND o.created_at >= ${range.start.getTime()}
      AND o.created_at <= ${range.end.getTime()}
      ${locCond(locationId)}
    GROUP BY c.id
    ORDER BY rev DESC
  `);
}

export function dailyRevenue(
  range: { start: Date; end: Date },
  locationId?: number,
) {
  const rows = db.all<{ d: string; rev: number }>(sql`
    SELECT date(o.created_at / 1000, 'unixepoch', 'localtime') AS d, SUM(o.total) AS rev
    FROM orders o
    WHERE o.status != 'cancelled'
      AND o.created_at >= ${range.start.getTime()}
      AND o.created_at <= ${range.end.getTime()}
      ${locCond(locationId)}
    GROUP BY d
  `);
  return new Map(rows.map((r) => [r.d, r.rev]));
}

export function deltaPct(cur: number, prev: number): number {
  if (prev <= 0) return 0;
  return ((cur - prev) / prev) * 100;
}
