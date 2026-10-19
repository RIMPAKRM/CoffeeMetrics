// Migration runner — `pnpm --filter api db:migrate`.
// Migrations also run automatically at API startup via src/db/index.ts.
import "../db/index";
import { logger } from "../lib/logger";

logger.info("Migrations applied");
