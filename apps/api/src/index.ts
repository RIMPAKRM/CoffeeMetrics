import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { seedIfEmpty } from "./db/seed";
import { env } from "./env";
import { logger } from "./lib/logger";
import { startOrderSimulator } from "./lib/simulator";

if (env.SEED_ON_START) {
  seedIfEmpty((msg) => logger.info(msg));
}

const app = createApp();

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info(`API listening on http://localhost:${info.port}`);
});

const stopSimulator = env.SIMULATE_ORDERS ? startOrderSimulator() : () => {};

function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  stopSimulator();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
