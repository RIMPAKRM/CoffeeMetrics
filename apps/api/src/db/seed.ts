import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORY_COLORS } from "@app/shared";
import { addDays, startOfDay } from "../lib/time";
import { sqlite } from "./index";

// ---------- deterministic PRNG ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261019);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

function weighted<T>(items: T[], weight: (t: T) => number): T {
  const total = items.reduce((s, i) => s + weight(i), 0);
  let r = rand() * total;
  for (const i of items) {
    r -= weight(i);
    if (r <= 0) return i;
  }
  return items[items.length - 1];
}

// ---------- reference data ----------

const LOCATIONS = [
  {
    name: "Центр",
    address: "ул. Абая, 12",
    openUntil: "22:00",
    basePerDay: 150,
  },
  {
    name: "Университет",
    address: "ул. Казыбек би, 15",
    openUntil: "22:00",
    basePerDay: 112,
  },
  {
    name: "Набережная",
    address: "наб. Ишим, 7",
    openUntil: "22:00",
    basePerDay: 205,
  },
];

const CATEGORIES = [
  { slug: "coffee", name: "Кофе" },
  { slug: "tea", name: "Чай" },
  { slug: "bakery", name: "Выпечка" },
  { slug: "desserts", name: "Десерты" },
] as const;

const MENU: {
  name: string;
  cat: (typeof CATEGORIES)[number]["slug"];
  price: number;
  w: number;
}[] = [
  { name: "Капучино", cat: "coffee", price: 1500, w: 100 },
  { name: "Латте", cat: "coffee", price: 1500, w: 84 },
  { name: "Американо", cat: "coffee", price: 1200, w: 64 },
  { name: "Флэт уайт", cat: "coffee", price: 1700, w: 43 },
  { name: "Раф ванильный", cat: "coffee", price: 1800, w: 33 },
  { name: "Мокко", cat: "coffee", price: 1700, w: 12 },
  { name: "Эспрессо", cat: "coffee", price: 900, w: 8 },
  { name: "Раф солёная карамель", cat: "coffee", price: 1800, w: 8 },
  { name: "Матча латте", cat: "tea", price: 1600, w: 32 },
  { name: "Облепиховый чай", cat: "tea", price: 1300, w: 31 },
  { name: "Чай чёрный", cat: "tea", price: 800, w: 15 },
  { name: "Чай зелёный", cat: "tea", price: 800, w: 12 },
  { name: "Круассан", cat: "bakery", price: 1100, w: 57 },
  { name: "Синнабон", cat: "bakery", price: 1400, w: 33 },
  { name: "Булочка с маком", cat: "bakery", price: 800, w: 9 },
  { name: "Чизкейк", cat: "desserts", price: 1900, w: 38 },
  { name: "Тирамису", cat: "desserts", price: 2100, w: 22 },
  { name: "Брауни", cat: "desserts", price: 1300, w: 18 },
  { name: "Медовик", cat: "desserts", price: 1600, w: 11 },
];

// Mon..Sun multiplier — weekends are noticeably busier
const WEEKDAY_FACTOR = [0.92, 0.9, 0.95, 1.0, 1.18, 1.62, 1.5];

// hourly weights 7..22, weekday / weekend
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);
const HOUR_WEEKDAY = [
  9, 16, 18, 14, 12, 13, 15, 14, 13, 13, 14, 13, 11, 8, 5, 3,
];
const HOUR_WEEKEND = [
  4, 7, 10, 13, 15, 16, 16, 15, 15, 14, 13, 13, 11, 9, 6, 4,
];

const DAYS_BACK = 185; // covers 90-day window + previous 90-day comparison

export function seedIfEmpty(log: (msg: string) => void): void {
  const row = sqlite.prepare("SELECT COUNT(*) AS c FROM orders").get() as {
    c: number;
  };
  if (row.c > 0) return;
  seed(log);
}

