import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./env";
import { logger } from "./lib/logger";
import { locationsRoutes } from "./routes/locations";
import { menuRoutes } from "./routes/menu";
import { metricsRoutes } from "./routes/metrics";
import { ordersRoutes } from "./routes/orders";

export function createApp() {
  const app = new Hono();

  app.use("*", secureHeaders());
  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return undefined;
        if (origin === env.WEB_ORIGIN) return origin;
        // Local dev / preview proxies on the loopback interface
        try {
          const host = new URL(origin).hostname;
          if (host === "localhost" || host === "127.0.0.1" || host === "[::1]")
            return origin;
        } catch {
          /* malformed origin → reject */
        }
        return undefined;
      },
    }),
  );
  app.use("*", async (c, next) => {
    const started = performance.now();
    await next();
    logger.info(
      {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        ms: Math.round(performance.now() - started),
      },
      "request",
    );
  });

  app.onError((err, c) => {
    logger.error({ err, path: c.req.path }, "unhandled error");
    return c.json(
      { error: { message: "Internal server error", code: "INTERNAL" } },
      500,
    );
  });
  app.notFound((c) =>
    c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404),
  );

  return app
    .basePath("/api")
    .get("/health", (c) =>
      c.json({ data: { status: "ok", time: new Date().toISOString() } }),
    )
    .route("/metrics", metricsRoutes)
    .route("/orders", ordersRoutes)
    .route("/menu", menuRoutes)
    .route("/locations", locationsRoutes);
}

export type AppType = ReturnType<typeof createApp>;
