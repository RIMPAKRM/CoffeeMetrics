import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  openUntil: text("open_until").notNull(),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const menuItems = sqliteTable(
  "menu_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    price: integer("price").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    popularity: real("popularity").notNull().default(1),
  },
  (t) => [index("idx_menu_items_category").on(t.categoryId)],
);

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    number: integer("number").notNull(),
    locationId: integer("location_id")
      .notNull()
      .references(() => locations.id),
    status: text("status", {
      enum: ["preparing", "served", "cancelled"],
    }).notNull(),
    total: integer("total").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    uniqueIndex("idx_orders_location_number").on(t.locationId, t.number),
    index("idx_orders_created").on(t.createdAt),
    index("idx_orders_location_created").on(t.locationId, t.createdAt),
    index("idx_orders_status").on(t.status),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: integer("menu_item_id")
      .notNull()
      .references(() => menuItems.id),
    qty: integer("qty").notNull(),
    price: integer("price").notNull(),
  },
  (t) => [
    index("idx_order_items_order").on(t.orderId),
    index("idx_order_items_item").on(t.menuItemId),
  ],
);
