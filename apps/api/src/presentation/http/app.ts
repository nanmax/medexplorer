import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import type { Container } from "../container";
import type { Env } from "../../config/env";
import { errorHandler } from "./middleware/error-handler";
import { rateLimit } from "./middleware/rate-limit";
import { foldersRoutes } from "./v1/folders.routes";
import { filesRoutes } from "./v1/files.routes";
import { searchRoutes } from "./v1/search.routes";

export function createApp(container: Container, env: Env) {
  return new Elysia()
    .use(errorHandler)
    .use(
      cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
      }),
    )
    .use(rateLimit({ capacity: 200, refillPerSecond: 100 }))
    .use(
      swagger({
        path: "/swagger",
        documentation: {
          info: {
            title: "Infokes MedExplorer API",
            version: "1.0.0",
            description: "REST API for the MedExplorer clinical repository.",
          },
          tags: [
            { name: "folders", description: "Folder tree operations" },
            { name: "files", description: "File operations" },
            { name: "search", description: "Search across folders and files" },
          ],
        },
      }),
    )
    .get("/healthz", () => ({ status: "ok", timestamp: new Date().toISOString() }))
    .group("/api/v1", (app) =>
      app.use(foldersRoutes(container)).use(filesRoutes(container)).use(searchRoutes(container)),
    );
}

export type App = ReturnType<typeof createApp>;