export function seed(log: (msg: string) => void = console.log): void {
  const started = Date.now();
  log("Seeding database…");

  const now = new Date();
  const today = startOfDay(now);
  const firstDay = addDays(today, -DAYS_BACK);

  sqlite.exec("BEGIN");
  try {
    sqlite.exec(
      "DELETE FROM order_items; DELETE FROM orders; DELETE FROM menu_items; DELETE FROM categories; DELETE FROM locations;",
    );
    sqlite.exec(
      "DELETE FROM sqlite_sequence WHERE name IN ('orders','order_items','menu_items','categories','locations');",
    );

    const insLoc = sqlite.prepare(
      "INSERT INTO locations (name, address, open_until) VALUES (?, ?, ?)",
    );
    const locIds = LOCATIONS.map((l) =>
      Number(insLoc.run(l.name, l.address, l.openUntil).lastInsertRowid),
    );

    const insCat = sqlite.prepare(
      "INSERT INTO categories (slug, name, color) VALUES (?, ?, ?)",
    );
    const catIds = new Map<string, number>();
    for (const c of CATEGORIES) {
      catIds.set(
        c.slug,
        Number(
          insCat.run(c.slug, c.name, CATEGORY_COLORS[c.slug]).lastInsertRowid,
        ),
      );
    }

    const insItem = sqlite.prepare(
      "INSERT INTO menu_items (name, category_id, price, is_active, popularity) VALUES (?, ?, ?, 1, ?)",
    );
    const items = MENU.map((m) => ({
      id: Number(
        insItem.run(m.name, catIds.get(m.cat), m.price, m.w).lastInsertRowid,
      ),
      price: m.price,
      w: m.w,
    }));

    const insOrder = sqlite.prepare(
      "INSERT INTO orders (number, location_id, status, total, created_at) VALUES (?, ?, ?, ?, ?)",
    );
    const insOrderItem = sqlite.prepare(
      "INSERT INTO order_items (order_id, menu_item_id, qty, price) VALUES (?, ?, ?, ?)",
    );

    let orderCount = 0;
    let itemCount = 0;

    for (let li = 0; li < LOCATIONS.length; li++) {
      const loc = LOCATIONS[li];
      const locId = locIds[li];
      // Orders are numbered per location, like a real POS would do
      let orderNumber = 1 + Math.floor(rand() * 200);

      for (let day = new Date(firstDay); day <= today; day = addDays(day, 1)) {
        const weekday = (day.getDay() + 6) % 7; // 0=Mon
        const daysAgo = Math.round(
          (today.getTime() - day.getTime()) / 86_400_000,
        );
        // gentle upward trend: last 90 days ≈ +9-10% vs previous 90
        const trend = 1 + 0.18 * (1 - daysAgo / DAYS_BACK);
        const expected =
          loc.basePerDay *
          WEEKDAY_FACTOR[weekday] *
          trend *
          (0.86 + rand() * 0.28);
        const count = Math.max(6, Math.round(expected));
        const hourWeights = weekday >= 5 ? HOUR_WEEKEND : HOUR_WEEKDAY;
        const hourTotal = hourWeights.reduce((a, b) => a + b, 0);

        for (let k = 0; k < count; k++) {
          let r = rand() * hourTotal;
          let hour = HOURS[HOURS.length - 1];
          for (let hi = 0; hi < HOURS.length; hi++) {
            r -= hourWeights[hi];
            if (r <= 0) {
              hour = HOURS[hi];
              break;
            }
          }
          const ts = new Date(day);
          ts.setHours(
            hour,
            Math.floor(rand() * 60),
            Math.floor(rand() * 60),
            0,
          );
          if (ts > now) continue;

          const nLines = pick([1, 1, 1, 1, 1, 1, 2, 2, 2, 3]);
          const chosen = new Map<number, number>();
          for (let j = 0; j < nLines; j++) {
            const it = weighted(items, (i) => i.w);
            const qty = rand() < 0.88 ? 1 : 2;
            chosen.set(it.id, (chosen.get(it.id) ?? 0) + qty);
          }
          let total = 0;
          const lines: [number, number, number][] = [];
          for (const [itemId, qty] of chosen) {
            const price = items.find((i) => i.id === itemId)?.price ?? 0;
            total += price * qty;
            lines.push([itemId, qty, price]);
          }

          const minutesAgo = (now.getTime() - ts.getTime()) / 60_000;
          let status: string;
          if (minutesAgo < 15) {
            status = rand() < 0.65 ? "preparing" : "served";
          } else {
            status = rand() < 0.025 ? "cancelled" : "served";
          }

          const orderId = Number(
            insOrder.run(orderNumber++, locId, status, total, ts.getTime())
              .lastInsertRowid,
          );
          orderCount++;
          for (const [itemId, qty, price] of lines) {
            insOrderItem.run(orderId, itemId, qty, price);
            itemCount++;
          }
        }
      }
    }

    sqlite.exec("COMMIT");
    log(
      `Seeded ${orderCount} orders / ${itemCount} items in ${((Date.now() - started) / 1000).toFixed(1)}s`,
    );
  } catch (err) {
    sqlite.exec("ROLLBACK");
    throw err;
  }
}

// Allow running directly: `tsx src/db/seed.ts`
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  seed();
}
