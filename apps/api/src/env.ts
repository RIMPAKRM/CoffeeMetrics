import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const apiRoot = fileURLToPath(new URL("..", import.meta.url));
const envFile = new URL("../.env", import.meta.url);

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

export const env = z
  .object({
    PORT: z.coerce.number().int().default(3001),
    WEB_ORIGIN: z.url().default("http://localhost:3000"),
    DATABASE_PATH: z.string().default(`${apiRoot}data/coffeemetrics.db`),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    SEED_ON_START: z.coerce.boolean().default(true),
    SIMULATE_ORDERS: z.coerce.boolean().default(true),
  })
  .parse(process.env);
