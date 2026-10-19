import { pino } from "pino";
import { env } from "../env";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "coffeemetrics-api" },
  transport:
    env.NODE_ENV === "development" || process.stdout.isTTY
      ? {
          target: "pino-pretty",
          options: {
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname,service",
          },
        }
      : undefined,
});
