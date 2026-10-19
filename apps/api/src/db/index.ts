import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { env } from "../env";
import * as schema from "./schema";

mkdirSync(dirname(env.DATABASE_PATH), { recursive: true });

export const sqlite = new Database(env.DATABASE_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

const migrationsFolder = fileURLToPath(
  new URL("../../drizzle", import.meta.url),
);
if (!existsSync(migrationsFolder)) {
  throw new Error(
    "Drizzle migrations not found. Run `pnpm --filter api db:generate` first.",
  );
}
migrate(db, { migrationsFolder });
