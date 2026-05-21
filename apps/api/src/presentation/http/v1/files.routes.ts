import { Elysia, t } from "elysia";
import type { Container } from "../../container";

export function filesRoutes(c: Container) {
  return new Elysia({ prefix: "/files" })
    .get(
      "/:id",
      async ({ params }) => c.fileService.getById(params.id),
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        detail: { summary: "Get file details" },
      },
    )
    .delete(
      "/:id",
      async ({ params, set }) => {
        await c.fileService.remove(params.id);
        set.status = 204;
        return null;
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        detail: { summary: "Delete a file" },
      },
    );
}
