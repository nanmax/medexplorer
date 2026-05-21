import { Elysia, t } from "elysia";
import type { Container } from "../../container";
import { searchQuerySchema } from "@medexplorer/shared";

export function searchRoutes(c: Container) {
  return new Elysia({ prefix: "/search" }).get(
    "/",
    async ({ query }) => {
      const parsed = searchQuerySchema.parse(query);
      return c.searchService.search(parsed.q, parsed.type, {
        cursor: parsed.cursor,
        limit: parsed.limit,
      });
    },
    {
      query: t.Object({
        q: t.String({ minLength: 1, maxLength: 200 }),
        type: t.Optional(t.Union([t.Literal("all"), t.Literal("folder"), t.Literal("file")])),
        cursor: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { summary: "Search folders and/or files by name (trigram)" },
    },
  );
}
