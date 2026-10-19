import { type MenuItemStat, metricsQuerySchema } from "@app/shared";
import { zValidator } from "@hono/zod-validator";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { itemTotals } from "../lib/queries";
import { periodRanges } from "../lib/time";

export const menuRoutes = new Hono()

  .get("/stats", (c) => {
    const parsed = metricsQuerySchema.safeParse(c.req.query());
    if (!parsed.success)
      return c.json(
        { error: { message: "Invalid query", code: "BAD_QUERY" } },
        400,
      );
    const { period, locationId } = parsed.data;
    const r = periodRanges(period);

    const items = db.all<{
      id: number;
      name: string;
      slug: string;
      categoryName: string;
      color: string;
      price: number;
      isActive: number;
    }>(sql`
      SELECT mi.id, mi.name, c.slug, c.name AS categoryName, c.color, mi.price, mi.is_active AS isActive
      FROM menu_items mi JOIN categories c ON c.id = mi.category_id
      ORDER BY c.id, mi.id
    `);

    const totals = new Map(
      itemTotals({ start: r.start, end: r.end }, locationId).map((t) => [
        t.itemId,
        t,
      ]),
    );
    const grandTotal = [...totals.values()].reduce((s, t) => s + t.rev, 0);

    const data: MenuItemStat[] = items.map((it) => {
      const t = totals.get(it.id);
      return {
        id: it.id,
        name: it.name,
        categorySlug: it.slug as MenuItemStat["categorySlug"],
        categoryName: it.categoryName,
        color: it.color,
        price: it.price,
        isActive: it.isActive === 1,
        qtySold: t?.qty ?? 0,
        revenue: t?.rev ?? 0,
        sharePct: grandTotal && t ? (t.rev / grandTotal) * 100 : 0,
      };
    });
    return c.json({ data });
  })

  .patch(
    "/:id",
    zValidator("json", z.object({ isActive: z.boolean() })),
    (c) => {
      const id = Number(c.req.param("id"));
      if (!Number.isInteger(id) || id <= 0) {
        return c.json(
          { error: { message: "Invalid id", code: "BAD_ID" } },
          400,
        );
      }
      const { isActive } = c.req.valid("json");
      const res = db.run(
        sql`UPDATE menu_items SET is_active = ${isActive ? 1 : 0} WHERE id = ${id}`,
      );
      if (res.changes === 0)
        return c.json(
          { error: { message: "Not found", code: "NOT_FOUND" } },
          404,
        );
      return c.json({ data: { id, isActive } });
    },
  );
