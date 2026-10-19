import { sql } from "drizzle-orm";
import { db } from "../db";
import { logger } from "./logger";

interface SimItem {
  id: number;
  price: number;
  w: number;
}

/** Creates a plausible "preparing" order every ~25–50s so the Live feed moves. */
export function startOrderSimulator(): () => void {
  let timer: NodeJS.Timeout | null = null;

  const tick = () => {
    try {
      const items = db.all<SimItem>(sql`
        SELECT id, price, popularity AS w FROM menu_items WHERE is_active = 1
      `);
      const locations = db.all<{ id: number; w: number }>(sql`
        SELECT l.id,
               (SELECT COUNT(*) FROM orders o WHERE o.location_id = l.id) AS w
        FROM locations l
      `);
      if (items.length === 0 || locations.length === 0) return;

      const pickWeighted = <T extends { w: number }>(arr: T[]): T => {
        const total = arr.reduce((s, i) => s + i.w, 0);
        let r = Math.random() * total;
        for (const i of arr) {
          r -= i.w;
          if (r <= 0) return i;
        }
        return arr[arr.length - 1];
      };

      const location = pickWeighted(locations);
      const nLines = 1 + Math.floor(Math.random() * 3);
      const chosen = new Map<number, number>();
      for (let i = 0; i < nLines; i++) {
        const it = pickWeighted(items);
        chosen.set(
          it.id,
          (chosen.get(it.id) ?? 0) + (Math.random() < 0.85 ? 1 : 2),
        );
      }
      let total = 0;
      for (const [itemId, qty] of chosen) {
        total += (items.find((i) => i.id === itemId)?.price ?? 0) * qty;
      }

      const nextNumber =
        db.get<{ n: number }>(
          sql`SELECT COALESCE(MAX(number), 0) + 1 AS n FROM orders WHERE location_id = ${location.id}`,
        )?.n ?? 1;
      const now = Date.now();
      const result = db.run(sql`
        INSERT INTO orders (number, location_id, status, total, created_at)
        VALUES (${nextNumber}, ${location.id}, 'preparing', ${total}, ${now})
      `);
      const orderId = Number(result.lastInsertRowid);
      for (const [itemId, qty] of chosen) {
        const price = items.find((i) => i.id === itemId)?.price ?? 0;
        db.run(
          sql`INSERT INTO order_items (order_id, menu_item_id, qty, price) VALUES (${orderId}, ${itemId}, ${qty}, ${price})`,
        );
      }
      logger.debug({ orderId, number: nextNumber, total }, "simulated order");
    } catch (err) {
      logger.error({ err }, "order simulator failed");
    } finally {
      timer = setTimeout(tick, 25_000 + Math.random() * 25_000);
    }
  };

  timer = setTimeout(tick, 15_000);
  return () => {
    if (timer) clearTimeout(timer);
  };
}
